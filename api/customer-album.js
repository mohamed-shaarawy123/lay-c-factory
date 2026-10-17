const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { readPayload } = require("../lib/body");
const { isStaffEmail } = require("../lib/staff");

const BUCKET = "album-photos";
const LINK_DAYS = 14;
const SIGNED_SECONDS = 60 * 60;

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
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    const err = new Error("Supabase is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function siteUrl(req) {
  const configured = String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "127.0.0.1:8765";
  const proto = req.headers["x-forwarded-proto"] || (String(host).includes("localhost") || String(host).includes("127.0.0.1") ? "http" : "https");
  return proto + "://" + host;
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function imageBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const buf = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buf.length < 32 || buf.length > 2000000) return null;
  const type = match[1].toLowerCase();
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return { buf, type, ext };
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

async function requireStaff(supabase, token) {
  const who = await accountByToken(supabase, token);
  if (!who || !isStaffEmail(who.customer_email)) return null;
  return who;
}

async function ensureBucket(supabase) {
  const listed = await supabase.storage.getBucket(BUCKET);
  if (!listed.error && listed.data) return;
  const created = await supabase.storage.createBucket(BUCKET, { public: false });
  if (created.error && !/already exists/i.test(created.error.message || "")) throw created.error;
}

async function sendAlbumEmail(to, name, link, expires) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey || !to) return false;
  const when = new Date(expires).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const summary = "Open My Album\n" + link + "\nThis link expires " + when + " and only opens this customer's photos.";
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: to,
        service: "Customer album",
        order_summary: summary,
        products: "Open My Album",
        quantities: link,
        total_price: "",
        customer_details: name || to,
        customer_name: name || "",
        customer_phone: "",
        customer_email: to,
        client_email: to,
      },
    }),
  });
  return res.ok;
}

async function mintLink(supabase, albumId) {
  const raw = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const saved = await supabase.from("album_access").insert({
    album_id: albumId,
    token_hash: hashToken(raw),
    expires_at: expires,
  });
  if (saved.error) {
    const err = new Error(saved.error.message || "The album link was not saved.");
    if (/album_access/i.test(err.message)) err.message = "The album tables are missing. Run supabase/migrations/20261017160000_customer_album_photos.sql in the Supabase SQL editor.";
    throw err;
  }
  return { raw, expires };
}

function missingTable(error) {
  return error && /album_photos|album_access|schema cache/i.test(error.message || "");
}

async function openAlbum(supabase, raw) {
  if (!raw || String(raw).length < 32) return { status: 401, body: { ok: false, error: "This album link is not valid." } };
  const found = await supabase
    .from("album_access")
    .select("album_id, expires_at")
    .eq("token_hash", hashToken(raw))
    .maybeSingle();
  if (found.error) {
    return { status: 502, body: { ok: false, error: missingTable(found.error) ? "The album tables are missing. Run the customer album SQL in Supabase." : found.error.message } };
  }
  if (!found.data) return { status: 401, body: { ok: false, error: "This album link is not valid." } };
  if (new Date(found.data.expires_at).getTime() < Date.now()) {
    return { status: 401, body: { ok: false, error: "This album link has expired. Ask Lay C Factory for a new one." } };
  }
  const album = await supabase.from("albums").select("id, album_name, order_id, created_at").eq("id", found.data.album_id).maybeSingle();
  if (album.error || !album.data) return { status: 404, body: { ok: false, error: "That album was not found." } };
  const order = await supabase
    .from("orders")
    .select("customer_name")
    .eq("id", album.data.order_id)
    .maybeSingle();
  const photos = await supabase
    .from("album_photos")
    .select("id, storage_path, caption, created_at")
    .eq("album_id", album.data.id)
    .order("created_at", { ascending: true });
  if (photos.error) return { status: 502, body: { ok: false, error: photos.error.message } };
  const shown = [];
  for (const photo of photos.data || []) {
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(photo.storage_path, SIGNED_SECONDS);
    if (signed.error || !signed.data) continue;
    shown.push({
      id: photo.id,
      caption: photo.caption || "",
      created_at: photo.created_at,
      url: signed.data.signedUrl,
    });
  }
  return {
    status: 200,
    body: {
      ok: true,
      album: album.data.album_name || "Your album",
      customer_name: (order.data && order.data.customer_name) || "",
      created_at: album.data.created_at,
      expires_at: found.data.expires_at,
      photos: shown,
    },
  };
}

module.exports = async function handler(req, res) {
  try {
    loadEnv();
    const supabase = supabaseAdmin();
    if (req.method === "GET") {
      const params = new URL(req.url || "", "http://localhost").searchParams;
      const access = params.get("access") || "";
      const opened = await openAlbum(supabase, access);
      return json(res, opened.status, opened.body);
    }
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const payload = await readPayload(req);
    if (!payload) return json(res, 400, { ok: false, error: "The request is missing." });
    const action = text(payload.action, 40);
    if (action === "open") {
      const opened = await openAlbum(supabase, payload.access);
      return json(res, opened.status, opened.body);
    }
    const staff = await requireStaff(supabase, text(payload.token, 80));
    if (!staff) return json(res, 403, { ok: false, error: "Sign in with a staff email to manage customer albums." });

    if (action === "orders") {
      const q = text(payload.q, 80).replace(/[%_]/g, "");
      let query = supabase
        .from("orders")
        .select("id, customer_name, customer_email, customer_phone, status, total, created_at")
        .not("status", "in", "(account,photo)")
        .order("created_at", { ascending: false })
        .limit(40);
      if (q) query = query.or("customer_email.ilike.%" + q + "%,customer_name.ilike.%" + q + "%");
      const list = await query;
      if (list.error) return json(res, 502, { ok: false, error: list.error.message });
      return json(res, 200, { ok: true, orders: list.data || [] });
    }

    if (action === "albums") {
      const orderId = text(payload.order_id, 80);
      const list = await supabase
        .from("albums")
        .select("id, album_name, order_id, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (list.error) return json(res, 502, { ok: false, error: list.error.message });
      return json(res, 200, { ok: true, albums: list.data || [] });
    }

    if (action === "create" || action === "link") {
      let albumId = text(payload.album_id, 80);
      let albumName = text(payload.album_name, 120);
      const orderId = text(payload.order_id, 80);
      if (action === "create") {
        if (!orderId) return json(res, 400, { ok: false, error: "Choose the customer order first." });
        const order = await supabase
          .from("orders")
          .select("id, customer_name, customer_email, status")
          .eq("id", orderId)
          .maybeSingle();
        if (order.error || !order.data || order.data.status === "account" || order.data.status === "photo") {
          return json(res, 404, { ok: false, error: "That order was not found." });
        }
        const created = await supabase
          .from("albums")
          .insert({ order_id: orderId, album_name: albumName || "Your album" })
          .select("id, album_name")
          .single();
        if (created.error || !created.data) return json(res, 502, { ok: false, error: created.error.message || "The album was not created." });
        albumId = created.data.id;
        albumName = created.data.album_name;
      }
      const album = await supabase.from("albums").select("id, album_name, order_id").eq("id", albumId).maybeSingle();
      if (album.error || !album.data) return json(res, 404, { ok: false, error: "That album was not found." });
      const order = await supabase.from("orders").select("customer_name, customer_email").eq("id", album.data.order_id).maybeSingle();
      const linkParts = await mintLink(supabase, album.data.id);
      const link = siteUrl(req) + "/album.html?t=" + linkParts.raw;
      let email_sent = false;
      try {
        email_sent = await sendAlbumEmail(
          order.data && order.data.customer_email,
          order.data && order.data.customer_name,
          link,
          linkParts.expires,
        );
      } catch (e) {
        email_sent = false;
      }
      return json(res, 200, {
        ok: true,
        album_id: album.data.id,
        album_name: album.data.album_name,
        link,
        expires_at: linkParts.expires,
        email_sent,
      });
    }

    if (action === "upload") {
      const albumId = text(payload.album_id, 80);
      const file = imageBuffer(payload.image);
      if (!albumId || !file) return json(res, 400, { ok: false, error: "Choose a JPEG, PNG, or WebP photo under 2 MB." });
      const album = await supabase.from("albums").select("id").eq("id", albumId).maybeSingle();
      if (album.error || !album.data) return json(res, 404, { ok: false, error: "That album was not found." });
      await ensureBucket(supabase);
      const photoId = crypto.randomUUID();
      const storagePath = albumId + "/" + photoId + "." + file.ext;
      const uploaded = await supabase.storage.from(BUCKET).upload(storagePath, file.buf, {
        contentType: file.type,
        upsert: false,
      });
      if (uploaded.error) return json(res, 502, { ok: false, error: uploaded.error.message || "The photo was not stored." });
      const row = await supabase.from("album_photos").insert({
        id: photoId,
        album_id: albumId,
        storage_path: storagePath,
        caption: text(payload.caption, 160) || null,
        content_type: file.type,
        byte_size: file.buf.length,
      });
      if (row.error) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        return json(res, 502, {
          ok: false,
          error: missingTable(row.error) ? "Run the customer album SQL in Supabase, then upload the photo again." : row.error.message,
        });
      }
      return json(res, 200, { ok: true, photo_id: photoId });
    }

    return json(res, 400, { ok: false, error: "Unknown album action." });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The album could not be opened." });
  }
};
