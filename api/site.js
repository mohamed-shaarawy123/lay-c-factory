const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { readPayload } = require("../lib/body");
const { isStaffEmail } = require("../lib/staff");

const FILE = path.join(__dirname, "..", "data", "site.json");

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

function readFileFlag() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return !!data.rain;
  } catch (e) {
    return false;
  }
}

function writeFileFlag(rain) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ rain: !!rain }));
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function readRain(supabase) {
  if (!supabase) return readFileFlag();
  const row = await supabase.from("orders").select("id, items").eq("status", "site").limit(1).maybeSingle();
  if (row.error) return readFileFlag();
  return !!(row.data && row.data.items && row.data.items.rain);
}

async function writeRain(supabase, rain) {
  const items = { type: "site", rain: !!rain };
  if (!supabase) {
    writeFileFlag(rain);
    return;
  }
  const row = await supabase.from("orders").select("id").eq("status", "site").limit(1).maybeSingle();
  if (row.error) throw new Error(row.error.message || "The weather setting was not saved.");
  if (row.data && row.data.id) {
    const saved = await supabase.from("orders").update({ items }).eq("id", row.data.id);
    if (saved.error) throw new Error(saved.error.message || "The weather setting was not saved.");
    return;
  }
  const inserted = await supabase.from("orders").insert({
    customer_name: "Site",
    customer_email: "site@layc.local",
    customer_phone: "",
    delivery_address: "",
    items,
    total: 0,
    status: "site",
  });
  if (inserted.error) throw new Error(inserted.error.message || "The weather setting was not saved.");
}

async function staffOk(supabase, token) {
  const value = String(token || "");
  if (!supabase || value.length < 16) return false;
  const saved = await supabase
    .from("orders")
    .select("customer_email")
    .eq("status", "account")
    .eq("items->>token", value)
    .maybeSingle();
  return !!(saved.data && isStaffEmail(saved.data.customer_email || ""));
}

module.exports = async function handler(req, res) {
  try {
    loadEnv();
    const supabase = supabaseAdmin();
    if (req.method === "GET") {
      const rain = await readRain(supabase);
      return json(res, 200, { ok: true, rain });
    }
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const payload = (await readPayload(req)) || {};
    const allowed = (await staffOk(supabase, payload.token)) || (!supabase && !process.env.VERCEL);
    if (!allowed) return json(res, 403, { ok: false, error: "Sign in with an authorized admin account." });
    await writeRain(supabase, !!payload.rain);
    return json(res, 200, { ok: true, rain: !!payload.rain });
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message || "The weather setting was not saved." });
  }
};
