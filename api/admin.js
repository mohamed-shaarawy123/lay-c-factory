const { randomInt } = require("crypto");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { readPayload } = require("../lib/body");
const { requireAdmin, logAdmin, meetLink } = require("../lib/admin-auth");

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

function orderBrief(row) {
  const items = itemsOf(row);
  const secretKeys = ["pass", "salt", "token", "image", "thumb"];
  const safeItems = {};
  Object.keys(items).forEach((k) => {
    if (secretKeys.includes(k)) return;
    const v = items[k];
    if (typeof v === "string" && v.length > 500) safeItems[k] = v.slice(0, 500) + "…";
    else safeItems[k] = v;
  });
  return {
    id: row.id,
    name: row.customer_name || "",
    email: row.customer_email || "",
    phone: row.customer_phone || "",
    address: row.delivery_address || "",
    total: row.total,
    status: row.status || "",
    created_at: row.created_at || "",
    code: items.code || "",
    shared: items.shared !== false,
    private: Boolean(items.private),
    service: items.service || items.type || "",
    hidden: Boolean(items.hidden),
    active: items.active !== false,
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

    // Public: join / list available admin-created meeting rooms only.
    if (op === "join") {
      const code = text(payload.code, 12).replace(/\D/g, "");
      if (code.length !== 6) return json(res, 400, { ok: false, error: "Enter the 6-digit code." });
      const found = await supabase
        .from("orders")
        .select("id, items")
        .eq("status", "meeting")
        .eq("items->>code", code)
        .maybeSingle();
      if (found.error) return json(res, 502, { ok: false, error: found.error.message || "The meeting could not be checked." });
      if (!found.data) return json(res, 404, { ok: false, error: "No meeting found with that code." });
      const items = itemsOf(found.data);
      if (items.closed || items.active === false) {
        return json(res, 403, { ok: false, error: "This room is not available right now." });
      }
      return json(res, 200, {
        ok: true,
        code,
        name: items.name || "Meeting " + code,
        link: meetLink(code),
      });
    }

    if (op === "available") {
      const list = await fetchOrders(supabase, ["meeting"]);
      const rooms = list
        .map((row) => {
          const items = itemsOf(row);
          if (items.closed || items.active === false) return null;
          const code = text(items.code, 12).replace(/\D/g, "");
          if (code.length !== 6) return null;
          return {
            code,
            name: text(items.name || "Meeting " + code, 80),
            starts_at: items.starts_at || "",
            duration_min: items.duration_min || null,
            created_at: row.created_at || "",
          };
        })
        .filter(Boolean);
      return json(res, 200, { ok: true, rooms });
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
          orders: rows.filter((r) => ["received", "notified", "processing", "done", "cancelled"].includes(r.status)).length,
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

    if (op === "list" || op === "orders") {
      const status = text(payload.status, 40);
      const orderStatuses = ["received", "notified", "processing", "done", "cancelled"];
      let statuses = null;
      if (status === "orders" || status === "received") statuses = orderStatuses;
      else if (status) statuses = [status];
      const raw = await fetchOrders(supabase, statuses);
      let briefs = raw.map(orderBrief);
      if (status === "orders" || (!status && op === "orders")) {
        briefs = briefs.filter((r) => orderStatuses.includes(r.status) || !["account", "photo", "room", "meeting", "review", "admin_log"].includes(r.status));
      }
      if (payload.from) briefs = briefs.filter((r) => !r.created_at || r.created_at >= text(payload.from, 40));
      if (payload.to) briefs = briefs.filter((r) => !r.created_at || r.created_at.slice(0, 10) <= text(payload.to, 40));
      briefs = briefs.filter((r) => matchQuery(r, q));
      const sliced = pageSlice(briefs, page, pageSize);
      return json(res, 200, { ok: true, email: who.customer_email, ...sliced });
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
      if (row.data.status === "photo") {
        const items = itemsOf(row.data);
        brief.thumb = typeof items.thumb === "string" ? items.thumb : "";
        brief.has_image = Boolean(items.image || items.thumb);
      }
      if (row.data.status === "account") {
        brief.items = { type: "account", has_password: Boolean(itemsOf(row.data).pass) };
      }
      return json(res, 200, { ok: true, row: brief });
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

    if (op === "delete") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That record was not found." });
      const row = await supabase.from("orders").select("id, status, customer_email").eq("id", id).maybeSingle();
      if (row.error || !row.data) return json(res, 404, { ok: false, error: "That record was not found." });
      if (row.data.status === "account" && String(row.data.customer_email).toLowerCase() === String(who.customer_email).toLowerCase()) {
        return json(res, 400, { ok: false, error: "The admin account stays so you can keep signing in." });
      }
      const gone = await supabase.from("orders").delete().eq("id", id).select("id");
      if (gone.error) return json(res, 502, { ok: false, error: gone.error.message || "It was not deleted." });
      await logAdmin(supabase, who, "delete", { id, status: row.data.status });
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
            active: payload.active !== false,
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
      await logAdmin(supabase, who, "meet_create", { id: saved.data.id, code, name });
      return json(res, 200, { ok: true, code, id: saved.data.id, link: meetLink(code), name });
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
