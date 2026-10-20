/* Smoke: account directory, invite code to admin, revoke, redeem rejection */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

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
  const res = await fetch(BASE + "/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  const sb = createClient(
    String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const staff = require("../lib/staff");
  const accounts = await sb.from("orders").select("customer_email, items").eq("status", "account").limit(30);
  let token = "";
  let adminEmail = "";
  for (const a of accounts.data || []) {
    if (staff.isStaffEmail(a.customer_email) && a.items && a.items.token) {
      token = a.items.token;
      adminEmail = a.customer_email;
      break;
    }
  }
  ok("admin token", !!token, adminEmail);

  const html = fs.readFileSync(path.join(__dirname, "..", "public", "admin.html"), "utf8");
  ok("profile-grid css", /profile-grid/.test(html) && /profile-field/.test(html));
  ok("recipient picker ui", /account_directory/.test(html) && /Copy Code/.test(html));
  ok("no giant card b on profile", /\.cards > \.card > b/.test(html));

  const dir = await post({ op: "account_directory", token, q: "" });
  ok("account directory", dir.status === 200 && Array.isArray(dir.data.rows), "rows=" + ((dir.data.rows || []).length));

  const unauthDir = await post({ op: "account_directory", q: "" });
  ok("directory requires admin", unauthDir.status === 403);

  const meet = await post({ op: "meet_create", token, name: "UI Smoke Room", duration_min: 30 });
  ok("create room", meet.status === 200 && meet.data.ok, meet.data.id);
  const meetId = meet.data.id;

  // Pick an account email if any, else use admin email as recipient for API path
  const recipient = (dir.data.rows || []).find((r) => r.has_account)?.email || adminEmail;

  // Bypass EmailJS by inserting invite directly, then test revoke/redeem; separately probe invite API error handling
  const access = crypto.randomBytes(5).toString("hex");
  const codeHash = crypto.createHash("sha256").update(access.toLowerCase()).digest("hex");
  const expires = new Date(Date.now() + 3600 * 1000).toISOString();
  const ins = await sb
    .from("orders")
    .insert({
      customer_name: "Smoke Recipient",
      customer_email: recipient,
      customer_phone: "",
      delivery_address: "",
      items: {
        type: "meet_invite",
        meeting_id: meetId,
        email: recipient,
        recipient_name: "Smoke Recipient",
        has_account: true,
        code_hash: codeHash,
        expires_at: expires,
        redeemed_at: null,
        revoked_at: null,
      },
      total: 0,
      status: "meet_invite",
    })
    .select("id")
    .single();
  ok("invite stored hashed", !!ins.data?.id, ins.error && ins.error.message);

  const list = await post({ op: "meet_invites", token, id: meetId });
  ok("invites list", list.status === 200 && (list.data.rows || []).some((r) => r.email === recipient));

  const activate = await sb.from("orders").select("items").eq("id", meetId).maybeSingle();
  await sb
    .from("orders")
    .update({ items: Object.assign({}, activate.data.items || {}, { active: true, private: true }) })
    .eq("id", meetId);

  const good = await post({ op: "redeem", email: recipient, access_code: access });
  // First redeem should work before revoke test — use a second code for revoke
  ok("redeem works before revoke", good.status === 200 && good.data.ok, good.data.error || good.data.room);

  const access2 = crypto.randomBytes(5).toString("hex");
  const hash2 = crypto.createHash("sha256").update(access2.toLowerCase()).digest("hex");
  const ins2 = await sb
    .from("orders")
    .insert({
      customer_name: "Revoke Me",
      customer_email: recipient,
      customer_phone: "",
      delivery_address: "",
      items: {
        type: "meet_invite",
        meeting_id: meetId,
        email: recipient,
        code_hash: hash2,
        expires_at: expires,
        redeemed_at: null,
        revoked_at: null,
      },
      total: 0,
      status: "meet_invite",
    })
    .select("id")
    .single();
  const rev = await post({ op: "meet_invite_revoke", token, invite_id: ins2.data.id, meeting_id: meetId });
  ok("revoke invite", rev.status === 200 && rev.data.ok, rev.data.error);
  const denied = await post({ op: "redeem", email: recipient, access_code: access2 });
  ok("revoked code rejected", denied.status === 403, denied.data.error);

  const codeLeak = await post({ op: "available" });
  ok("public list empty", (codeLeak.data.rooms || []).length === 0);

  // Seniors room update reflects in order document
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const room1 = await fetch(BASE + "/api/room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      customer_name: "Class",
      customer_email: "class@example.com",
      items: [{ n: "Polo", p: 600 }],
      rows: [{ n: "Old Name", p: "1", l: [{ s: "M", q: 1 }] }],
      ex: { t: [], ct: false, dl: "", pc: 0 },
    }),
  }).then((r) => r.json());
  const room2 = await fetch(BASE + "/api/room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      customer_name: "Class",
      customer_email: "class@example.com",
      items: [{ n: "Polo", p: 600 }],
      rows: [
        { n: "Old Name", p: "1", l: [{ s: "M", q: 1 }] },
        { n: "New Student", p: "2", l: [{ s: "L", q: 2 }] },
      ],
      ex: { t: [], ct: false, dl: "", pc: 0 },
    }),
  }).then((r) => r.json());
  const doc = await post({ op: "order_document", token, id: room1.room_id || room2.room_id });
  const names = ((doc.data.document && doc.data.document.students) || []).map((s) => s.name).join(",");
  ok("seniors sheet update in admin doc", /New Student/.test(names), names);

  if (meetId) await sb.from("orders").delete().eq("id", meetId);
  await sb.from("orders").delete().eq("status", "meet_invite").eq("items->>meeting_id", meetId);
  if (room1.room_id) await sb.from("orders").delete().eq("id", room1.room_id);

  const failed = results.filter((r) => !r.pass);
  console.log("\n" + results.filter((r) => r.pass).length + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
