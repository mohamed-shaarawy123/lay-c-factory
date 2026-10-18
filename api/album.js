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
    .select("id, customer_email, customer_name, items")
    .eq("status", "account")
    .eq("items->>token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function photoCount(supabase, email) {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "photo")
    .eq("customer_email", email);
  if (error) return 0;
  return count || 0;
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
      let wantMine = false;
      try {
        wantMine = new URL(req.url || "", "http://localhost").searchParams.get("mine") === "1";
      } catch (e) {}
      if (req.query) {
        id = id || req.query.id || "";
        mine = mine || req.query.token || "";
        if (String(req.query.mine) === "1") wantMine = true;
      }
      const who = mine ? await accountByToken(supabase, mine) : null;
      const mineCount = who ? await photoCount(supabase, who.customer_email) : 0;
      const isPrivate = Boolean(who && who.items && who.items.private);
      if (id) {
        if (!who) return json(res, 401, { ok: false, error: "Sign in with your email and password to see a photo." });
        const one = await supabase
          .from("orders")
          .select("id, customer_email, customer_name, items")
          .eq("id", id)
          .eq("status", "photo")
          .maybeSingle();
        if (one.error || !one.data || !one.data.items) {
          return json(res, 404, { ok: false, error: "That picture was not found." });
        }
        const own = one.data.customer_email === who.customer_email;
        const shared = one.data.items.shared !== false;
        if (!own && (isPrivate || mineCount < 1 || !shared)) {
          return json(res, 403, { ok: false, error: "Take a camera photo on a shared album before opening someone else's picture." });
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
        .select("id, customer_email, customer_name, created_at, thumb:items->thumb, ts:items->ts, shared:items->shared")
        .eq("status", "photo")
        .order("created_at", { ascending: false })
        .limit(80);
      let locked = false;
      let reason = "";
      if (!who) {
        locked = true;
        reason = "Sign in with your email to see albums.";
      } else if (wantMine) {
        query = query.eq("customer_email", who.customer_email);
      } else if (isPrivate) {
        locked = true;
        reason = "Your album is private, so you cannot see other albums.";
      } else if (mineCount < 1) {
        locked = true;
        reason = "Take a photo with the camera before you can see other albums.";
      }
      let rows = [];
      if (!locked) {
        const list = await query;
        if (list.error) return json(res, 502, { ok: false, error: list.error.message || "The album could not be opened." });
        rows = list.data || [];
      }
      const photos = rows
        .filter((row) => wantMine || row.shared !== false)
        .map((row) => ({
          id: row.id,
          email: row.customer_email,
          name: row.customer_name,
          thumb: row.thumb || "",
          ts: row.ts || 0,
        }));
      return json(res, 200, { ok: true, photos, mine: mineCount, locked, private: isPrivate, reason });
    }

    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const payload = await readPayload(req);
    if (!payload) return json(res, 400, { ok: false, error: "The picture is missing." });
    const who = await accountByToken(supabase, text(payload.token, 80));
    if (!who) {
      return json(res, 401, { ok: false, error: "Sign in with your email and password before adding a picture." });
    }
    if (payload.privacy === true || payload.privacy === false) {
      const prev = who.items && typeof who.items === "object" ? who.items : {};
      const saved = await supabase
        .from("orders")
        .update({ items: Object.assign({}, prev, { private: payload.privacy === true }) })
        .eq("id", who.id);
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The album setting was not saved." });
      const own = await supabase
        .from("orders")
        .select("id, items")
        .eq("status", "photo")
        .eq("customer_email", who.customer_email);
      if (!own.error) {
        for (const row of own.data || []) {
          await supabase
            .from("orders")
            .update({ items: Object.assign({}, row.items || {}, { shared: payload.privacy !== true }) })
            .eq("id", row.id);
        }
      }
      return json(res, 200, { ok: true, private: payload.privacy === true });
    }
    if (payload.source !== "camera") {
      return json(res, 400, { ok: false, error: "Take the photo with the front or back camera. A picture from your files cannot be added." });
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
        items: { type: "photo", image, thumb, ts: Date.now(), source: "camera", shared: !(who.items && who.items.private) },
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
