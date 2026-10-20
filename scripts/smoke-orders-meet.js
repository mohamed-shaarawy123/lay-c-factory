/* Smoke tests for orders sync + private meeting invites (local server). */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env");
  fs.readFileSync(file, "utf8")
    .split(/\n/)
    .forEach((line) => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) return;
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    });
}

loadEnv();

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:8765";
const results = [];

function ok(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail || "" });
  console.log((pass ? "PASS" : "FAIL") + "  " + name + (detail ? " — " + detail : ""));
}

async function post(api, body) {
  const res = await fetch(BASE + api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  let quoteId = "";
  const sb = createClient(
    String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Bucket
  const bucket = await sb.storage.createBucket("order-files", { public: false });
  ok(
    "order-files bucket ready",
    !bucket.error || /already exists/i.test(bucket.error.message || ""),
    bucket.error && bucket.error.message,
  );

  // meeting_invites table (optional; fallback exists)
  const table = await sb.from("meeting_invites").select("id").limit(1);
  const hasTable = !table.error;
  ok(
    "meeting_invites table or fallback",
    true,
    hasTable ? "TABLE_OK" : "FALLBACK via orders.meet_invite (" + (table.error && table.error.message) + ")",
  );

  // Unauthenticated admin blocked
  const unauth = await post("/api/admin", { op: "orders" });
  ok("unauth admin blocked", unauth.status === 403, "status=" + unauth.status);

  // Public available rooms empty
  const avail = await post("/api/admin", { op: "available" });
  ok(
    "public room list empty",
    avail.status === 200 && Array.isArray(avail.data.rooms) && avail.data.rooms.length === 0,
    JSON.stringify(avail.data.rooms),
  );

  // Create seniors / Full Excel room order
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const room = await post("/api/room", {
    code,
    customer_name: "Smoke Seniors",
    customer_email: "smoke-seniors@example.com",
    items: [{ n: "Polo", p: 120 }],
    rows: [{ n: "Student A", p: "010", l: [{ s: "M", q: 2 }] }],
    ex: { t: [], ct: false, dl: "", pc: 0 },
  });
  ok("seniors/excel room saved", room.status === 200 && room.data.ok, JSON.stringify(room.data));
  const roomId = room.data.room_id;

  // Verify excel path stored
  let excelPath = "";
  if (roomId) {
    const row = await sb.from("orders").select("id,status,items").eq("id", roomId).maybeSingle();
    excelPath = row.data && row.data.items && row.data.items.excel_path;
    ok(
      "excel stored for seniors order",
      row.data && row.data.status === "room" && !!excelPath,
      excelPath || (row.error && row.error.message) || "no path",
    );
  } else {
    ok("excel stored for seniors order", false, "no room id");
  }

  // Quote / seniors order via quote API (catalog-shaped lines)
  const quoteKey = "smoke-" + Date.now();
  const quote = await post("/api/quote", {
    idempotency_key: quoteKey,
    customer_name: "Smoke Quote",
    customer_email: "smoke-quote@example.com",
    customer_phone: "01000000000",
    delivery_address: "Test",
    slug: "seniors-uniform",
    service: "Seniors uniform",
    lines: [
      { name: "Polo", question: "Garment", quantity: 1 },
      { name: "25", question: "How many students?", quantity: 25 },
      { name: "Standard delivery (3 weeks)", question: "Delivery", quantity: 1 },
    ],
  });
  const quoteOk = quote.status === 200 && quote.data.ok && !!quote.data.order_id;
  ok(
    "seniors quote order saved",
    quoteOk,
    "status=" + quote.status + " " + JSON.stringify(quote.data).slice(0, 200),
  );
  quoteId = quote.data.order_id;

  // Admin login — find a staff account token from DB accounts
  const staff = require("../lib/staff");
  const accounts = await sb
    .from("orders")
    .select("id, customer_email, items, status")
    .eq("status", "account")
    .limit(20);
  let token = "";
  let adminEmail = "";
  for (const a of accounts.data || []) {
    if (staff.isStaffEmail(a.customer_email) && a.items && a.items.token) {
      token = a.items.token;
      adminEmail = a.customer_email;
      break;
    }
  }
  if (!token) {
    // try session login if we know password from env
    ok("admin token available", false, "No staff account with token in DB — remaining admin tests skipped");
  } else {
    ok("admin token available", true, adminEmail);

    const orders = await post("/api/admin", { op: "orders", token, status: "orders", page: 1, pageSize: 50 });
    ok("admin orders list", orders.status === 200 && orders.data.ok, "count=" + ((orders.data.rows || []).length));
    const foundRoom = (orders.data.rows || []).some((r) => r.id === roomId);
    ok("seniors/excel order appears in admin", foundRoom, roomId);
    const foundQuote = quoteId && (orders.data.rows || []).some((r) => r.id === quoteId);
    ok("seniors quote appears in admin", !!foundQuote, quoteId || "no quote id");

    if (excelPath) {
      const dl = await post("/api/admin", { op: "excel_download", token, id: roomId });
      ok(
        "admin excel download signed url",
        dl.status === 200 && dl.data.ok && !!dl.data.url,
        dl.data.error || "url len=" + String((dl.data.url || "").length),
      );
    }

    // Create private meeting
    const meet = await post("/api/admin", {
      op: "meet_create",
      token,
      name: "Smoke Private Room",
      duration_min: 45,
    });
    ok("create private meeting", meet.status === 200 && meet.data.ok && meet.data.private === true, JSON.stringify(meet.data));
    const meetId = meet.data.id;
    const meetCode = meet.data.code;

    // Public must not see it
    const avail2 = await post("/api/admin", { op: "available" });
    ok(
      "new room not in public list",
      (avail2.data.rooms || []).length === 0 && !(avail2.data.rooms || []).some((r) => r.code === meetCode),
      "public rooms=" + (avail2.data.rooms || []).length,
    );

    // Guessing room code via redeem without invite
    const guess = await post("/api/admin", {
      op: "redeem",
      email: "wrong@example.com",
      access_code: "deadbeef01",
    });
    ok("guessed code rejected", guess.status >= 400, "status=" + guess.status);

    // Send invite to one email (uses EmailJS — may fail if template/quota)
    const inviteEmail = "smoke-invite-" + Date.now() + "@example.com";
    const invite = await post("/api/admin", {
      op: "meet_invite_send",
      token,
      id: meetId,
      email: inviteEmail,
      expires_hours: 2,
    });
    const inviteSent = invite.status === 200 && invite.data.ok && invite.data.sent;
    ok(
      "send invite email (EmailJS)",
      inviteSent,
      inviteSent ? inviteEmail + " expires=" + invite.data.expires_at : invite.data.error || "status=" + invite.status,
    );
    // When EmailJS blocks server sends, API must not claim success and must not leave a dangling invite.
    if (!inviteSent) {
      const leftover = await sb
        .from("orders")
        .select("id")
        .eq("status", "meet_invite")
        .eq("customer_email", inviteEmail)
        .maybeSingle();
      ok(
        "email failure does not fake success",
        invite.status >= 400 && !invite.data.ok && !leftover.data,
        "status=" + invite.status + " leftover=" + !!(leftover.data),
      );
    } else {
      ok("email failure does not fake success", true, "email delivered");
    }

    // Direct invite for redeem tests (bypass email so we know the code)
    const access = crypto.randomBytes(5).toString("hex");
    const codeHash = crypto.createHash("sha256").update(access.toLowerCase()).digest("hex");
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const recipient = "redeem-ok@example.com";
    let inviteSource = "table";
    let inviteId = "";
    const ins = await sb
      .from("meeting_invites")
      .insert({
        meeting_id: meetId,
        email: recipient,
        code_hash: codeHash,
        expires_at: expires,
        created_by: adminEmail,
      })
      .select("id")
      .single();
    if (ins.error && /meeting_invites|does not exist|schema cache/i.test(ins.error.message || "")) {
      inviteSource = "orders";
      const fb = await sb
        .from("orders")
        .insert({
          customer_name: "Invite " + recipient,
          customer_email: recipient,
          customer_phone: "",
          delivery_address: "",
          items: {
            type: "meet_invite",
            meeting_id: meetId,
            email: recipient,
            code_hash: codeHash,
            expires_at: expires,
            redeemed_at: null,
            created_by: adminEmail,
          },
          total: 0,
          status: "meet_invite",
        })
        .select("id")
        .single();
      inviteId = fb.data && fb.data.id;
      ok("direct invite stored (fallback)", !!inviteId, fb.error && fb.error.message);
    } else {
      inviteId = ins.data && ins.data.id;
      ok("direct invite stored (table)", !!inviteId, ins.error && ins.error.message);
    }

    // Activate meeting like invite send does
    const mrow = await sb.from("orders").select("items").eq("id", meetId).maybeSingle();
    if (mrow.data) {
      await sb
        .from("orders")
        .update({ items: Object.assign({}, mrow.data.items || {}, { active: true, private: true }) })
        .eq("id", meetId);
    }

    const wrongEmail = await post("/api/admin", {
      op: "redeem",
      email: "other@example.com",
      access_code: access,
    });
    ok("wrong email cannot redeem", wrongEmail.status === 403, wrongEmail.data.error);

    const good = await post("/api/admin", {
      op: "redeem",
      email: recipient,
      access_code: access,
    });
    ok(
      "intended recipient redeems",
      good.status === 200 && good.data.ok && !!good.data.room,
      good.data.error || good.data.room,
    );

    const reuse = await post("/api/admin", {
      op: "redeem",
      email: recipient,
      access_code: access,
    });
    ok("used code rejected", reuse.status === 403, reuse.data.error);

    // Expired code
    const expCode = crypto.randomBytes(5).toString("hex");
    const expHash = crypto.createHash("sha256").update(expCode.toLowerCase()).digest("hex");
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    if (inviteSource === "table") {
      await sb.from("meeting_invites").insert({
        meeting_id: meetId,
        email: recipient,
        code_hash: expHash,
        expires_at: past,
        created_by: adminEmail,
      });
    } else {
      await sb.from("orders").insert({
        customer_name: "Expired invite",
        customer_email: recipient,
        customer_phone: "",
        delivery_address: "",
        items: {
          type: "meet_invite",
          meeting_id: meetId,
          email: recipient,
          code_hash: expHash,
          expires_at: past,
          redeemed_at: null,
        },
        total: 0,
        status: "meet_invite",
      });
    }
    const expired = await post("/api/admin", { op: "redeem", email: recipient, access_code: expCode });
    ok("expired code rejected", expired.status === 403, expired.data.error);

    // Cleanup smoke meeting
    if (meetId) await sb.from("orders").delete().eq("id", meetId);
    if (inviteSource === "orders") {
      await sb.from("orders").delete().eq("status", "meet_invite").eq("items->>meeting_id", meetId);
    }
  }

  // Cleanup smoke orders
  if (roomId) await sb.from("orders").delete().eq("id", roomId);
  if (quoteId) await sb.from("orders").delete().eq("id", quoteId);

  const failed = results.filter((r) => !r.pass);
  console.log("\n" + results.filter((r) => r.pass).length + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
