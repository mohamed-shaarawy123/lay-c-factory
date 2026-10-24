const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { readPayload } = require("../lib/body");
const { moderatePhoto, warm, status: modelStatus } = require("../lib/photo-moderate");
const {
  isPublishLocked,
  isFamilyAlbumVisible,
  isPrivatePhoto,
  isAlbumPublished,
  moderationStatus,
  ownerCapabilities,
  markPublished,
  markPrivate,
  markPending,
  markAlbumPublished,
} = require("../lib/photo-privacy");

const inflight = new Set();

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

function hashImage(dataUrl) {
  return crypto.createHash("sha256").update(String(dataUrl || "")).digest("hex");
}

function photoState(items, own) {
  const caps = ownerCapabilities(items, own);
  const status = moderationStatus(items);
  const shared = isFamilyAlbumVisible(items);
  return {
    shared,
    private: !shared,
    pending: status === "pending",
    moderation_status: status,
    publish_locked: caps.publish_locked,
    can_delete: caps.can_delete,
    can_publish: caps.can_publish,
    can_edit: false,
  };
}

function photoBrief(row, whoEmail) {
  const items = row.items && typeof row.items === "object" ? row.items : {};
  const own = whoEmail && row.customer_email === whoEmail;
  const state = photoState(items, own);
  return Object.assign(
    {
      id: row.id,
      email: row.customer_email,
      name: row.customer_name,
      thumb: items.thumb || "",
      ts: items.ts || 0,
      own: Boolean(own),
    },
    state,
  );
}

function visibleToOwner(items) {
  if (!items || items.rejected === true || items.moderation_status === "rejected") return false;
  if (items.admin_hidden === true || items.hidden === true) return false;
  return true;
}

async function publishOwnedPhoto(supabase, who, row) {
  const items = row.items || {};
  if (row.customer_email !== who.customer_email) {
    return { status: 403, body: { ok: false, error: "Only the owner can publish this photo." } };
  }
  if (moderationStatus(items) === "pending") {
    return {
      status: 403,
      body: {
        ok: false,
        pending: true,
        published: false,
        error: "This photo is waiting for review. It stays private and cannot be published yet.",
      },
    };
  }
  if (moderationStatus(items) !== "approved" || items.rejected === true) {
    return { status: 400, body: { ok: false, published: false, error: "This photo was not approved, so it was not published." } };
  }
  if (isPublishLocked(items) || isFamilyAlbumVisible(items)) {
    return {
      status: 200,
      body: {
        ok: true,
        id: row.id,
        already_public: true,
        shared: true,
        publish_locked: true,
        private: false,
        note: "This photo is already public. Sharing is permanent and cannot be reversed.",
      },
    };
  }
  const next = markPublished(items);
  const saved = await supabase
    .from("orders")
    .update({ items: next })
    .eq("id", row.id)
    .eq("status", "photo")
    .eq("customer_email", who.customer_email)
    .select("id");
  if (saved.error || !(saved.data || []).length) {
    return {
      status: 502,
      body: { ok: false, published: false, error: (saved.error && saved.error.message) || "The photo was not published." },
    };
  }
  return {
    status: 200,
    body: {
      ok: true,
      id: row.id,
      shared: true,
      publish_locked: true,
      private: false,
      moderation_status: "approved",
      note: "Published. This photo is public and cannot be made private, edited, or deleted.",
    },
  };
}

async function publishAlbum(supabase, who) {
  if (isAlbumPublished(who.items)) {
    return {
      status: 200,
      body: {
        ok: true,
        already_public: true,
        published: true,
        private: false,
        publish_locked: true,
        note: "This album is already public. Sharing is permanent and cannot be reversed.",
      },
    };
  }
  const list = await supabase
    .from("orders")
    .select("id, customer_email, items")
    .eq("status", "photo")
    .eq("customer_email", who.customer_email)
    .limit(200);
  if (list.error) {
    return { status: 502, body: { ok: false, published: false, error: list.error.message || "The album was not published." } };
  }
  const ready = [];
  let pendingCount = 0;
  let rejectedCount = 0;
  for (const row of list.data || []) {
    let items = row.items && typeof row.items === "object" ? row.items : {};
    if (items.admin_hidden === true || items.hidden === true) continue;
    let status = moderationStatus(items);
    if (status === "pending" && typeof items.image === "string" && items.image.indexOf("data:image/") === 0) {
      const again = await moderatePhoto(items.image, { timeoutMs: 20000 });
      if (again && again.decision === "approved" && again.ok && !again.pending) {
        items = Object.assign({}, items, {
          moderation_status: "approved",
          moderated: true,
          pending: false,
          rejected: false,
          moderation_decided_at: new Date().toISOString(),
          moderation_scores: again.scores || null,
        });
        status = "approved";
      } else if (again && (again.unavailable || again.decision === "unavailable")) {
        status = "pending";
      } else if (again && (again.decision === "rejected" || again.rejected)) {
        const cleared = Object.assign({}, items, {
          image: "",
          thumb: "",
          rejected: true,
          hidden: true,
          shared: false,
          privacy: "private",
          privacy_status: "private",
          pending: false,
          moderated: true,
          moderation_status: "rejected",
          moderation_decided_at: new Date().toISOString(),
          moderation_scores: null,
        });
        await supabase.from("orders").update({ items: cleared }).eq("id", row.id).eq("status", "photo").eq("customer_email", who.customer_email);
        status = "rejected";
      } else {
        status = "pending";
      }
    }
    if (status === "rejected" || items.rejected === true) {
      rejectedCount += 1;
      continue;
    }
    if (status !== "approved") {
      pendingCount += 1;
      continue;
    }
    ready.push({ id: row.id, items });
  }
  if (pendingCount || rejectedCount) {
    const parts = [];
    if (pendingCount) {
      parts.push(pendingCount === 1 ? "1 photo is still in review" : pendingCount + " photos are still in review");
    }
    if (rejectedCount) {
      parts.push(rejectedCount === 1 ? "1 photo was not approved" : rejectedCount + " photos were not approved");
    }
    return {
      status: 409,
      body: {
        ok: false,
        published: false,
        publish_locked: false,
        pending: pendingCount,
        rejected_count: rejectedCount,
        error:
          "The album was not published. " +
          parts.join(", and ") +
          ". Those photos stay in My pictures until each one is approved. Nothing new was shared.",
      },
    };
  }
  let count = 0;
  for (const row of ready) {
    if (isPublishLocked(row.items) && isFamilyAlbumVisible(row.items)) {
      count += 1;
      continue;
    }
    const saved = await supabase
      .from("orders")
      .update({ items: markPublished(row.items) })
      .eq("id", row.id)
      .eq("status", "photo")
      .eq("customer_email", who.customer_email)
      .select("id");
    if (saved.error || !(saved.data || []).length) {
      return {
        status: 502,
        body: {
          ok: false,
          published: false,
          publish_locked: false,
          error: "Publication did not finish, so the album was not marked public. Refresh before treating it as shared.",
        },
      };
    }
    count += 1;
  }
  const accountNext = markAlbumPublished(who.items);
  const account = await supabase.from("orders").update({ items: accountNext }).eq("id", who.id).eq("status", "account").select("id");
  if (account.error || !(account.data || []).length) {
    return {
      status: 502,
      body: {
        ok: false,
        published: false,
        error: "The album publication did not finish saving. Refresh and try again before treating it as public.",
      },
    };
  }
  return {
    status: 200,
    body: {
      ok: true,
      published: true,
      private: false,
      publish_locked: true,
      count,
      note: "The album is public. Sharing is permanent and cannot be reversed. Approved photos cannot be edited, replaced, or deleted.",
    },
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
      const albumPublic = Boolean(who && isAlbumPublished(who.items));
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
        if (!own && !visible) {
          return json(res, 403, { ok: false, error: "That picture is private." });
        }
        if (own && !visibleToOwner(items)) {
          return json(res, 404, { ok: false, error: "That picture was not found." });
        }
        const state = photoState(items, own);
        return json(res, 200, {
          ok: true,
          photo: Object.assign(
            {
              id: one.data.id,
              email: one.data.customer_email,
              name: one.data.customer_name,
              image: own || visible ? items.image || items.thumb || "" : "",
              thumb: items.thumb || "",
              ts: items.ts || 0,
              own,
            },
            state,
          ),
        });
      }
      let locked = false;
      let reason = "";
      let rows = [];
      if (!who) {
        locked = true;
        reason = "Sign in with your email to see albums.";
      } else if (wantMine) {
        const list = await supabase
          .from("orders")
          .select("id, customer_email, customer_name, created_at, items")
          .eq("status", "photo")
          .eq("customer_email", who.customer_email)
          .order("created_at", { ascending: false })
          .limit(80);
        if (list.error) return json(res, 502, { ok: false, error: list.error.message || "The album could not be opened." });
        rows = (list.data || []).filter((row) => visibleToOwner(row.items || {}));
      } else {
        const list = await supabase
          .from("orders")
          .select("id, customer_email, customer_name, created_at, items")
          .eq("status", "photo")
          .order("created_at", { ascending: false })
          .limit(80);
        if (list.error) return json(res, 502, { ok: false, error: list.error.message || "The album could not be opened." });
        rows = (list.data || []).filter((row) => isFamilyAlbumVisible(row.items || {}));
      }
      const whoEmail = who ? who.customer_email : "";
      const photos = rows.map((row) => photoBrief(row, whoEmail));
      return json(res, 200, {
        ok: true,
        photos,
        mine: mineCount,
        locked,
        private: !albumPublic,
        published: albumPublic,
        publish_locked: albumPublic,
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

    if (action === "edit" || action === "replace" || action === "update") {
      return json(res, 403, { ok: false, error: "Photos cannot be edited or replaced." });
    }

    const confirmed = payload.confirm === true || payload.confirm === "true" || payload.confirm_public === true || payload.confirm_public === "true";

    if (payload.privacy === true || payload.privacy === false || payload.privacy === "true" || payload.privacy === "false" || action === "privacy") {
      const wantPrivate = !(payload.privacy === false || payload.privacy === "false");
      if (!wantPrivate) {
        if (!confirmed) {
          return json(res, 400, {
            ok: false,
            needs_confirm: true,
            published: false,
            error: "Confirm public sharing. Once the album is public, you cannot make it private or delete its photos.",
          });
        }
        const published = await publishAlbum(supabase, who);
        return json(res, published.status, published.body);
      }
      if (isAlbumPublished(who.items)) {
        return json(res, 403, {
          ok: false,
          publish_locked: true,
          error: "This album is public. Sharing is permanent and cannot be reversed.",
        });
      }
      const prev = who.items && typeof who.items === "object" ? who.items : {};
      const saved = await supabase
        .from("orders")
        .update({
          items: Object.assign({}, prev, {
            private: true,
            album_published: false,
            privacy: "private",
            privacy_status: "private",
            share_preference: "private",
          }),
        })
        .eq("id", who.id);
      if (saved.error) return json(res, 502, { ok: false, error: saved.error.message || "The album setting was not saved." });
      return json(res, 200, {
        ok: true,
        private: true,
        published: false,
        note: "Your album stays private. Use the share icon when you want to publish it. Publishing cannot be undone.",
      });
    }

    if (action === "publish_album" || action === "share") {
      if (!confirmed) {
        return json(res, 400, {
          ok: false,
          needs_confirm: true,
          published: false,
          error: "Confirm publication. Once this album is public, you cannot make it private or delete its photos.",
        });
      }
      const published = await publishAlbum(supabase, who);
      return json(res, published.status, published.body);
    }

    if (action === "publish") {
      const id = text(payload.id, 80);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(res, 400, { ok: false, error: "That picture was not found." });
      if (!confirmed) {
        return json(res, 400, {
          ok: false,
          needs_confirm: true,
          published: false,
          error: "Confirm publication. Once this photo is public, you cannot make it private or delete it.",
        });
      }
      const one = await supabase
        .from("orders")
        .select("id, customer_email, items, status")
        .eq("id", id)
        .eq("status", "photo")
        .maybeSingle();
      if (one.error || !one.data) return json(res, 404, { ok: false, error: "That picture was not found." });
      const published = await publishOwnedPhoto(supabase, who, one.data);
      return json(res, published.status, published.body);
    }

    if (action === "unpublish" || action === "make_private") {
      return json(res, 403, {
        ok: false,
        published: false,
        error: "Public photos and albums cannot be made private.",
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
          error: "Public photos cannot be deleted.",
          publish_locked: true,
        });
      }
      if (moderationStatus(items) === "approved" && !isPrivatePhoto(items)) {
        return json(res, 403, { ok: false, error: "Only private photos can be deleted by the owner." });
      }
      const gone = await supabase.from("orders").delete().eq("id", id).eq("customer_email", who.customer_email).eq("status", "photo").select("id");
      if (gone.error || !(gone.data || []).length) {
        return json(res, 502, { ok: false, error: (gone.error && gone.error.message) || "The photo was not deleted." });
      }
      return json(res, 200, { ok: true, deleted: true });
    }

    if (payload.id) {
      return json(res, 403, { ok: false, published: false, error: "Saved photos cannot be edited or replaced." });
    }
    if (payload.source !== "camera") {
      return json(res, 400, { ok: false, error: "Only a legal photo from the camera can be saved.", rejected: true, published: false });
    }
    const image = imageData(payload.image);
    const thumb = imageData(payload.thumb) || image;
    if (!image) return json(res, 400, { ok: false, error: "Choose a smaller photo.", rejected: true, published: false });

    const digest = hashImage(image);
    const flightKey = who.customer_email + ":" + digest;
    if (inflight.has(flightKey)) {
      return json(res, 409, {
        ok: false,
        duplicate: true,
        published: false,
        error: "This photo is already being saved. Wait for that attempt to finish.",
      });
    }
    inflight.add(flightKey);
    try {
      const existing = await supabase
        .from("orders")
        .select("id, items")
        .eq("status", "photo")
        .eq("customer_email", who.customer_email)
        .eq("items->>content_hash", digest)
        .limit(1)
        .maybeSingle();
      if (existing.data && existing.data.items) {
        const state = photoState(existing.data.items, true);
        return json(res, 200, Object.assign({
          ok: true,
          duplicate: true,
          id: existing.data.id,
          email: who.customer_email,
          accepted: true,
          note: "This photo is already in your album.",
        }, state));
      }

      const check = await moderatePhoto(image, { timeoutMs: 20000, req });
      if (!check.ok || check.decision === "rejected" || check.decision === "unavailable") {
        const unavailable = check.decision === "unavailable" || check.unavailable === true;
        return json(res, unavailable ? 503 : 400, {
          ok: false,
          rejected: Boolean(check.rejected),
          pending: false,
          published: false,
          moderation_status: check.decision || "rejected",
          error: check.error || "This photo cannot be saved. It did not pass the content check.",
        });
      }

      const decidedAt = new Date().toISOString();
      const base = {
        type: "photo",
        image: check.dataUrl || image,
        thumb,
        ts: Date.now(),
        source: "camera",
        content_hash: digest,
        moderation_status: check.decision,
        moderation_decided_at: decidedAt,
        moderation_provider: check.provider || "nsfwjs-mobilenet-v2",
        moderation_policy: check.policy || "adult-content-bands-v1",
        moderation_scores: check.scores || null,
        rejected: false,
      };
      const pending = check.pending === true || check.decision === "pending";
      const requestedShare = payload.share === true || payload.share === "true";
      const albumPublic = isAlbumPublished(who.items);
      const publishNow = !pending && (albumPublic || requestedShare);
      const items = pending
        ? markPending(base)
        : publishNow
          ? markPublished(base)
          : markPrivate(Object.assign({}, base, { moderated: true, moderation_status: "approved" }));
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
        return json(res, 502, {
          ok: false,
          published: false,
          error: (saved.error && saved.error.message) || "The picture was not saved. It was not published.",
        });
      }
      const state = photoState(items, true);
      const note = pending
        ? "This photo needs a review before it can be shared. It is in My pictures only and is not in Everyone's album."
        : publishNow
          ? albumPublic && !requestedShare
            ? "Saved. This album is already public, so this approved photo was published with it and cannot be made private or deleted."
            : "Saved to your photo binder and Everyone's album. This photo is public and cannot be made private, edited, or deleted."
          : "Saved to your photo binder. It is in My pictures only and is not in Everyone's album.";
      return json(res, 200, Object.assign({
        ok: true,
        id: saved.data.id,
        email: who.customer_email,
        accepted: !pending,
        pending,
        note,
      }, state));
    } finally {
      inflight.delete(flightKey);
    }
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The album was not saved." });
  }
};
