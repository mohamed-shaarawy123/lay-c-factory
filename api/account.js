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

module.exports = async function handler(req, res) {
  try {
  loadEnv();
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use POST." });
  const payload = await readPayload(req);
  if (!payload) return json(res, 400, { ok: false, error: "The account is missing." });

  const customer_name = text(payload.customer_name, 120);
  const customer_email = text(payload.customer_email, 160).toLowerCase();
  const customer_phone = text(payload.customer_phone, 40);
  if (!customer_name) {
    return json(res, 400, { ok: false, error: "Enter your name." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return json(res, 400, { ok: false, error: "Enter a valid email address." });
  }
  if (customer_phone.length < 6) {
    return json(res, 400, { ok: false, error: "Enter a phone number." });
  }

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message });
  }

  const row = {
    customer_name,
    customer_email,
    customer_phone,
    delivery_address: "",
    items: { type: "account" },
    total: 0,
    status: "account",
    email_sent: false,
  };

  const existing = await supabase
    .from("orders")
    .select("id")
    .eq("customer_email", customer_email)
    .eq("status", "account")
    .maybeSingle();
  if (existing.error && !/multiple/i.test(existing.error.message || "")) {
    return json(res, 502, { ok: false, error: existing.error.message || "The account was not saved." });
  }

  let saved;
  if (existing.data && existing.data.id) {
    saved = await supabase.from("orders").update(row).eq("id", existing.data.id).select("id").single();
  } else {
    saved = await supabase.from("orders").insert(row).select("id").single();
  }
  if (saved.error || !saved.data || !saved.data.id) {
    return json(res, 502, {
      ok: false,
      error: (saved.error && saved.error.message) || "The account was not saved.",
    });
  }

  return json(res, 200, {
    ok: true,
    account_id: saved.data.id,
    customer_name,
    customer_email,
    customer_phone,
  });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The account was not saved." });
  }
};
