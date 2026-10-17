const crypto = require("crypto");
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

function dbMessage(message) {
  const text = message || "The account was not saved.";
  if (/invalid api key/i.test(text)) {
    return "The account was not saved. The live database key is not set, so sign up cannot be stored.";
  }
  return text;
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

  const mode = payload.mode === "login" ? "login" : "signup";
  const customer_name = text(payload.customer_name, 120);
  const customer_email = text(payload.customer_email, 160).toLowerCase();
  const customer_phone = text(payload.customer_phone, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return json(res, 400, { ok: false, error: "Enter a valid email address." });
  }
  const password = String(payload.password || "");
  if (password.length < 6) {
    return json(res, 400, { ok: false, error: "Choose a password of at least 6 characters." });
  }
  if (mode === "signup") {
    if (!customer_name) return json(res, 400, { ok: false, error: "Enter your name." });
    if (customer_phone.length < 6) return json(res, 400, { ok: false, error: "Enter a phone number." });
  }

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message });
  }

  const existing = await supabase
    .from("orders")
    .select("id, items, customer_name, customer_phone")
    .eq("customer_email", customer_email)
    .eq("status", "account")
    .maybeSingle();
  if (existing.error && !/multiple/i.test(existing.error.message || "")) {
    return json(res, 502, { ok: false, error: dbMessage(existing.error.message) });
  }

  const prev = (existing.data && existing.data.items) || {};
  const hasPass = Boolean(prev.pass && prev.salt);
  if (mode === "login") {
    if (!existing.data || !hasPass) {
      return json(res, 404, {
        ok: false,
        error: "No account for that email. Sign up first and create a password.",
      });
    }
    const check = crypto.scryptSync(password, prev.salt, 32).toString("hex");
    const a = Buffer.from(check);
    const b = Buffer.from(String(prev.pass));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return json(res, 401, { ok: false, error: "Wrong password for that email." });
    }
    let token = prev.token || "";
    if (!token) {
      token = crypto.randomBytes(24).toString("hex");
      const patched = await supabase
        .from("orders")
        .update({ items: Object.assign({}, prev, { token }) })
        .eq("id", existing.data.id);
      if (patched.error) {
        return json(res, 502, { ok: false, error: patched.error.message || "The account was not saved." });
      }
    }
    return json(res, 200, {
      ok: true,
      created: false,
      token,
      account_id: existing.data.id,
      customer_name: existing.data.customer_name || "",
      customer_email,
      customer_phone: existing.data.customer_phone || "",
    });
  }

  if (hasPass) {
    return json(res, 409, {
      ok: false,
      error: "This email already has an account. Log in with the email and password you created.",
    });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const salt = crypto.randomBytes(16).toString("hex");
  const pass = crypto.scryptSync(password, salt, 32).toString("hex");
  const row = {
    customer_name,
    customer_email,
    customer_phone,
    delivery_address: "",
    items: { type: "account", salt, pass, token },
    total: 0,
    status: "account",
  };

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
    created: true,
    token,
    account_id: saved.data.id,
    customer_name,
    customer_email,
    customer_phone,
  });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The account was not saved." });
  }
};
