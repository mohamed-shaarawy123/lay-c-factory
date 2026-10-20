const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { readPayload } = require("../lib/body");

const recentKeys = new Map();

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

function mapReview(row) {
  const items = row.items && typeof row.items === "object" ? row.items : {};
  const r = Math.max(1, Math.min(5, Number(items.r) || 0));
  const t = text(items.t, 400);
  const n = text(items.n || row.customer_name, 30) || "Customer";
  const ts = Number(items.ts) || (row.created_at ? Date.parse(row.created_at) : Date.now());
  if (!t || r < 1) return null;
  return { id: row.id, n, r, t, ts };
}

module.exports = async function handler(req, res) {
  try {
    loadEnv();
    let supabase;
    try {
      supabase = supabaseAdmin();
    } catch (err) {
      return json(res, err.status || 500, { ok: false, error: err.message });
    }

    if (req.method === "GET") {
      const list = await supabase
        .from("orders")
        .select("id, customer_name, items, created_at")
        .eq("status", "review")
        .order("created_at", { ascending: false })
        .limit(100);
      if (list.error) {
        return json(res, 502, { ok: false, error: list.error.message || "Reviews could not be loaded." });
      }
      const reviews = (list.data || [])
        .filter((row) => !(row.items && row.items.hidden))
        .map(mapReview)
        .filter(Boolean);
      return json(res, 200, { ok: true, reviews });
    }

    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });

    const payload = await readPayload(req);
    if (!payload) return json(res, 400, { ok: false, error: "The review is missing." });

    const n = text(payload.n || payload.name, 30);
    const t = text(payload.t || payload.text || payload.review, 400);
    const r = Math.round(Number(payload.r != null ? payload.r : payload.rating));
    const key = text(payload.idempotency_key, 80);

    if (!n) return json(res, 400, { ok: false, error: "Please enter your name." });
    if (!(r >= 1 && r <= 5)) return json(res, 400, { ok: false, error: "Please choose a rating from 1 to 5." });
    if (!t) return json(res, 400, { ok: false, error: "Please write a few words about your experience." });

    if (key && recentKeys.has(key)) {
      return json(res, 200, recentKeys.get(key));
    }

    const ts = Date.now();
    const saved = await supabase
      .from("orders")
      .insert({
        customer_name: n,
        customer_email: "",
        customer_phone: "",
        delivery_address: "",
        items: { type: "review", n, r, t, ts },
        total: 0,
        status: "review",
      })
      .select("id, customer_name, items, created_at")
      .single();

    if (saved.error || !saved.data) {
      return json(res, 502, {
        ok: false,
        error: (saved.error && saved.error.message) || "The review was not saved.",
      });
    }

    const review = mapReview(saved.data);
    const body = { ok: true, review };
    if (key) {
      recentKeys.set(key, body);
      if (recentKeys.size > 200) {
        const first = recentKeys.keys().next().value;
        recentKeys.delete(first);
      }
    }
    return json(res, 200, body);
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The review could not be saved." });
  }
};
