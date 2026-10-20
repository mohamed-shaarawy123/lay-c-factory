const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { readPayload } = require("../lib/body");
const { moderatePhoto, warm, status: modelStatus } = require("../lib/photo-moderate");
const {
  isPublishLocked,
  isFamilyAlbumVisible,
  isPrivatePhoto,
  ownerCapabilities,
  markPublished,
  markPrivate,
} = require("../lib/photo-privacy");

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
    .replace(/^['"]|['']$/g, "")
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

function photoBrief(row, whoEmail) {
  const items = row.items && typeof row.items === "object" ? row.items : {};
  const own = whoEmail && row.customer_email === whoEmail;
  const caps = ownerCapabilities(items, own);
  return {
    id: row.id,
    email: row.customer_email,
    name: row.customer_name,
    thumb: items.thumb || "",
    ts: items.ts || 0,
    shared: isFamilyAlbumVisible(items),
    private: isPrivatePhoto(items),
    publish_locked: caps.publish_locked,
    can_delete: caps.can_delete,
    can_publish: caps.can_publish,
    own: Boolean(own),
  };
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
      let wantWarm = false;
      try {
        const q = new URL(req.url || "", "http://localhost").searchParams;
        id = q.get("id") || "";
        mine = q.get("token") || "";
        wantWarm = q.get("warm") === "1";
      } catch (e) {}
      let wantMine = false;
      try {
        wantMine = new URL(req.url || "", "http://localhost").searchParams.get("mine") === "1";
      } catch (e) {}
      if (req.query) {
        id = id || req.query.id || "";
        mine = mine || req.query.token || "";
        if (String(req.query.mine) === "1") wantMine = true;
        if (String(req.query.warm) === "1") wantWarm = true;
      }
      if (wantWarm) {
        const ok = await warm({ req });
        const st = modelStatus();
        return json(res, ok ? 200 : 503, {
          ok,
          ready: st.ready,
          error: st.error || (ok ? "" : "The photo check model could not be loaded."),
        });
      }
      const who = mine ? await accountByToken(supabase, mine) : null;
      const mineCount = who ? await photoCount(supabase, who.customer_email) : 0;
      const isPrivatePref = Boolean(who && who.items && who.items.private);
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
        const items = one.data.items;
        const own = one.data.customer_email === who.customer_email;
        const visible = isFamilyAlbumVisible(items);
        if (!own && (isPrivatePref || mineCount < 1 || !visible)) {
          return json(res, 403, {
            ok: false,
            error: "Take a camera photo on a shared album before opening someone else's picture.",
          });
        }
        if (!own && !visible) {
          return json(res, 403, { ok: false, error: "That picture is private." });
        }
        const caps = ownerCapabilities(items, own);
        return json(res, 200, {
          ok: true,
          photo: {
            id: one.data.id,
            email: one.data.customer_email,
            name: one.data.customer_name,
            image: own || visible ? items.image || items.thumb || "" : "",
            thumb: items.thumb || "",
            ts: items.ts || 0,
            shared: visible,
            private: isPrivatePhoto(items),
            publish_locked: caps.publish_locked,
            can_delete: caps.can_delete,
            can_publish: caps.can_publish,
            own,
          },
        });
      }
      let query = supabase
        .from("orders")
        .select("id, customer_email, customer_name, created_at, items")
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
      } else if (isPrivatePref) {
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
      const whoEmail = who ? who.customer_email : "";
      const photos = rows
        .filter((row) => {
          const items = row.items || {};
          if (wantMine) return row.customer_email === whoEmail;
          return isFamilyAlbumVisible(items);
        })
        .map((row) => photoBrief(row, whoEmail));
      return json(res, 200, {
        ok: true,
        photos,
        mine: mineCount,
        locked,
        private: isPrivatePref,
        reason,
      });
    }

    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use GET or POST." });
    const payload = await readPayload(req, { timeoutMs: 45000 });
    if (!payload) return json(res, 400, { ok: false, error: "The picture is missing." });
    const who = await accountByToken(supabase, text(payload.token, 80));
    if (!who) {
      return json(res, 401, { ok: false, error: "Sign in with your email and password before adding a picture." });
    }
    const action = text(payload.action || payload.op, 40);

    // Account-level preference only. Never reverses already-public photos.
    if (payload.privacy === true || payload.privacy === false || action === "privacy") {
      const wantPrivate = payload.privacy === true || payload.privacy === "true";
      if (!wantPrivate && payload.confirm_public !== true && payload.confirm_public !== "true") {
        return json(res, 400, {
          ok: false,
          needs_confirm: true,
          error:
            "Confirm public sharing. Photos shared publicly stay in the family album permanently. You will not be able to make them private or delete them later.",
        });
      }
      const prev = who.items && typeof who.items === "object" ? who.items : {};
      const saved = await supabase
        .from("orders")
        .update({
          items: Object.assign({}, prev, {
            private: wantPrivate,
            // Prefer public for future captures when not private.
            share_preference: wantPrivate ? "private" : "public",
          }),
        })
        .eq("id", who.id);
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The album setting was not saved." });
      return json(res, 200, {
        ok: true,
        private: wantPrivate,
        note: wantPrivate
          ? "New photos stay private. Photos already in the family album remain public and cannot be removed by you."
          : "New photos will be shared publicly after moderation. Public photos cannot later be made private or deleted.",
      });
    }

    if (action === "publish") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That picture was not found." });
      if (payload.confirm !== true && payload.confirm !== "true") {
        return json(res, 400, {
          ok: false,
          needs_confirm: true,
          error:
            "Confirm publication. Once this photo is public in the family album, you cannot make it private or delete it.",
        });
      }
      const one = await supabase
        .from("orders")
        .select("id, customer_email, items, status")
        .eq("id", id)
        .eq("status", "photo")
        .maybeSingle();
      if (one.error || !one.data) return json(res, 404, { ok: false, error: "That picture was not found." });
      if (one.data.customer_email !== who.customer_email) {
        return json(res, 403, { ok: false, error: "Only the owner can publish this photo." });
      }
      const items = one.data.items || {};
      if (items.rejected === true || items.moderated === false) {
        return json(res, 400, { ok: false, error: "This photo was not approved for the family album." });
      }
      if (isPublishLocked(items) || isFamilyAlbumVisible(items)) {
        return json(res, 403, {
          ok: false,
          error: "This photo is already public and cannot be changed back to private.",
          publish_locked: true,
        });
      }
      const next = markPublished(items);
      const saved = await supabase.from("orders").update({ items: next }).eq("id", id).select("id").single();
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The photo was not published." });
      return json(res, 200, { ok: true, id, shared: true, publish_locked: true });
    }

    if (action === "unpublish" || action === "make_private") {
      return json(res, 403, {
        ok: false,
        error: "Public photos cannot be made private. Contact Lay C admin only for moderation removals.",
        publish_locked: true,
      });
    }

    if (action === "delete") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That picture was not found." });
      const one = await supabase
        .from("orders")
        .select("id, customer_email, items, status")
        .eq("id", id)
        .eq("status", "photo")
        .maybeSingle();
      if (one.error || !one.data) return json(res, 404, { ok: false, error: "That picture was not found." });
      if (one.data.customer_email !== who.customer_email) {
        return json(res, 403, { ok: false, error: "Only the owner can delete a private photo." });
      }
      const items = one.data.items || {};
      if (isPublishLocked(items) || isFamilyAlbumVisible(items)) {
        return json(res, 403, {
          ok: false,
          error: "Public photos cannot be deleted from the binder or family album.",
          publish_locked: true,
        });
      }
      if (!isPrivatePhoto(items) && items.shared !== false) {
        return json(res, 403, { ok: false, error: "Only private photos can be deleted by the owner." });
      }
      const gone = await supabase.from("orders").delete().eq("id", id).eq("customer_email", who.customer_email).select("id");
      if (gone.error || !(gone.data || []).length) {
        return json(res, 502, { ok: false, error: (gone.error && gone.error.message) || "The photo was not deleted." });
      }
      return json(res, 200, { ok: true, deleted: true });
    }

    if (payload.source !== "camera") {
      return json(res, 400, { ok: false, error: "Only a legal photo from the camera can be saved.", rejected: true });
    }
    const image = imageData(payload.image);
    const thumb = imageData(payload.thumb) || image;
    if (!image) return json(res, 400, { ok: false, error: "Choose a smaller photo.", rejected: true });

    // Trusted moderation before any permanent store or family-album share.
    const check = await moderatePhoto(image, { timeoutMs: 20000, req });
    if (!check.ok) {
      return json(res, 400, {
        ok: false,
        rejected: true,
        error: check.error || "This photo cannot be saved. Only a legal photo is allowed.",
      });
    }

    const preferPrivate = Boolean(who.items && who.items.private);
    let items = {
      type: "photo",
      image: check.dataUrl || image,
      thumb,
      ts: Date.now(),
      source: "camera",
      moderated: true,
      rejected: false,
    };
    if (preferPrivate) {
      items = markPrivate(items);
    } else {
      items = markPublished(items);
    }

    const saved = await supabase
      .from("orders")
      .insert({
        customer_name: who.customer_name,
        customer_email: who.customer_email,
        customer_phone: "",
        delivery_address: "",
        items,
        total: 0,
        status: "photo",
      })
      .select("id")
      .single();
    if (saved.error || !saved.data) {
      return json(res, 502, { ok: false, error: (saved.error && saved.error.message) || "The picture was not saved." });
    }
    return json(res, 200, {
      ok: true,
      id: saved.data.id,
      email: who.customer_email,
      accepted: true,
      shared: !preferPrivate,
      publish_locked: !preferPrivate,
      private: preferPrivate,
    });
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The album was not saved." });
  }
};
