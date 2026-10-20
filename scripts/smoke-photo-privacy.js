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
  const { markPublished, markPrivate, isPublishLocked, isFamilyAlbumVisible } = require("../lib/photo-privacy");
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

  // Set preference private without flipping existing public photos
  const prefPriv = await post({ token, privacy: true });
  ok("set private preference", prefPriv.status === 200 && prefPriv.data.private === true);

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
  const privId = priv.data.id;

  const pubAttempt = await post({ token, action: "publish", id: privId });
  ok("publish needs confirm", pubAttempt.status === 400 && pubAttempt.data.needs_confirm);

  const published = await post({ token, action: "publish", id: privId, confirm: true });
  ok("publish private photo", published.status === 200 && published.data.publish_locked, published.data.error);

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
  const delOk = await post({ token, action: "delete", id: priv2.data.id });
  ok("owner can delete private", delOk.status === 200 && delOk.data.deleted);

  // Preference public requires confirm
  const prefPubNo = await post({ token, privacy: false });
  ok("public preference needs confirm", prefPubNo.status === 400 && prefPubNo.data.needs_confirm);
  const prefPub = await post({ token, privacy: false, confirm_public: true });
  ok("public preference with confirm", prefPub.status === 200 && prefPub.data.private === false);

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

  // Restore account preference if needed
  if (accountId) {
    const acc = await sb.from("orders").select("items").eq("id", accountId).maybeSingle();
    await sb.from("orders").update({ items: Object.assign({}, acc.data.items || {}, { private: false }) }).eq("id", accountId);
  }

  const html = fs.readFileSync(path.join(__dirname, "..", "public", "factory.js"), "utf8");
  ok("ui confirm + delete/publish", /confirm_public/.test(html) && /delphoto/.test(html) && /Make public/.test(html));

  const failed = results.filter((r) => !r.pass);
  console.log("\n" + results.filter((r) => r.pass).length + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
