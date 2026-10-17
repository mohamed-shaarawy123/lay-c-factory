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

function imageData(v) {
  const s = String(v || "");
  if (!/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(s)) return "";
  if (s.length > 700000) return "";
  return s.replace(/\s+/g, "");
}

async function accountByToken(supabase, token) {
  if (!token || token.length < 16) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("customer_email, customer_name")
    .eq("status", "account")
    .eq("items->>token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
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
      let id = "";
      let mine = "";
      try {
        const q = new URL(req.url || "", "http://localhost").searchParams;
        id = q.get("id") || "";
        mine = q.get("token") || "";
      } catch (e) {}
      if (req.query) {
        id = id || req.query.id || "";
        mine = mine || req.query.token || "";
      }
      if (id) {
        const one = await supabase
          .from("orders")
          .select("id, customer_email, customer_name, items")
          .eq("id", id)
          .eq("status", "photo")
          .maybeSingle();
        if (one.error || !one.data || !one.data.items) {
          return json(res, 404, { ok: false, error: "That picture was not found." });
        }
        return json(res, 200, {
          ok: true,
          photo: {
            id: one.data.id,
            email: one.data.customer_email,
            name: one.data.customer_name,
            image: one.data.items.image || one.data.items.thumb || "",
            ts: one.data.items.ts || 0,
          },
        });
      }
      let query = supabase
        .from("orders")
        .select("id, customer_email, customer_name, items, created_at")
        .eq("status", "photo")
        .order("created_at", { ascending: false })
        .limit(80);
      if (mine) {
        const who = await accountByToken(supabase, mine);
        if (!who) return json(res, 401, { ok: false, error: "Sign in with your email and password to see your pictures." });
        query = query.eq("customer_email", who.customer_email);
      }
      const list = await query;
      if (list.error) return json(res, 502, { ok: false, error: list.error.message || "The album could not be opened." });
      return json(res, 200, {
        ok: true,
        photos: (list.data || []).map((row) => ({
          id: row.id,
          email: row.customer_email,
          name: row.customer_name,
          thumb: (row.items && row.items.thumb) || "",
          ts: (row.items && row.items.ts) || 0,
        })),
      });
    }

    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const payload = await readPayload(req);
    if (!payload) return json(res, 400, { ok: false, error: "The picture is missing." });
    const who = await accountByToken(supabase, text(payload.token, 80));
    if (!who) {
      return json(res, 401, { ok: false, error: "Sign in with your email and password before adding a picture." });
    }
    const image = imageData(payload.image);
    const thumb = imageData(payload.thumb) || image;
    if (!image) return json(res, 400, { ok: false, error: "Choose a smaller photo." });
    const saved = await supabase
      .from("orders")
      .insert({
        customer_name: who.customer_name,
        customer_email: who.customer_email,
        customer_phone: "",
        delivery_address: "",
        items: { type: "photo", image, thumb, ts: Date.now() },
        total: 0,
        status: "photo",
      })
      .select("id")
      .single();
    if (saved.error || !saved.data) {
      return json(res, 502, { ok: false, error: (saved.error && saved.error.message) || "The picture was not saved." });
    }
    return json(res, 200, { ok: true, id: saved.data.id, email: who.customer_email });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The album was not saved." });
  }
};
