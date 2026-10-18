const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { readPayload } = require("../lib/body");
const { isStaffEmail } = require("../lib/staff");

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

async function accountByToken(supabase, token) {
  if (!token || token.length < 16) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_email, customer_name")
    .eq("status", "account")
    .eq("items->>token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

function brief(row) {
  const items = row.items && typeof row.items === "object" ? row.items : {};
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
    const who = await accountByToken(supabase, text(payload.token, 80));
    if (!who || !isStaffEmail(who.customer_email)) {
      return json(res, 403, { ok: false, error: "Sign in with the admin email." });
    }
    const op = text(payload.op, 20);
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
      return json(res, 200, { ok: true });
    }
    const list = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, delivery_address, total, status, created_at, items")
      .order("created_at", { ascending: false })
      .limit(200);
    if (list.error) return json(res, 502, { ok: false, error: list.error.message || "The list could not be opened." });
    const rows = (list.data || []).map(brief);
    const counts = {};
    rows.forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return json(res, 200, { ok: true, email: who.customer_email, counts, rows });
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message || "The admin panel could not be opened." });
  }
};
