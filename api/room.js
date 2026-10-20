const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { readPayload } = require("../lib/body");
const { storeRoomExcel } = require("../lib/order-excel");

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
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanSecret(v) {
  return String(v || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "")
    .replace(/^Bearer/i, "");
}

function supabaseConfig() {
  const url = cleanSecret(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
  const key = cleanSecret(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
  return { url, key };
}

function supabaseAdmin() {
  const { url, key } = supabaseConfig();
  if (!url || !key) {
    const err = new Error("Supabase is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function codeFrom(req, payload) {
  const fromBody = payload && payload.code;
  const fromReqQuery = req.query && req.query.code;
  let fromUrl = "";
  try {
    fromUrl = new URL(req.url || "", "http://localhost").searchParams.get("code") || "";
  } catch (e) {}
  return String(fromBody || fromReqQuery || fromUrl || "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

function cleanRoom(payload, code) {
  if (!/^\d{6}$/.test(code)) {
    const err = new Error("The room password must be 6 digits.");
    err.status = 400;
    throw err;
  }
  const items = (Array.isArray(payload.items) ? payload.items : []).slice(0, 40);
  const cleanItems = items
    .map((it) => ({
      n: text(it && it.n, 80),
      p: Math.max(0, Number(it && it.p) || 0),
    }))
    .filter((it) => it.n);
  if (!cleanItems.length) {
    const err = new Error("The room has no items.");
    err.status = 400;
    throw err;
  }
  const sizes = new Set(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
  const rows = (Array.isArray(payload.rows) ? payload.rows : []).slice(0, 500).map((row) => ({
    n: text(row && row.n, 80),
    p: text(row && row.p, 40),
    l: cleanItems.map((_, i) => {
      const cell = row && row.l && row.l[i] ? row.l[i] : {};
      const s = text(cell.s, 8);
      return {
        s: sizes.has(s) ? s : "M",
        q: Math.max(1, Math.min(999, Math.floor(Number(cell.q) || 1))),
      };
    }),
  }));
  if (payload.ex == null) return { code, items: cleanItems, rows, ex: null };
  const exIn = payload.ex && typeof payload.ex === "object" ? payload.ex : {};
  const ex = {
    t: (Array.isArray(exIn.t) ? exIn.t : [])
      .slice(0, 20)
      .map((x) => ({ n: text(x && x.n, 80), p: Math.max(0, Number(x && x.p) || 0) }))
      .filter((x) => x.n),
    ct: Boolean(exIn.ct),
    dl: text(exIn.dl, 80),
    pc: Math.max(0, Math.min(100, Number(exIn.pc) || 0)),
  };
  return { code, items: cleanItems, rows, ex };
}

async function findRoom(supabase, code) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, items")
    .eq("status", "room")
    .eq("items->>code", code)
    .maybeSingle();
  if (error) {
    const err = new Error(error.message || "The room could not be opened.");
    err.status = 502;
    throw err;
  }
  return data;
}

module.exports = async function handler(req, res) {
  try {
    loadEnv();
    const payload = req.method === "POST" ? await readPayload(req) : null;
    const code = codeFrom(req, payload);
    if (!/^\d{6}$/.test(code)) return json(res, 400, { ok: false, error: "Enter the 6 digit room password." });

    let supabase;
    try {
      supabase = supabaseAdmin();
    } catch (err) {
      return json(res, err.status || 500, { ok: false, error: err.message });
    }

    if (req.method === "GET") {
      const found = await findRoom(supabase, code);
      if (!found || !found.items) return json(res, 404, { ok: false, error: "No sheet found for that password." });
      return json(res, 200, {
        ok: true,
        room: { items: found.items.items || [], rows: found.items.rows || [], ex: found.items.ex || null },
      });
    }

    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const room = cleanRoom(payload || {}, code);
    const existing = await findRoom(supabase, room.code);
    const prevItems = (existing && existing.items) || {};
    const email = text(payload.customer_email, 160).toLowerCase();
    const name = text(payload.customer_name, 120) || (email ? email.split("@")[0] : "Room " + room.code);
    const items = {
      type: "room",
      order_type: "seniors_excel",
      source: "seniors",
      code: room.code,
      items: room.items,
      rows: room.rows,
      ex: room.ex || prevItems.ex || { t: [], ct: false, dl: "", pc: 0 },
      excel_path: prevItems.excel_path || "",
      excel_updated_at: prevItems.excel_updated_at || "",
      updated_at: new Date().toISOString(),
    };
    const lineTotal = (room.rows || []).reduce((sum, row) => {
      const cells = row && row.l ? row.l : [];
      return (
        sum +
        (room.items || []).reduce((s, item, i) => s + (Number(item.p) || 0) * Math.max(0, Number((cells[i] || {}).q) || 0), 0)
      );
    }, 0);
    const row = {
      customer_name: name,
      customer_email: email,
      customer_phone: text(payload.customer_phone, 40),
      delivery_address: "",
      items,
      total: lineTotal,
      status: "room",
    };
    const saved = existing
      ? await supabase.from("orders").update(row).eq("id", existing.id).select("id").single()
      : await supabase.from("orders").insert(row).select("id").single();
    if (saved.error || !saved.data) {
      return json(res, 502, {
        ok: false,
        error: (saved.error && saved.error.message) || "The room was not saved.",
      });
    }
    const roomId = saved.data.id;
    // Store a downloadable Excel copy for the admin whenever the sheet has content.
    if ((room.rows && room.rows.length) || (room.items && room.items.length)) {
      try {
        const file = await storeRoomExcel(supabase, roomId, room.code, room.items, room.rows, items.ex);
        await supabase
          .from("orders")
          .update({
            items: Object.assign({}, items, {
              excel_path: file.path,
              excel_updated_at: file.updated_at,
              has_excel: true,
            }),
          })
          .eq("id", roomId);
      } catch (e) {
        // Sheet data is saved even if storage upload fails.
      }
    }
    return json(res, 200, { ok: true, room_id: roomId });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The room was not saved." });
  }
};
