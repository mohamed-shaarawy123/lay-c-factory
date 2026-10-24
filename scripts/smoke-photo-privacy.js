/* Smoke one-way photo privacy rules (API-level, no real camera). */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .split(/\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) return;
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:8765";
const results = [];
function ok(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail || "" });
  console.log((pass ? "PASS" : "FAIL") + "  " + name + (detail ? " — " + detail : ""));
}

async function post(body) {
  const res = await fetch(BASE + "/api/album", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function adminPost(body) {
  const res = await fetch(BASE + "/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  const { markPublished, markPrivate, markPending, isPublishLocked, isFamilyAlbumVisible, moderationStatus } = require("../lib/photo-privacy");
  const { decideScores } = require("../lib/photo-moderate");
  const rejectedScores = decideScores({ porn: 0.91, hentai: 0.1, sexy: 0.2 });
  const pendingScores = decideScores({ porn: 0.5, hentai: 0.1, sexy: 0.2 });
  const approvedScores = decideScores({ porn: 0.02, hentai: 0.01, sexy: 0.1 });
  ok("high-confidence adult score is rejected and not publishable", rejectedScores.decision === "rejected" && rejectedScores.ok === false);
  ok("uncertain score stays pending and is not a rejection delete", pendingScores.decision === "pending" && pendingScores.pending === true && pendingScores.ok === true);
  ok("low score can be approved", approvedScores.decision === "approved" && approvedScores.pending === false);
  ok("pending helper is not family-visible", !isFamilyAlbumVisible(markPending({ moderated: false })) && moderationStatus(markPending({})) === "pending");
  ok("private not locked", !isPublishLocked(markPrivate({})));
  ok("public locked", isPublishLocked(markPublished({})));
  ok("public visible", isFamilyAlbumVisible(markPublished({ moderated: true })));
  ok("rejected not visible", !isFamilyAlbumVisible(Object.assign(markPublished({}), { rejected: true })));
  ok("admin_hidden not visible", !isFamilyAlbumVisible(Object.assign(markPublished({}), { admin_hidden: true })));

  const sb = createClient(
    String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const staff = require("../lib/staff");
  const accounts = await sb.from("orders").select("id, customer_email, customer_name, items").eq("status", "account").limit(40);
  let token = "";
  let email = "";
  let accountId = "";
  let adminToken = "";
  for (const a of accounts.data || []) {
    if (a.items && a.items.token) {
      if (!token) {
        token = a.items.token;
        email = a.customer_email;
        accountId = a.id;
      }
      if (staff.isStaffEmail(a.customer_email)) adminToken = a.items.token;
    }
  }
  ok("user token", !!token, email);
  let otherToken = "";
  for (const a of accounts.data || []) {
    if (a.items && a.items.token && a.customer_email !== email) {
      otherToken = a.items.token;
      break;
    }
  }
  const accountBefore = accountId
    ? await sb.from("orders").select("items").eq("id", accountId).maybeSingle()
    : { data: null };
  const originalAccountItems = accountBefore.data && accountBefore.data.items ? accountBefore.data.items : null;
  const existingPhotos = email
    ? await sb.from("orders").select("id, items").eq("status", "photo").eq("customer_email", email)
    : { data: [] };
  const photoSnap = new Map((existingPhotos.data || []).map((row) => [row.id, row.items]));
  const created = [];
  async function restore() {
    for (const id of created) {
      await sb.from("orders").delete().eq("id", id);
    }
    for (const [id, items] of photoSnap) {
      await sb.from("orders").update({ items }).eq("id", id);
    }
    if (accountId && originalAccountItems) {
      await sb.from("orders").update({ items: originalAccountItems }).eq("id", accountId);
    }
  }

  try {
  // Set preference private without flipping existing public photos
  const prefPriv = await post({ token, privacy: true });
  const alreadyPublic = Boolean(originalAccountItems && originalAccountItems.album_published === true);
  ok(
    "set private preference",
    alreadyPublic ? prefPriv.status === 403 : prefPriv.status === 200 && prefPriv.data.private === true,
    prefPriv.data.error || "",
  );

  // Insert private photo directly (skip moderation image path for unit API of delete/publish)
  const priv = await sb
    .from("orders")
    .insert({
      customer_name: "Privacy Smoke",
      customer_email: email,
      customer_phone: "",
      delivery_address: "",
      items: markPrivate({ type: "photo", thumb: "data:image/jpeg;base64,/9j/4AAQ", image: "data:image/jpeg;base64,/9j/4AAQ", ts: Date.now(), source: "camera", moderated: true }),
      total: 0,
      status: "photo",
    })
    .select("id")
    .single();
  ok("private photo created", !!priv.data?.id, priv.error && priv.error.message);
  const privId = priv.data && priv.data.id;
  if (privId) created.push(privId);

  const pubAttempt = await post({ token, action: "publish", id: privId });
  ok("publish needs confirm", pubAttempt.status === 400 && pubAttempt.data.needs_confirm);

  const published = await post({ token, action: "publish", id: privId, confirm: true });
  ok("publish private photo", published.status === 200 && published.data.publish_locked, published.data.error);
  const persisted = await fetch(BASE + "/api/album?id=" + encodeURIComponent(privId) + "&token=" + encodeURIComponent(token));
  const persistedBody = await persisted.json().catch(() => ({}));
  ok("public status persists for the owner", persisted.status === 200 && persistedBody.photo && persistedBody.photo.publish_locked === true, persistedBody.error);

  const unpub = await post({ token, action: "unpublish", id: privId });
  ok("owner cannot unpublish", unpub.status === 403);

  const delPub = await post({ token, action: "delete", id: privId });
  ok("owner cannot delete public", delPub.status === 403, delPub.data.error);

  // Another private photo for delete
  const priv2 = await sb
    .from("orders")
    .insert({
      customer_name: "Privacy Smoke",
      customer_email: email,
      customer_phone: "",
      delivery_address: "",
      items: markPrivate({ type: "photo", thumb: "x", image: "x", ts: Date.now(), moderated: true }),
      total: 0,
      status: "photo",
    })
    .select("id")
    .single();
  if (priv2.data && priv2.data.id) created.push(priv2.data.id);
  const delOk = await post({ token, action: "delete", id: priv2.data.id });
  ok("owner can delete private", delOk.status === 200 && delOk.data.deleted);

  const jpeg = require("jpeg-js");
  const w = 180;
  const h = 180;
  const raw = Buffer.alloc(w * h * 4);
  for (let i = 0; i < raw.length; i += 4) {
    raw[i] = (i * 13) % 255;
    raw[i + 1] = (i * 7) % 200;
    raw[i + 2] = 40 + ((i * 3) % 180);
    raw[i + 3] = 255;
  }
  const encoded = jpeg.encode({ data: raw, width: w, height: h }, 70);
  const dataUrl = "data:image/jpeg;base64," + Buffer.from(encoded.data).toString("base64");
  await fetch(BASE + "/api/album?warm=1").catch(() => {});
  const shot = await post({ token, image: dataUrl, thumb: dataUrl, source: "camera" });
  if (shot.data && shot.data.id) created.push(shot.data.id);
  ok(
    "legal camera jpeg passes moderation before it is stored",
    shot.status === 200 && shot.data.ok === true && (shot.data.moderation_status === "approved" || shot.data.moderation_status === "pending"),
    shot.data.error || shot.data.moderation_status || String(shot.status),
  );
  ok(
    "moderated jpeg is not published while the album is private",
    shot.data && shot.data.publish_locked !== true && shot.data.shared !== true,
    "shared=" + shot.data.shared + " pending=" + shot.data.pending,
  );
  const again = await post({ token, image: dataUrl, thumb: dataUrl, source: "camera" });
  ok("duplicate upload does not create another photo", again.data && again.data.duplicate === true && again.data.id === shot.data.id, again.data && again.data.error);
  if (otherToken && shot.data && shot.data.id) {
    const hidden = await fetch(BASE + "/api/album?id=" + encodeURIComponent(shot.data.id) + "&token=" + encodeURIComponent(otherToken));
    ok("unauthorized user cannot view a private photo", hidden.status === 403, String(hidden.status));
  } else {
    ok("unauthorized user cannot view a private photo", false, "no second account or photo");
  }

  const raw2 = Buffer.alloc(w * h * 4);
  for (let i = 0; i < raw2.length; i += 4) {
    raw2[i] = (i * 13 + 9) % 255;
    raw2[i + 1] = (i * 7 + 4) % 200;
    raw2[i + 2] = 48 + ((i * 3) % 160);
    raw2[i + 3] = 255;
  }
  const encoded2 = jpeg.encode({ data: raw2, width: w, height: h }, 70);
  const sharedUrl = "data:image/jpeg;base64," + Buffer.from(encoded2.data).toString("base64");
  const sharedShot = await post({ token, image: sharedUrl, thumb: sharedUrl, source: "camera", share: true });
  if (sharedShot.data && sharedShot.data.id) created.push(sharedShot.data.id);
  ok(
    "checkbox share publishes an approved photo and holds an uncertain one",
    sharedShot.status === 200 &&
      sharedShot.data.ok === true &&
      (sharedShot.data.moderation_status === "approved"
        ? sharedShot.data.publish_locked === true && sharedShot.data.shared === true
        : sharedShot.data.moderation_status === "pending" && sharedShot.data.publish_locked !== true && sharedShot.data.shared !== true),
    sharedShot.data.error || sharedShot.data.moderation_status,
  );
  if (sharedShot.data && sharedShot.data.moderation_status === "pending" && sharedShot.data.id) {
    await sb.from("orders").delete().eq("id", sharedShot.data.id);
  }
  const stillPrivateAlbum = await fetch(BASE + "/api/album?mine=1&token=" + encodeURIComponent(token));
  const stillPrivateBody = await stillPrivateAlbum.json().catch(() => ({}));
  ok(
    "sharing one photo does not change the album privacy flag",
    stillPrivateBody.published !== true,
    "published=" + stillPrivateBody.published,
  );
  if (otherToken && sharedShot.data && sharedShot.data.id && shot.data && shot.data.id) {
    const seen = await fetch(BASE + "/api/album?id=" + encodeURIComponent(sharedShot.data.id) + "&token=" + encodeURIComponent(otherToken));
    const hidden = await fetch(BASE + "/api/album?id=" + encodeURIComponent(shot.data.id) + "&token=" + encodeURIComponent(otherToken));
    const everyone = await fetch(BASE + "/api/album?token=" + encodeURIComponent(otherToken));
    const everyoneBody = await everyone.json().catch(() => ({}));
    ok(
      "another user can open a published photo",
      sharedShot.data.moderation_status === "pending" ? seen.status === 403 : seen.status === 200,
      String(seen.status),
    );
    ok("another user still cannot open the private photo", hidden.status === 403);
    ok(
      "everyone's album loads published photos only",
      everyone.status === 200 && everyoneBody.locked !== true && Array.isArray(everyoneBody.photos) && !everyoneBody.photos.some((p) => p.id === shot.data.id),
      everyoneBody.reason || String(everyone.status),
    );
  }

  const blocker = await sb
    .from("orders")
    .insert({
      customer_name: "Privacy Smoke",
      customer_email: email,
      customer_phone: "",
      delivery_address: "",
      items: markPending({ type: "photo", thumb: "", image: "", ts: Date.now(), source: "camera", moderated: false }),
      total: 0,
      status: "photo",
    })
    .select("id")
    .single();
  if (blocker.data && blocker.data.id) created.push(blocker.data.id);
  const blocked = await post({ token, action: "publish_album", confirm: true, confirm_public: true });
  ok("pending photo blocks album publication", blocked.status === 409 && blocked.data.published !== true, blocked.data.error);
  if (blocker.data && blocker.data.id) await sb.from("orders").delete().eq("id", blocker.data.id);

  // Preference public requires confirm. The share icon uses the same confirmation.
  const prefPubNo = await post({ token, privacy: false });
  const shareNo = await post({ token, action: "publish_album" });
  ok("public preference needs confirm", prefPubNo.status === 400 && prefPubNo.data.needs_confirm && prefPubNo.data.published !== true);
  ok("share icon needs confirm and does not publish yet", shareNo.status === 400 && shareNo.data.needs_confirm && shareNo.data.published !== true);
  const prefPub = await post({ token, action: "publish_album", confirm: true, confirm_public: true });
  ok("share icon publishes the album", prefPub.status === 200 && prefPub.data.private === false && prefPub.data.publish_locked === true, prefPub.data.error);
  if (shot.data && shot.data.id) {
    const after = await sb.from("orders").select("items").eq("id", shot.data.id).maybeSingle();
    const items = after.data && after.data.items;
    if (shot.data.moderation_status === "pending") {
      ok("publishing the album leaves an uncertain photo private", items && !isFamilyAlbumVisible(items) && moderationStatus(items) === "pending");
    } else {
      ok("publishing the album locks the approved photo", items && isPublishLocked(items) && isFamilyAlbumVisible(items));
    }
  }

  // Existing public photo still locked after preference private again
  await post({ token, privacy: true });
  const still = await sb.from("orders").select("items").eq("id", privId).maybeSingle();
  ok("existing public stays locked after pref private", isPublishLocked(still.data.items));

  // Admin can hide/remove
  if (adminToken) {
    const hide = await adminPost({ op: "photo_hide", token: adminToken, id: privId });
    ok("admin can hide public photo", hide.status === 200 && hide.data.hidden, hide.data.error);
    const gone = await adminPost({ op: "delete", token: adminToken, id: privId });
    ok("admin can delete public photo", gone.status === 200, gone.data.error);
  } else {
    ok("admin can hide public photo", false, "no admin token");
    ok("admin can delete public photo", false, "no admin token");
    if (privId) await sb.from("orders").delete().eq("id", privId);
  }

  const html = fs.readFileSync(path.join(__dirname, "..", "public", "factory.js"), "utf8");
  ok("ui confirm + share icon + delete/publish", /confirm_public/.test(html) && /delphoto/.test(html) && /Make public/.test(html) && /share-album/.test(html));

  // Uncertain photo: stored private, hidden from other people, cannot be published.
  const pendingRow = await sb
    .from("orders")
    .insert({
      customer_name: "Privacy Smoke",
      customer_email: email,
      customer_phone: "",
      delivery_address: "",
      items: markPending({
        type: "photo",
        thumb: "data:image/jpeg;base64,/9j/4AAQ",
        image: "data:image/jpeg;base64,/9j/4AAQ",
        ts: Date.now(),
        source: "camera",
        moderated: false,
      }),
      total: 0,
      status: "photo",
    })
    .select("id")
    .single();
  ok("pending photo stored", !!pendingRow.data?.id, pendingRow.error && pendingRow.error.message);
  const pendingId = pendingRow.data && pendingRow.data.id;
  if (pendingId) created.push(pendingId);
  const pendingPublish = pendingId ? await post({ token, action: "publish", id: pendingId, confirm: true }) : { status: 0, data: {} };
  ok("pending photo cannot be published", pendingPublish.status === 403 && pendingPublish.data.pending === true, pendingPublish.data.error);
  const pendingStill = pendingId ? await sb.from("orders").select("items").eq("id", pendingId).maybeSingle() : { data: null };
  ok("pending photo remains private", pendingStill.data && moderationStatus(pendingStill.data.items) === "pending" && !isFamilyAlbumVisible(pendingStill.data.items));
  if (otherToken && pendingId) {
    const stranger = await fetch(BASE + "/api/album?id=" + encodeURIComponent(pendingId) + "&token=" + encodeURIComponent(otherToken));
    const strangerBody = await stranger.json().catch(() => ({}));
    ok("other user cannot open a private pending photo", stranger.status === 403, strangerBody.error || String(stranger.status));
  } else {
    ok("other user cannot open a private pending photo", false, "no second account");
  }

  const replaced = pendingId
    ? await post({ token, action: "replace", id: pendingId, image: "data:image/jpeg;base64,/9j/4AAQ", source: "camera" })
    : { status: 0, data: {} };
  ok("replace is rejected", replaced.status === 403, replaced.data.error);

  const anonKey = String(process.env.SUPABASE_ANON_KEY || "").replace(/\s+/g, "");
  if (anonKey && pendingId) {
    const anon = createClient(String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""), anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anonRead = await anon.from("orders").select("id, items").eq("id", pendingId);
    const anonWrite = await anon.from("orders").update({ items: { shared: false, privacy: "private" } }).eq("id", pendingId);
    const anonDelete = await anon.from("orders").delete().eq("id", pendingId);
    const storageWrite = await anon.storage.from("album-photos").upload("bypass/" + pendingId + ".jpg", Buffer.from("not-a-photo"), {
      contentType: "image/jpeg",
      upsert: true,
    });
    ok(
      "anon cannot read photo rows",
      Boolean(anonRead.error) || (anonRead.data || []).length === 0,
      anonRead.error && anonRead.error.message,
    );
    ok("anon cannot update a photo", Boolean(anonWrite.error) || (anonWrite.data || []).length === 0, anonWrite.error && anonWrite.error.message);
    ok("anon cannot delete a photo", Boolean(anonDelete.error) || (anonDelete.data || []).length === 0, anonDelete.error && anonDelete.error.message);
    ok("anon cannot write album storage", Boolean(storageWrite.error), storageWrite.error && storageWrite.error.message);
  } else {
    const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const noKey = await fetch(url + "/rest/v1/orders?status=eq.photo&select=id&limit=1");
    const bogus = await fetch(url + "/rest/v1/orders?status=eq.photo&select=id&limit=1", {
      headers: { apikey: "not-a-key", Authorization: "Bearer not-a-key" },
    });
    const storage = await fetch(url + "/storage/v1/object/album-photos/bypass/test.jpg", {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: Buffer.from("no"),
    });
    ok(
      "unauthenticated database and storage requests are rejected",
      noKey.status === 401 && bogus.status === 401 && storage.status !== 200,
      "db=" + noKey.status + " bogus=" + bogus.status + " storage=" + storage.status + " (SUPABASE_ANON_KEY is not set, so a signed-in anon JWT was not tested)",
    );
  }

  const bad = await post({ token, image: "data:text/plain;base64,aGVsbG8=", source: "camera" });
  ok("non-image upload is not published", bad.status >= 400 && bad.data.published !== true && !bad.data.id, bad.data.error);

  } finally {
    await restore();
  }
  const failed = results.filter((r) => !r.pass);
  console.log("\n" + results.filter((r) => r.pass).length + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
