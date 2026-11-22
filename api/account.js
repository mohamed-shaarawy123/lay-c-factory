const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
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

async function mailReset(email, name, code) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: "service_7cpdfst",
        template_id: "template_w9j36v9",
        user_id: "mJF5b2OR8PYShW5wd",
        template_params: {
          to_email: email,
          service: "Password reset",
          order_summary: "Your Lay C password reset code is " + code + ". It expires in 15 minutes.",
          products: "Password reset",
          quantities: "Code " + code,
          total_price: "Reset",
          customer_details: "Reset code: " + code + ". Enter it on the sign-in form with a new password.",
          customer_name: name || "",
          customer_email: email,
          client_email: email,
        },
      }),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
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

  const mode =
    payload.mode === "login"
      ? "login"
      : payload.mode === "session"
        ? "session"
        : payload.mode === "forgot"
          ? "forgot"
          : payload.mode === "reset"
            ? "reset"
            : "signup";
  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message });
  }

  if (mode === "session") {
    const token = text(payload.token, 80);
    if (token.length < 16) return json(res, 401, { ok: false, error: "Sign in again." });
    const saved = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone")
      .eq("status", "account")
      .eq("items->>token", token)
      .maybeSingle();
    if (saved.error || !saved.data) return json(res, 401, { ok: false, error: "Sign in again." });
    return json(res, 200, {
      ok: true,
      token,
      account_id: saved.data.id,
      customer_name: saved.data.customer_name || "",
      customer_email: saved.data.customer_email || "",
      customer_phone: saved.data.customer_phone || "",
      staff: isStaffEmail(saved.data.customer_email || ""),
    });
  }

  const customer_name = text(payload.customer_name, 120);
  const customer_email = text(payload.customer_email, 160).toLowerCase();
  const customer_phone = text(payload.customer_phone, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return json(res, 400, { ok: false, error: "Enter a valid email address." });
  }
  const password = String(payload.password || "");
  if (mode !== "forgot" && password.length < 6) {
    return json(res, 400, { ok: false, error: "Choose a password of at least 6 characters." });
  }
  if (mode === "signup") {
    if (!customer_name) return json(res, 400, { ok: false, error: "Enter your name." });
    if (customer_phone.length < 6) return json(res, 400, { ok: false, error: "Enter a phone number." });
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
  if (mode === "forgot") {
    if (existing.data && hasPass) {
      const code = String(crypto.randomInt(100000, 1000000));
      const reset_salt = crypto.randomBytes(8).toString("hex");
      const reset_hash = crypto.createHash("sha256").update(reset_salt + ":" + code).digest("hex");
      const patched = await supabase
        .from("orders")
        .update({
          items: Object.assign({}, prev, { reset_hash, reset_salt, reset_exp: Date.now() + 15 * 60 * 1000 }),
        })
        .eq("id", existing.data.id);
      if (patched.error) {
        return json(res, 502, { ok: false, error: "The reset code was not saved. Try again." });
      }
      const sent = await mailReset(customer_email, existing.data.customer_name || "", code);
      if (!sent) {
        return json(res, 502, { ok: false, error: "The reset email could not be sent. Try again in a moment." });
      }
    }
    return json(res, 200, { ok: true, sent: true });
  }
  if (mode === "reset") {
    const code = text(payload.code, 8);
    const expired = !prev.reset_hash || !prev.reset_salt || Date.now() > Number(prev.reset_exp || 0);
    const check = !expired
      ? crypto.createHash("sha256").update(prev.reset_salt + ":" + code).digest("hex")
      : "";
    if (!existing.data || !hasPass || expired || check !== prev.reset_hash) {
      return json(res, 400, { ok: false, error: "That code is not valid or it has expired. Send a new code." });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const pass = crypto.scryptSync(password, salt, 32).toString("hex");
    const next = Object.assign({}, prev, { salt, pass });
    delete next.reset_hash;
    delete next.reset_salt;
    delete next.reset_exp;
    const patched = await supabase.from("orders").update({ items: next }).eq("id", existing.data.id);
    if (patched.error) {
      return json(res, 502, { ok: false, error: "The new password was not saved. Try again." });
    }
    return json(res, 200, { ok: true, reset: true });
  }
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
      staff: isStaffEmail(customer_email),
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
    staff: isStaffEmail(customer_email),
  });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The account was not saved." });
  }
};
