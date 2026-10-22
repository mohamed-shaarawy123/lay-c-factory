const { randomInt, randomBytes, createHash, createCipheriv, createDecipheriv } = require("crypto");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { readPayload } = require("../lib/body");
const { requireAdmin, logAdmin, meetLink } = require("../lib/admin-auth");
const { signedExcelUrl, orderToExcelCsv } = require("../lib/order-excel");
const { trackingState, stageIndex } = require("../lib/order-stages");
const { buildOrderDocument } = require("../lib/order-document");
const { renderOrderPdf } = require("../lib/order-pdf");
const redeemAttempts = new Map();

function loadEnv() {
  try {
    const file = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(file)) return;
    fs.readFileSync(file, "utf8")
      .split(/\n/)
      .forEach((line) => {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m || process.env[m[1]]) return;
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      });
  } catch (e) {}
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function text(v, max) {
  return String(v == null ? "" : v)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function supabaseAdmin() {
  const url = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
  if (!url || !key) {
    const err = new Error("Supabase is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function itemsOf(row) {
  return row && row.items && typeof row.items === "object" ? row.items : {};
}

function orderTypeOf(row) {
  const items = itemsOf(row);
  if (row.status === "room" || items.order_type === "seniors_excel") return "Full Excel / Seniors sheet";
  if (items.order_type === "seniors" || items.slug === "seniors-uniform") return "Seniors";
  if (items.service || items.slug) return items.service || items.slug;
  if (row.status === "meeting") return "Meeting room";
  return row.status || "order";
}

function orderBrief(row) {
  const items = itemsOf(row);
  const secretKeys = ["pass", "salt", "token", "image", "thumb", "code_hash", "code_seal"];
  const safeItems = {};
  Object.keys(items).forEach((k) => {
    if (secretKeys.includes(k) || k === "rows" || k === "lines") return;
    const v = items[k];
    if (typeof v === "string" && v.length > 500) safeItems[k] = v.slice(0, 500) + "…";
    else safeItems[k] = v;
  });
  if (Array.isArray(items.rows)) safeItems.row_count = items.rows.length;
  if (Array.isArray(items.lines)) {
    safeItems.line_count = items.lines.length;
    safeItems.lines = items.lines;
  }
  return {
    id: row.id,
    name: row.customer_name || "",
    email: row.customer_email || "",
    phone: row.customer_phone || "",
    address: row.delivery_address || "",
    total: row.total,
    status: row.status || "",
    created_at: row.created_at || "",
    updated_at: items.updated_at || items.excel_updated_at || row.created_at || "",
    order_type: orderTypeOf(row),
    source: items.source || items.slug || items.type || row.status || "",
    code: items.code || "",
    has_excel: Boolean(items.excel_path || items.has_excel),
    excel_path: items.excel_path || "",
    excel_updated_at: items.excel_updated_at || "",
    shared: items.shared !== false,
    private: items.private !== false,
    service: items.service || items.type || "",
    hidden: Boolean(items.hidden),
    active: items.active === true,
    closed: Boolean(items.closed),
    room_name: items.name || items.room_name || "",
    starts_at: items.starts_at || "",
    duration_min: items.duration_min || null,
    rating: items.r || null,
    review: items.t || "",
    moderated: Boolean(items.moderated),
    rejected: Boolean(items.rejected),
    items: safeItems,
  };
}

function hashInviteCode(code) {
  return createHash("sha256").update(String(code || "").trim().toLowerCase()).digest("hex");
}

function makeInviteCode() {
  return randomBytes(5).toString("hex"); // 10 hex chars
}

function inviteKey() {
  const secret = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!secret) return null;
  return createHash("sha256").update("layc-invite-v1:" + secret).digest();
}

function sealCode(code) {
  const key = inviteKey();
  if (!key) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(code), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function openSeal(box) {
  try {
    const key = inviteKey();
    if (!key || !box) return "";
    const buf = Buffer.from(String(box), "base64url");
    if (buf.length < 29) return "";
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch (e) {
    return "";
  }
}

async function inviteFromOrders(supabase, codeHash) {
  const filtered = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, items")
    .eq("status", "meet_invite")
    .eq("items->>code_hash", codeHash)
    .limit(1);
  if (!filtered.error && filtered.data && filtered.data[0] && itemsOf(filtered.data[0]).code_hash === codeHash) {
    return { row: filtered.data[0], error: null };
  }
  if (filtered.error && !/column|operator|json|schema/i.test(filtered.error.message || "")) {
    return { row: null, error: filtered.error };
  }
  const scan = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, items, created_at")
    .eq("status", "meet_invite")
    .order("created_at", { ascending: false })
    .limit(200);
  if (scan.error) return { row: null, error: scan.error };
  const hit = (scan.data || []).find((row) => itemsOf(row).code_hash === codeHash) || null;
  return { row: hit, error: null };
}

function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  const cur = redeemAttempts.get(key) || { n: 0, t: now };
  if (now - cur.t > windowMs) {
    redeemAttempts.set(key, { n: 1, t: now });
    return false;
  }
  cur.n += 1;
  redeemAttempts.set(key, cur);
  return cur.n > limit;
}

function photoBrief(row) {
  const items = itemsOf(row);
  return {
    id: row.id,
    name: row.customer_name || "",
    email: row.customer_email || "",
    created_at: row.created_at || "",
    shared: items.shared !== false,
    private: Boolean(items.private),
    moderated: Boolean(items.moderated),
    rejected: Boolean(items.rejected),
    source: items.source || "",
    thumb: typeof items.thumb === "string" ? items.thumb : "",
    has_image: Boolean(items.image || items.thumb),
  };
}

function csvEscape(v) {
  const s = String(v == null ? "" : v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(rows, columns) {
  const head = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => csvEscape(typeof c.get === "function" ? c.get(row) : row[c.key])).join(","))
    .join("\r\n");
  return "\uFEFF" + head + "\r\n" + body;
}

function pageSlice(list, page, pageSize) {
  const size = Math.max(1, Math.min(100, Number(pageSize) || 25));
  const p = Math.max(1, Number(page) || 1);
  const start = (p - 1) * size;
  return { rows: list.slice(start, start + size), page: p, pageSize: size, total: list.length, pages: Math.max(1, Math.ceil(list.length / size)) };
}

function matchQuery(row, q) {
  if (!q) return true;
  const hay = [row.name, row.email, row.phone, row.status, row.code, row.service, row.id, row.room_name, row.review]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

async function fetchOrders(supabase, statuses) {
  let query = supabase
    .from("orders")
    .select("id, customer_name, customer_email, customer_phone, delivery_address, total, status, created_at, items")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (statuses && statuses.length === 1) query = query.eq("status", statuses[0]);
  else if (statuses && statuses.length > 1) query = query.in("status", statuses);
  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message || "The list could not be opened.");
    err.status = 502;
    throw err;
  }
  return data || [];
}

const TRACK_STATUSES = ["received", "notified", "processing", "done"];

function trackingBrief(row) {
  const items = itemsOf(row);
  const track = trackingState(items.slug || "", items.stage);
  return {
    id: row.id,
    name: row.customer_name || "",
    email: row.customer_email || "",
    title: items.service || track.slug || "Order",
    slug: track.slug,
    created_at: row.created_at,
    status: row.status,
    stage: track.stage,
    stages: track.stages,
    complete: track.complete,
    current: track.current,
    progress: track.progress,
  };
}

module.exports = async function handler(req, res) {
  try {
    loadEnv();
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use POST." });
    const payload = await readPayload(req);
    if (!payload) return json(res, 400, { ok: false, error: "The request is missing." });

    let supabase;
    try {
      supabase = supabaseAdmin();
    } catch (err) {
      return json(res, err.status || 500, { ok: false, error: err.message });
    }

    const op = text(payload.op, 40);

    // Public: redeem a private emailed access code (no public room list).
    if (op === "available") {
      return json(res, 200, { ok: true, rooms: [] });
    }

    if (op === "join" || op === "redeem") {
      const email = text(payload.email || payload.customer_email, 160).toLowerCase();
      const access = text(payload.access_code || payload.code, 40).toLowerCase();
      const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "ip").split(",")[0].trim();
      if (rateLimited("join:" + ip, 20, 15 * 60 * 1000) || rateLimited("join-mail:" + email, 12, 15 * 60 * 1000)) {
        return json(res, 429, { ok: false, error: "Too many attempts. Try again in a few minutes." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(res, 400, { ok: false, error: "Enter the email address that received the invite." });
      }
      if (access.length < 8) {
        return json(res, 400, { ok: false, error: "Enter the access code from your email." });
      }
      const codeHash = hashInviteCode(access);
      let inviteRow = null;
      let inviteSource = "table";
      const invite = await supabase
        .from("meeting_invites")
        .select("id, meeting_id, email, expires_at, redeemed_at")
        .eq("code_hash", codeHash)
        .maybeSingle();
      const tableMissing = invite.error && /meeting_invites|schema cache|does not exist/i.test(invite.error.message || "");
      if (invite.error && !tableMissing) {
        return json(res, 502, { ok: false, error: invite.error.message || "The invite could not be checked." });
      }
      if (!tableMissing && invite.data) {
        inviteRow = Object.assign({ revoked_at: null }, invite.data);
      } else {
        // Invites are saved on orders (status=meet_invite). A live meeting_invites
        // table with no matching row must not hide that record.
        inviteSource = "orders";
        const fallback = await inviteFromOrders(supabase, codeHash);
        if (fallback.error) {
          return json(res, 502, { ok: false, error: fallback.error.message || "The invite could not be checked." });
        }
        if (fallback.row) {
          const it = itemsOf(fallback.row);
          inviteRow = {
            id: fallback.row.id,
            meeting_id: it.meeting_id,
            email: fallback.row.customer_email || it.email,
            expires_at: it.expires_at,
            redeemed_at: it.redeemed_at || null,
            revoked_at: it.revoked_at || null,
          };
        }
      }
      if (!inviteRow) return json(res, 404, { ok: false, error: "That access code was not found. Check the code and the email it was sent to." });
      if (String(inviteRow.email).toLowerCase() !== email) {
        return json(res, 403, { ok: false, error: "This access code was sent to a different email." });
      }
      if (inviteRow.revoked_at) {
        return json(res, 403, { ok: false, error: "This access code was revoked." });
      }
      if (inviteRow.redeemed_at) {
        return json(res, 403, { ok: false, error: "This access code was already used." });
      }
      if (new Date(inviteRow.expires_at).getTime() < Date.now()) {
        return json(res, 403, { ok: false, error: "This access code has expired." });
      }
      const meeting = await supabase
        .from("orders")
        .select("id, customer_name, items, status")
        .eq("id", inviteRow.meeting_id)
        .eq("status", "meeting")
        .maybeSingle();
      if (meeting.error || !meeting.data) {
        return json(res, 404, { ok: false, error: "This meeting is no longer available." });
      }
      const items = itemsOf(meeting.data);
      if (items.closed) return json(res, 403, { ok: false, error: "This meeting has ended." });
      if (items.active === false) {
        return json(res, 403, { ok: false, error: "This meeting has not been activated yet." });
      }
      const roomCode = text(items.code, 12).replace(/\D/g, "");
      if (roomCode.length !== 6) {
        return json(res, 502, { ok: false, error: "This meeting room is misconfigured." });
      }
      const redeemedAt = new Date().toISOString();
      if (inviteSource === "table") {
        const marked = await supabase
          .from("meeting_invites")
          .update({ redeemed_at: redeemedAt })
          .eq("id", inviteRow.id)
          .is("redeemed_at", null)
          .select("id")
          .maybeSingle();
        if (marked.error || !marked.data) {
          return json(res, 403, { ok: false, error: "This access code was already used." });
        }
      } else {
        const cur = await supabase.from("orders").select("id, items").eq("id", inviteRow.id).maybeSingle();
        const it = itemsOf(cur.data);
        if (it.redeemed_at) return json(res, 403, { ok: false, error: "This access code was already used." });
        await supabase
          .from("orders")
          .update({ items: Object.assign({}, it, { redeemed_at: redeemedAt }) })
          .eq("id", inviteRow.id);
      }
      return json(res, 200, {
        ok: true,
        name: items.name || meeting.data.customer_name || "Lay C meeting",
        link: meetLink(roomCode),
        room: "LAYC-" + roomCode,
      });
    }

    // Signed-in recipient only. The code is never returned without their account token.
    if (op === "my_invite") {
      const token = text(payload.token, 80);
      if (token.length < 16) return json(res, 401, { ok: false, error: "Sign in to load your access code." });
      const account = await supabase
        .from("orders")
        .select("id, customer_email, customer_name, items")
        .eq("status", "account")
        .eq("items->>token", token)
        .maybeSingle();
      if (account.error || !account.data) {
        return json(res, 401, { ok: false, error: "Sign in to load your access code." });
      }
      const email = String(account.data.customer_email || "").trim().toLowerCase();
      const list = await supabase
        .from("orders")
        .select("id, customer_name, items, created_at")
        .eq("status", "meet_invite")
        .eq("customer_email", email)
        .order("created_at", { ascending: false })
        .limit(8);
      if (list.error) return json(res, 502, { ok: false, error: "Your invite could not be loaded." });
      const now = Date.now();
      const row = (list.data || []).find((r) => {
        const it = itemsOf(r);
        if (!it.code_seal || it.revoked_at || it.redeemed_at) return false;
        return new Date(it.expires_at).getTime() >= now;
      });
      if (!row) return json(res, 200, { ok: true, pending: false });
      const it = itemsOf(row);
      const access = openSeal(it.code_seal);
      if (!access || hashInviteCode(access) !== it.code_hash) {
        return json(res, 200, { ok: true, pending: false });
      }
      return json(res, 200, {
        ok: true,
        pending: true,
        access_code: access,
        email,
        name: it.recipient_name || account.data.customer_name || "",
      });
    }

    const who = await requireAdmin(supabase, text(payload.token, 80));
    if (!who) return json(res, 403, { ok: false, error: "Sign in with an authorized admin account." });

    const q = text(payload.q, 120).toLowerCase();
    const page = Number(payload.page) || 1;
    const pageSize = Number(payload.pageSize) || 25;

    if (op === "me" || op === "session") {
      return json(res, 200, {
        ok: true,
        email: who.customer_email,
        name: who.customer_name || "",
        staff: true,
      });
    }

    if (op === "overview") {
      const rows = await fetchOrders(supabase, null);
      const counts = {};
      rows.forEach((r) => {
        counts[r.status || "other"] = (counts[r.status || "other"] || 0) + 1;
      });
      const recent = rows.slice(0, 12).map(orderBrief);
      return json(res, 200, {
        ok: true,
        email: who.customer_email,
        counts,
        recent,
        totals: {
          orders: rows.filter((r) => ["received", "notified", "processing", "done", "cancelled", "room"].includes(r.status)).length,
          accounts: counts.account || 0,
          photos: counts.photo || 0,
          meetings: counts.meeting || 0,
          rooms: counts.room || 0,
          reviews: counts.review || 0,
          logs: counts.admin_log || 0,
          all: rows.length,
        },
      });
    }

    if (op === "order_tracking") {
      const raw = await fetchOrders(supabase, TRACK_STATUSES);
      const rows = raw
        .filter((row) => TRACK_STATUSES.includes(row.status))
        .map(trackingBrief)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return json(res, 200, { ok: true, orders: rows });
    }

    if (op === "order_tracking_advance") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That order was not found." });
      const row = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, status, created_at, items")
        .eq("id", id)
        .maybeSingle();
      if (row.error || !row.data || !TRACK_STATUSES.includes(row.data.status)) {
        return json(res, 404, { ok: false, error: "That order was not found." });
      }
      const items = itemsOf(row.data);
      const current = stageIndex(items.stage);
      const track = trackingState(items.slug || "", current);
      if (track.complete) return json(res, 400, { ok: false, error: "This order is already complete." });
      const expected = Number(payload.stage);
      if (!Number.isInteger(expected) || expected !== current) {
        return json(res, 409, { ok: false, error: "This order was already updated. Refresh and try again." });
      }
      const nextItems = Object.assign({}, items, {
        stage: current + 1,
        updated_at: new Date().toISOString(),
      });
      const saved = await supabase.from("orders").update({ items: nextItems }).eq("id", id).eq("items->>stage", String(current)).select("id, items, status, created_at, customer_name, customer_email").maybeSingle();
      if (saved.error) return json(res, 502, { ok: false, error: "The stage was not saved." });
      if (!saved.data) {
        const missing = items.stage == null && current === 0;
        if (!missing) return json(res, 409, { ok: false, error: "This order was already updated. Refresh and try again." });
        const first = await supabase.from("orders").update({ items: nextItems }).eq("id", id).is("items->>stage", null).select("id, items, status, created_at, customer_name, customer_email").maybeSingle();
        if (first.error || !first.data) return json(res, 409, { ok: false, error: "This order was already updated. Refresh and try again." });
        await logAdmin(supabase, who, "order_tracking", { id, stage: current + 1 });
        return json(res, 200, { ok: true, order: trackingBrief(first.data) });
      }
      await logAdmin(supabase, who, "order_tracking", { id, stage: current + 1 });
      return json(res, 200, { ok: true, order: trackingBrief(saved.data) });
    }

    if (op === "list" || op === "orders") {
      const status = text(payload.status, 40);
      const typeFilter = text(payload.order_type || payload.type, 40).toLowerCase();
      const orderStatuses = ["received", "notified", "processing", "done", "cancelled", "room"];
      let statuses = null;
      if (status === "orders" || status === "received" || (!status && op === "orders")) statuses = orderStatuses;
      else if (status) statuses = [status];
      const raw = await fetchOrders(supabase, statuses);
      let briefs = raw.map(orderBrief);
      if (status === "orders" || (!status && op === "orders")) {
        briefs = briefs.filter((r) => orderStatuses.includes(r.status));
      }
      if (typeFilter === "seniors" || typeFilter === "excel") {
        briefs = briefs.filter((r) => r.status === "room" || /senior|excel/i.test(r.order_type + " " + r.source));
      } else if (typeFilter === "quote") {
        briefs = briefs.filter((r) => r.status !== "room");
      }
      if (payload.from) briefs = briefs.filter((r) => !r.created_at || r.created_at >= text(payload.from, 40));
      if (payload.to) briefs = briefs.filter((r) => !r.created_at || r.created_at.slice(0, 10) <= text(payload.to, 40));
      briefs = briefs.filter((r) => matchQuery(r, q) || String(r.order_type).toLowerCase().includes(q));
      if (payload.sort === "oldest") briefs.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      else briefs.sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
      const sliced = pageSlice(briefs, page, pageSize);
      return json(res, 200, { ok: true, email: who.customer_email, ...sliced });
    }

    if (op === "excel_download" || op === "order_excel") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That order was not found." });
      const row = await supabase
        .from("orders")
        .select("id, status, items, total, customer_name, customer_email, customer_phone, delivery_address, created_at")
        .eq("id", id)
        .maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That order was not found." });
      const items = itemsOf(row.data);
      if (items.excel_path) {
        const url = await signedExcelUrl(supabase, items.excel_path, 600);
        if (!url) return json(res, 502, { ok: false, error: "The download link could not be created." });
        await logAdmin(supabase, who, "excel_download", { id, source: "storage" });
        return json(res, 200, {
          ok: true,
          url,
          expires_in: 600,
          filename: path.basename(items.excel_path),
          source: "storage",
        });
      }
      // Generate an order-specific Excel-compatible CSV when no stored file exists.
      const csv = orderToExcelCsv(row.data);
      const filename = "lay-c-order-" + String(id).slice(0, 8) + ".csv";
      await logAdmin(supabase, who, "excel_download", { id, source: "generated" });
      return json(res, 200, {
        ok: true,
        csv,
        filename,
        mime: "text/csv; charset=utf-8",
        source: "generated",
      });
    }

    if (op === "order_document" || op === "view_order") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That order was not found." });
      const row = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, customer_phone, delivery_address, total, status, created_at, items")
        .eq("id", id)
        .maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That order was not found." });
      if (["account", "admin_log"].includes(row.data.status)) {
        return json(res, 400, { ok: false, error: "That record is not an order document." });
      }
      const document = buildOrderDocument(row.data);
      return json(res, 200, { ok: true, document, brief: orderBrief(row.data) });
    }

    if (op === "order_pdf") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That order was not found." });
      const row = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, customer_phone, delivery_address, total, status, created_at, items")
        .eq("id", id)
        .maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That order was not found." });
      if (["account", "admin_log", "photo"].includes(row.data.status)) {
        return json(res, 400, { ok: false, error: "PDF export is only available for orders and sheets." });
      }
      const pdf = await renderOrderPdf(row.data);
      const filename = "lay-c-order-" + String(id).slice(0, 8) + ".pdf";
      await logAdmin(supabase, who, "order_pdf", { id, bytes: pdf.length });
      return json(res, 200, {
        ok: true,
        filename,
        mime: "application/pdf",
        pdf_base64: pdf.toString("base64"),
        bytes: pdf.length,
      });
    }

    if (op === "get") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That record was not found." });
      const row = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, customer_phone, delivery_address, total, status, created_at, items")
        .eq("id", id)
        .maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That record was not found." });
      const brief = orderBrief(row.data);
      const rawItems = itemsOf(row.data);
      if (row.data.status === "photo") {
        brief.thumb = typeof rawItems.thumb === "string" ? rawItems.thumb : "";
        brief.has_image = Boolean(rawItems.image || rawItems.thumb);
        brief.image = typeof rawItems.image === "string" ? rawItems.image : "";
      }
      if (row.data.status === "account") {
        brief.items = { type: "account", has_password: Boolean(rawItems.pass) };
      }
      if (row.data.status === "room") {
        brief.sheet_items = Array.isArray(rawItems.items) ? rawItems.items : [];
        brief.sheet_rows = Array.isArray(rawItems.rows) ? rawItems.rows.slice(0, 500) : [];
        brief.sheet_ex = rawItems.ex || null;
      }
      if (!["account", "admin_log"].includes(row.data.status)) {
        brief.document = buildOrderDocument(row.data);
      }
      return json(res, 200, { ok: true, row: brief });
    }

    if (op === "customer_activity") {
      const emailKey = text(payload.email || payload.customer_email, 160).toLowerCase();
      const filter = text(payload.filter || "all", 40).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKey)) {
        return json(res, 400, { ok: false, error: "Enter a valid customer email." });
      }
      const all = await fetchOrders(supabase, null);
      const linked = all.filter((r) => String(r.customer_email || "").trim().toLowerCase() === emailKey);
      const account = linked.find((r) => r.status === "account");
      const accountItems = itemsOf(account);
      const profile = {
        email: emailKey,
        name: (account && account.customer_name) || linked.find((r) => r.customer_name)?.customer_name || "Not provided",
        phone: (account && account.customer_phone) || linked.find((r) => r.customer_phone)?.customer_phone || "Not provided",
        has_account: Boolean(account),
        account_id: account ? account.id : null,
        last_at: linked.reduce((best, r) => (!best || (r.created_at && r.created_at > best) ? r.created_at : best), ""),
        // Never expose credentials
        last_seen: accountItems.last_seen || accountItems.seen_at || null,
      };
      const asActivity = (row) => {
        const it = itemsOf(row);
        const kind =
          row.status === "photo"
            ? "photo"
            : row.status === "review"
              ? "review"
              : row.status === "meeting" || row.status === "meet_invite"
                ? "meeting"
                : row.status === "room"
                  ? "order"
                  : ["received", "notified", "processing", "done", "cancelled"].includes(row.status)
                    ? "order"
                    : row.status === "account"
                      ? "account"
                      : "other";
        return {
          id: row.id,
          kind,
          status: row.status,
          title:
            row.status === "photo"
              ? it.shared !== false
                ? "Family album photo"
                : "Private binder photo"
              : row.status === "review"
                ? "Review"
                : row.status === "meet_invite"
                  ? "Meeting invite"
                  : row.status === "meeting"
                    ? it.name || "Meeting room"
                    : orderTypeOf(row),
          name: row.customer_name || "",
          email: row.customer_email || "",
          total: row.total,
          created_at: row.created_at,
          has_excel: Boolean(it.excel_path || it.has_excel),
          thumb: typeof it.thumb === "string" ? it.thumb : "",
          shared: it.shared !== false,
          moderated: Boolean(it.moderated),
          rating: it.r || null,
          review: typeof it.t === "string" ? it.t : "",
          code: it.code || "",
        };
      };
      let activity = linked
        .filter((r) => r.status !== "account" && r.status !== "admin_log")
        .map(asActivity)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      if (filter === "orders") activity = activity.filter((a) => a.kind === "order");
      else if (filter === "photos") activity = activity.filter((a) => a.kind === "photo");
      else if (filter === "reviews") activity = activity.filter((a) => a.kind === "review");
      else if (filter === "meetings") activity = activity.filter((a) => a.kind === "meeting");
      else if (filter === "marketing") {
        activity = activity.filter((a) => a.kind === "order" && /design|web|manufactur|quote|marketing/i.test(a.title + " " + a.status));
      }
      const unlinkedPhotos = all
        .filter((r) => r.status === "photo")
        .filter((r) => {
          const em = String(r.customer_email || "").trim().toLowerCase();
          return !em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
        })
        .map(asActivity);
      const counts = {
        orders: linked.filter((r) => ["received", "notified", "processing", "done", "cancelled", "room"].includes(r.status)).length,
        photos: linked.filter((r) => r.status === "photo").length,
        reviews: linked.filter((r) => r.status === "review").length,
        meetings: linked.filter((r) => r.status === "meeting" || r.status === "meet_invite").length,
        unlinked_photos: unlinkedPhotos.length,
      };
      return json(res, 200, {
        ok: true,
        profile,
        counts,
        activity,
        unlinked_photos: filter === "unlinked" || filter === "photos_unlinked" ? unlinkedPhotos : [],
      });
    }

    if (op === "photos_unlinked") {
      const all = await fetchOrders(supabase, ["photo"]);
      let briefs = all
        .map(photoBrief)
        .filter((r) => {
          const em = String(r.email || "").trim().toLowerCase();
          return !em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
        });
      if (q) briefs = briefs.filter((r) => matchQuery(r, q));
      const sliced = pageSlice(briefs, page, pageSize);
      return json(res, 200, { ok: true, ...sliced });
    }

    if (op === "update_status") {
      const id = text(payload.id, 80);
      const status = text(payload.status, 40);
      const note = text(payload.note, 400);
      const allowed = ["received", "notified", "processing", "done", "cancelled", "review", "meeting", "room", "photo"];
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That record was not found." });
      if (!allowed.includes(status)) return json(res, 400, { ok: false, error: "That status is not allowed." });
      const cur = await supabase.from("orders").select("id, status, items").eq("id", id).maybeSingle();
      if (cur.error || !cur.data) return json(res, 404, { ok: false, error: "That record was not found." });
      if (cur.data.status === "account") return json(res, 400, { ok: false, error: "Account records cannot change status this way." });
      const items = Object.assign({}, itemsOf(cur.data), note ? { admin_note: note } : {});
      const saved = await supabase.from("orders").update({ status, items }).eq("id", id).select("id").single();
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "Status was not updated." });
      await logAdmin(supabase, who, "update_status", { id, status, note });
      return json(res, 200, { ok: true });
    }

    if (op === "photo_hide" || op === "photo_moderate_hide") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That photo was not found." });
      const row = await supabase.from("orders").select("id, status, items, customer_email").eq("id", id).eq("status", "photo").maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That photo was not found." });
      const items = Object.assign({}, itemsOf(row.data), {
        admin_hidden: true,
        hidden: true,
        shared: false,
        moderated: true,
      });
      const saved = await supabase.from("orders").update({ items }).eq("id", id).select("id").single();
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The photo was not hidden." });
      await logAdmin(supabase, who, "photo_hide", { id, email: row.data.customer_email });
      return json(res, 200, { ok: true, hidden: true });
    }

    if (op === "delete") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That record was not found." });
      const row = await supabase.from("orders").select("id, status, customer_email, items").eq("id", id).maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That record was not found." });
      if (row.data.status === "account" && String(row.data.customer_email).toLowerCase() === String(who.customer_email).toLowerCase()) {
        return json(res, 400, { ok: false, error: "The admin account stays so you can keep signing in." });
      }
      // Admins may remove public photos for moderation; owner one-way lock does not apply.
      const gone = await supabase.from("orders").delete().eq("id", id).select("id");
      if (gone.error) return json(res, 502, { ok: false, error: gone.error.message || "It was not deleted." });
      await logAdmin(supabase, who, "delete", {
        id,
        status: row.data.status,
        photo_was_public: row.data.status === "photo" ? Boolean(itemsOf(row.data).shared || itemsOf(row.data).publish_locked) : undefined,
      });
      return json(res, 200, { ok: true });
    }

    if (op === "meet" || op === "meet_create") {
      let code = text(payload.code, 12).replace(/\D/g, "");
      if (code && code.length !== 6) return json(res, 400, { ok: false, error: "Room codes must be 6 digits." });
      if (!code) {
        for (let n = 0; n < 12; n++) {
          code = String(100000 + randomInt(900000));
          const exists = await supabase.from("orders").select("id").eq("status", "meeting").eq("items->>code", code).maybeSingle();
          if (!exists.data) break;
        }
      } else {
        const exists = await supabase.from("orders").select("id").eq("status", "meeting").eq("items->>code", code).maybeSingle();
        if (exists.data) return json(res, 409, { ok: false, error: "That meeting code is already in use." });
      }
      const name = text(payload.name || payload.room_name, 80) || "Meeting " + code;
      const starts_at = text(payload.starts_at || payload.date, 40);
      const duration_min = Math.max(0, Math.min(24 * 60, Number(payload.duration_min || payload.duration) || 60));
      const saved = await supabase
        .from("orders")
        .insert({
          customer_name: name,
          customer_email: who.customer_email,
          customer_phone: "",
          delivery_address: "",
          items: {
            type: "meeting",
            code,
            name,
            starts_at,
            duration_min,
            private: true,
            // Private by default: not joinable until admin activates + sends invite codes.
            active: payload.active === true || payload.active === "true",
            closed: false,
            link: meetLink(code),
          },
          total: 0,
          status: "meeting",
        })
        .select("id")
        .single();
      if (saved.error || !saved.data) {
        return json(res, 502, { ok: false, error: (saved.error && saved.error.message) || "The meeting room was not saved." });
      }
      await logAdmin(supabase, who, "meet_create", { id: saved.data.id, code, name, private: true });
      return json(res, 200, { ok: true, code, id: saved.data.id, link: meetLink(code), name, private: true });
    }

    if (op === "account_directory") {
      const qDir = text(payload.q, 120).toLowerCase();
      const accounts = await fetchOrders(supabase, ["account"]);
      const emailOnly = await fetchOrders(supabase, ["received", "notified", "processing", "done", "room", "photo", "review"]);
      const map = new Map();
      accounts.forEach((r) => {
        const em = String(r.customer_email || "")
          .trim()
          .toLowerCase();
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return;
        map.set(em, {
          email: em,
          name: r.customer_name || "",
          phone: r.customer_phone || "",
          has_account: true,
          account_id: r.id,
        });
      });
      emailOnly.forEach((r) => {
        const em = String(r.customer_email || "")
          .trim()
          .toLowerCase();
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return;
        if (map.has(em)) {
          const cur = map.get(em);
          if (!cur.name && r.customer_name) cur.name = r.customer_name;
          if (!cur.phone && r.customer_phone) cur.phone = r.customer_phone;
          return;
        }
        map.set(em, {
          email: em,
          name: r.customer_name || "",
          phone: r.customer_phone || "",
          has_account: false,
          account_id: null,
        });
      });
      let rows = [...map.values()].sort((a, b) => {
        if (a.has_account !== b.has_account) return a.has_account ? -1 : 1;
        return String(a.name || a.email).localeCompare(String(b.name || b.email));
      });
      if (qDir) {
        rows = rows.filter((r) => [r.name, r.email, r.phone].join(" ").toLowerCase().includes(qDir));
      }
      return json(res, 200, { ok: true, rows: rows.slice(0, 200) });
    }

    if (op === "meet_invite" || op === "meet_invite_send") {
      const id = text(payload.id || payload.meeting_id, 80);
      const email = text(payload.email || payload.customer_email, 160).toLowerCase();
      const recipientName = text(payload.recipient_name || payload.name, 120);
      const hours = Math.max(1, Math.min(72, Number(payload.expires_hours) || 24));
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "Choose a meeting room." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(res, 400, { ok: false, error: "Enter a valid recipient email." });
      }
      const meeting = await supabase.from("orders").select("id, customer_name, items, status").eq("id", id).eq("status", "meeting").maybeSingle();
      if (meeting.error || !meeting.data) return json(res, 404, { ok: false, error: "That meeting room was not found." });
      const items = itemsOf(meeting.data);
      if (items.closed) return json(res, 400, { ok: false, error: "This meeting is closed." });
      // The code is delivered to this website account, not by Gmail.
      let name = recipientName;
      const account = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, items")
        .eq("status", "account")
        .eq("customer_email", email)
        .maybeSingle();
      if (account.error) return json(res, 502, { ok: false, error: account.error.message || "That account could not be checked." });
      if (!account.data) {
        return json(res, 400, {
          ok: false,
          error: "Choose an account that is signed up on the website. The code is sent to that signed-in account, not by Gmail.",
        });
      }
      const accountItems = itemsOf(account.data);
      if (!accountItems.token) {
        return json(res, 400, { ok: false, error: "That account has not signed in on the website yet." });
      }
      if (!name) name = account.data.customer_name || "";
      const hasAccount = true;
      const access = makeInviteCode();
      const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const codeHash = hashInviteCode(access);
      // Store hashed invites on orders (status=meet_invite) so recipient metadata + revoke work
      // without requiring a separate public-readable codes table. Plaintext is never persisted.
      const inviteSource = "orders";
      const savedInvite = await supabase
        .from("orders")
        .insert({
          customer_name: name || "Invite " + email,
          customer_email: email,
          customer_phone: "",
          delivery_address: "",
          items: {
            type: "meet_invite",
            meeting_id: id,
            email,
            recipient_name: name || "",
            has_account: hasAccount,
            code_hash: codeHash,
            code_seal: sealCode(access),
            expires_at: expires,
            redeemed_at: null,
            revoked_at: null,
            created_by: who.customer_email,
          },
          total: 0,
          status: "meet_invite",
        })
        .select("id")
        .single();
      if (savedInvite.error || !savedInvite.data) {
        return json(res, 502, {
          ok: false,
          error: (savedInvite.error && savedInvite.error.message) || "The invite was not saved.",
        });
      }
      const inviteId = savedInvite.data.id;
      const roomName = items.name || meeting.data.customer_name || "Lay C meeting";
      void inviteSource;
      if (items.active !== true) {
        await supabase
          .from("orders")
          .update({ items: Object.assign({}, items, { active: true, private: true }) })
          .eq("id", id);
      }
      await logAdmin(supabase, who, "meet_invite", { meeting_id: id, email, invite_id: inviteId, source: inviteSource });
      // Plaintext code returned only once to the authenticated admin response — never stored in DB.
      return json(res, 200, {
        ok: true,
        invite_id: inviteId,
        email,
        recipient_name: name || "",
        has_account: hasAccount,
        expires_at: expires,
        sent: true,
        delivery: "account",
        access_code: access,
        room_name: roomName,
        room_code: items.code || "",
        meeting_id: id,
      });
    }

    if (op === "meet_invite_revoke") {
      const inviteId = text(payload.invite_id || payload.id, 80);
      const meetingId = text(payload.meeting_id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(inviteId)) return json(res, 400, { ok: false, error: "Choose an invitation." });
      const revokedAt = new Date().toISOString();
      // Prefer orders.meet_invite fallback (stores revoked_at in items).
      const asOrder = await supabase.from("orders").select("id, status, items, customer_email").eq("id", inviteId).maybeSingle();
      if (asOrder.data && asOrder.data.status === "meet_invite") {
        const it = itemsOf(asOrder.data);
        if (meetingId && it.meeting_id && it.meeting_id !== meetingId) {
          return json(res, 400, { ok: false, error: "That invitation does not belong to this room." });
        }
        const saved = await supabase
          .from("orders")
          .update({
            items: Object.assign({}, it, { revoked_at: revokedAt, expires_at: revokedAt }),
          })
          .eq("id", inviteId)
          .select("id")
          .single();
        if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "Invite was not revoked." });
        await logAdmin(supabase, who, "meet_invite_revoke", { invite_id: inviteId, email: asOrder.data.customer_email });
        return json(res, 200, { ok: true, revoked_at: revokedAt });
      }
      const past = revokedAt;
      const upd = await supabase.from("meeting_invites").update({ expires_at: past }).eq("id", inviteId).select("id, email").maybeSingle();
      if (upd.error && /meeting_invites|schema cache|does not exist/i.test(upd.error.message || "")) {
        return json(res, 404, { ok: false, error: "That invitation was not found." });
      }
      if (upd.error || !upd.data) return json(res, 404, { ok: false, error: "That invitation was not found." });
      await logAdmin(supabase, who, "meet_invite_revoke", { invite_id: inviteId, email: upd.data.email });
      return json(res, 200, { ok: true, revoked_at: past });
    }

    if (op === "meet_invites") {
      const id = text(payload.id || payload.meeting_id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "Choose a meeting room." });
      const inviteStatus = (row) => {
        if (row.revoked_at) return "revoked";
        if (row.redeemed_at) return "redeemed";
        if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return "expired";
        return "sent";
      };
      const fallback = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, items, created_at")
        .eq("status", "meet_invite")
        .eq("items->>meeting_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (fallback.error) return json(res, 502, { ok: false, error: fallback.error.message || "Invites could not be loaded." });
      const rows = (fallback.data || []).map((r) => {
        const it = itemsOf(r);
        const brief = {
          id: r.id,
          email: r.customer_email || it.email || "",
          name: it.recipient_name || r.customer_name || "",
          has_account: Boolean(it.has_account),
          created_at: r.created_at,
          expires_at: it.expires_at,
          redeemed_at: it.redeemed_at || null,
          revoked_at: it.revoked_at || null,
          created_by: it.created_by || "",
        };
        brief.status = inviteStatus(brief);
        return brief;
      });
      return json(res, 200, { ok: true, rows });
    }

    if (op === "meet_update") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That room was not found." });
      const cur = await supabase.from("orders").select("id, status, items").eq("id", id).eq("status", "meeting").maybeSingle();
      if (cur.error || !cur.data) return json(res, 404, { ok: false, error: "That room was not found." });
      const items = Object.assign({}, itemsOf(cur.data));
      if (payload.name != null || payload.room_name != null) items.name = text(payload.name || payload.room_name, 80);
      if (payload.starts_at != null || payload.date != null) items.starts_at = text(payload.starts_at || payload.date, 40);
      if (payload.duration_min != null || payload.duration != null) {
        items.duration_min = Math.max(0, Math.min(24 * 60, Number(payload.duration_min || payload.duration) || 0));
      }
      if (payload.active != null) items.active = payload.active !== false && payload.active !== "false";
      if (payload.closed != null) items.closed = payload.closed === true || payload.closed === "true";
      items.link = meetLink(items.code);
      const patch = { items };
      if (items.name) patch.customer_name = items.name;
      const saved = await supabase.from("orders").update(patch).eq("id", id).select("id").single();
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The room was not updated." });
      await logAdmin(supabase, who, "meet_update", { id, active: items.active, closed: items.closed });
      return json(res, 200, { ok: true, link: items.link, code: items.code });
    }

    if (op === "customers") {
      const accounts = await fetchOrders(supabase, ["account"]);
      const others = await fetchOrders(supabase, ["received", "notified", "processing", "done", "photo", "room", "review"]);
      const map = new Map();
      const touch = (row, kind) => {
        const email = String(row.customer_email || "")
          .trim()
          .toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        const cur = map.get(email) || {
          email,
          name: "",
          phone: "",
          has_account: false,
          orders: 0,
          photos: 0,
          reviews: 0,
          rooms: 0,
          last_at: "",
        };
        if (row.customer_name && !cur.name) cur.name = row.customer_name;
        if (row.customer_phone && !cur.phone) cur.phone = row.customer_phone;
        if (kind === "account") cur.has_account = true;
        if (["received", "notified", "processing", "done", "cancelled"].includes(row.status)) cur.orders += 1;
        if (row.status === "photo") cur.photos += 1;
        if (row.status === "review") cur.reviews += 1;
        if (row.status === "room") cur.rooms += 1;
        if (!cur.last_at || (row.created_at && row.created_at > cur.last_at)) cur.last_at = row.created_at || cur.last_at;
        map.set(email, cur);
      };
      accounts.forEach((r) => touch(r, "account"));
      others.forEach((r) => touch(r, r.status));
      let list = [...map.values()].sort((a, b) => String(b.last_at).localeCompare(String(a.last_at)));
      if (q) {
        list = list.filter((c) => [c.email, c.name, c.phone].join(" ").toLowerCase().includes(q));
      }
      const sliced = pageSlice(list, page, pageSize);
      return json(res, 200, { ok: true, ...sliced });
    }

    if (op === "photos") {
      const raw = await fetchOrders(supabase, ["photo"]);
      let briefs = raw.map(photoBrief).filter((r) => matchQuery(r, q));
      if (payload.shared === true || payload.shared === "true") briefs = briefs.filter((r) => r.shared);
      if (payload.shared === false || payload.shared === "false") briefs = briefs.filter((r) => !r.shared);
      const sliced = pageSlice(briefs, page, pageSize);
      return json(res, 200, { ok: true, ...sliced });
    }

    if (op === "photo_get") {
      const id = text(payload.id, 80);
      const row = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, created_at, items, status")
        .eq("id", id)
        .eq("status", "photo")
        .maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That photo was not found." });
      const items = itemsOf(row.data);
      return json(res, 200, {
        ok: true,
        photo: {
          id: row.data.id,
          name: row.data.customer_name || "",
          email: row.data.customer_email || "",
          created_at: row.data.created_at || "",
          shared: items.shared !== false,
          moderated: Boolean(items.moderated),
          thumb: typeof items.thumb === "string" ? items.thumb : "",
          image: typeof items.image === "string" ? items.image : "",
        },
      });
    }

    if (op === "albums") {
      const albums = await supabase
        .from("albums")
        .select("id, order_id, album_name, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (albums.error) return json(res, 502, { ok: false, error: albums.error.message || "Albums could not be loaded." });
      let rows = albums.data || [];
      if (q) {
        rows = rows.filter((a) => String(a.album_name || "").toLowerCase().includes(q) || String(a.order_id || "").includes(q));
      }
      const withCounts = [];
      for (const album of rows.slice(0, 100)) {
        const photos = await supabase.from("album_photos").select("id", { count: "exact", head: true }).eq("album_id", album.id);
        withCounts.push({
          id: album.id,
          order_id: album.order_id,
          name: album.album_name || "Album",
          created_at: album.created_at,
          photo_count: photos.count || 0,
        });
      }
      const sliced = pageSlice(withCounts, page, pageSize);
      return json(res, 200, { ok: true, ...sliced });
    }

    if (op === "reviews") {
      const raw = await fetchOrders(supabase, ["review"]);
      let briefs = raw.map(orderBrief).filter((r) => matchQuery(r, q));
      if (payload.hidden === true || payload.hidden === "true") briefs = briefs.filter((r) => r.hidden);
      if (payload.hidden === false || payload.hidden === "false") briefs = briefs.filter((r) => !r.hidden);
      const sliced = pageSlice(briefs, page, pageSize);
      return json(res, 200, { ok: true, ...sliced });
    }

    if (op === "review_moderate") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That review was not found." });
      const cur = await supabase.from("orders").select("id, items, status").eq("id", id).eq("status", "review").maybeSingle();
      if (cur.error || !cur.data) return json(res, 404, { ok: false, error: "That review was not found." });
      if (payload.remove === true || payload.remove === "true") {
        const gone = await supabase.from("orders").delete().eq("id", id);
        if (gone.error) return json(res, 502, { ok: false, error: gone.error.message || "The review was not removed." });
        await logAdmin(supabase, who, "review_remove", { id });
        return json(res, 200, { ok: true, removed: true });
      }
      const items = Object.assign({}, itemsOf(cur.data), {
        hidden: payload.hidden === true || payload.hidden === "true",
      });
      const saved = await supabase.from("orders").update({ items }).eq("id", id);
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The review was not updated." });
      await logAdmin(supabase, who, "review_moderate", { id, hidden: items.hidden });
      return json(res, 200, { ok: true, hidden: items.hidden });
    }

    if (op === "logs") {
      const raw = await fetchOrders(supabase, ["admin_log"]);
      let briefs = raw.map((row) => {
        const items = itemsOf(row);
        return {
          id: row.id,
          created_at: row.created_at,
          email: row.customer_email || items.by || "",
          action: items.action || "",
          detail: items.detail || {},
        };
      });
      if (q) briefs = briefs.filter((r) => [r.email, r.action, JSON.stringify(r.detail)].join(" ").toLowerCase().includes(q));
      const sliced = pageSlice(briefs, page, pageSize);
      return json(res, 200, { ok: true, ...sliced });
    }

    if (op === "export") {
      const kind = text(payload.kind || "orders", 40);
      let raw = [];
      let columns = [];
      let filename = "lay-c-export.csv";
      if (kind === "customers") {
        const accounts = await fetchOrders(supabase, ["account"]);
        const others = await fetchOrders(supabase, ["received", "notified", "processing", "done", "photo", "room", "review"]);
        const map = new Map();
        const touch = (row) => {
          const email = String(row.customer_email || "")
            .trim()
            .toLowerCase();
          if (!email) return;
          const cur = map.get(email) || { email, name: "", phone: "", has_account: false, last_at: "" };
          if (row.status === "account") cur.has_account = true;
          if (row.customer_name && !cur.name) cur.name = row.customer_name;
          if (row.customer_phone && !cur.phone) cur.phone = row.customer_phone;
          if (!cur.last_at || (row.created_at && row.created_at > cur.last_at)) cur.last_at = row.created_at || "";
          map.set(email, cur);
        };
        accounts.forEach(touch);
        others.forEach(touch);
        raw = [...map.values()];
        columns = [
          { label: "Email", get: (r) => r.email },
          { label: "Name", get: (r) => r.name },
          { label: "Phone", get: (r) => r.phone },
          { label: "Has account", get: (r) => (r.has_account ? "yes" : "no") },
          { label: "Last activity", get: (r) => r.last_at },
        ];
        filename = "lay-c-customers.csv";
        const csv = toCsv(raw, columns);
        await logAdmin(supabase, who, "export", { kind, rows: raw.length, filename });
        return json(res, 200, { ok: true, filename, mime: "text/csv; charset=utf-8", csv, rows: raw.length });
      }
      if (kind === "reviews") {
        raw = (await fetchOrders(supabase, ["review"])).map(orderBrief);
        columns = [
          { label: "Date", get: (r) => r.created_at },
          { label: "Name", get: (r) => r.name },
          { label: "Email", get: (r) => r.email },
          { label: "Rating", get: (r) => r.rating },
          { label: "Review", get: (r) => r.review },
          { label: "Hidden", get: (r) => (r.hidden ? "yes" : "no") },
        ];
        filename = "lay-c-reviews.csv";
      } else if (kind === "meetings") {
        raw = (await fetchOrders(supabase, ["meeting"])).map(orderBrief);
        columns = [
          { label: "Date", get: (r) => r.created_at },
          { label: "Name", get: (r) => r.room_name || r.name },
          { label: "Code", get: (r) => r.code },
          { label: "Starts", get: (r) => r.starts_at },
          { label: "Duration", get: (r) => r.duration_min },
          { label: "Active", get: (r) => (r.active ? "yes" : "no") },
          { label: "Closed", get: (r) => (r.closed ? "yes" : "no") },
          { label: "Link", get: (r) => meetLink(r.code) },
        ];
        filename = "lay-c-meetings.csv";
      } else {
        raw = (await fetchOrders(supabase, null))
          .map(orderBrief)
          .filter((r) => !["account", "admin_log"].includes(r.status));
        if (kind === "orders") {
          raw = raw.filter((r) => !["photo", "room", "meeting", "review"].includes(r.status));
        }
        columns = [
          { label: "Date", get: (r) => r.created_at },
          { label: "Status", get: (r) => r.status },
          { label: "Name", get: (r) => r.name },
          { label: "Email", get: (r) => r.email },
          { label: "Phone", get: (r) => r.phone },
          { label: "Total", get: (r) => r.total },
          { label: "Service", get: (r) => r.service },
          { label: "Code", get: (r) => r.code },
          { label: "Id", get: (r) => r.id },
        ];
        filename = "lay-c-" + kind + ".csv";
      }
      if (q) raw = raw.filter((r) => matchQuery(r, q));
      const csv = toCsv(raw, columns);
      await logAdmin(supabase, who, "export", { kind, rows: raw.length, filename });
      return json(res, 200, { ok: true, filename, mime: "text/csv; charset=utf-8", csv, rows: raw.length });
    }

    if (op === "settings") {
      return json(res, 200, {
        ok: true,
        email: who.customer_email,
        name: who.customer_name || "",
        meeting_provider: "meet.ffmuc.net",
        auth: "staff-token",
        notes: [
          "Admin access is enforced on the server with an allowlisted staff email and account token.",
          "Set STAFF_EMAILS in the server environment to control who can sign in to /admin.",
          "Service-role keys stay on the server only.",
        ],
      });
    }

    // Default: full list for backward-compatible admin clients.
    const list = await fetchOrders(supabase, null);
    const rows = list.map(orderBrief);
    const counts = {};
    rows.forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return json(res, 200, { ok: true, email: who.customer_email, counts, rows: rows.slice(0, 200) });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The admin panel could not be opened." });
  }
};
