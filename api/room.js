const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { readPayload } = require("../lib/body");

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

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
  return { code, items: cleanItems, rows };
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
        room: { items: found.items.items || [], rows: found.items.rows || [] },
      });
    }

    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const room = cleanRoom(payload || {}, code);
    const row = {
      customer_name: "Room " + room.code,
      customer_email: text(payload.customer_email, 160).toLowerCase(),
      customer_phone: "",
      delivery_address: "",
      items: { type: "room", code: room.code, items: room.items, rows: room.rows },
      total: 0,
      status: "room",
    };
    const existing = await findRoom(supabase, room.code);
    const saved = existing
      ? await supabase.from("orders").update(row).eq("id", existing.id).select("id").single()
      : await supabase.from("orders").insert(row).select("id").single();
    if (saved.error || !saved.data) {
      return json(res, 502, {
        ok: false,
        error: (saved.error && saved.error.message) || "The room was not saved.",
      });
    }
    return json(res, 200, { ok: true, room_id: saved.data.id });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The room was not saved." });
  }
};
