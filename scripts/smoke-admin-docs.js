/* Smoke: order documents, PDF, Excel, customer activity */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8")
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

async function post(body) {
  const res = await fetch(BASE + "/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const sb = createClient(
    String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const staff = require("../lib/staff");
  const accounts = await sb.from("orders").select("customer_email, items, status").eq("status", "account").limit(30);
  let token = "";
  for (const a of accounts.data || []) {
    if (staff.isStaffEmail(a.customer_email) && a.items && a.items.token) {
      token = a.items.token;
      break;
    }
  }
  ok("admin token", !!token);

  // Ensure a room order exists
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const roomRes = await fetch(BASE + "/api/room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      customer_name: "Doc Test Class",
      customer_email: "doc-test@example.com",
      items: [
        { n: "Polo", p: 600 },
        { n: "Hoodie", p: 850 },
      ],
      rows: [
        { n: "Ali", p: "010", l: [{ s: "M", q: 1 }, { s: "L", q: 1 }] },
        { n: "Sara", p: "011", l: [{ s: "S", q: 2 }, { s: "M", q: 1 }] },
      ],
      ex: { t: [{ n: "Name printed", p: 50 }], ct: false, dl: "Standard delivery (3 weeks)", pc: 0 },
    }),
  });
  const room = await roomRes.json();
  ok("seed room order", room.ok && !!room.room_id, room.room_id || room.error);
  const id = room.room_id;

  const unauth = await post({ op: "order_document", id });
  ok("document requires admin", unauth.status === 403);

  const doc = await post({ op: "order_document", token, id });
  ok("order document", doc.status === 200 && doc.data.document && doc.data.document.students.length === 2, "students=" + ((doc.data.document && doc.data.document.students) || []).length);
  ok(
    "size breakdown present",
    doc.data.document && doc.data.document.size_breakdown && doc.data.document.size_breakdown.length >= 2,
  );

  const pdf = await post({ op: "order_pdf", token, id });
  const pdfBuf = pdf.data.pdf_base64 ? Buffer.from(pdf.data.pdf_base64, "base64") : null;
  ok(
    "real PDF bytes",
    pdf.status === 200 && pdfBuf && pdfBuf.slice(0, 4).toString() === "%PDF",
    "bytes=" + (pdf.data.bytes || 0) + " head=" + (pdfBuf ? pdfBuf.slice(0, 4).toString() : "none"),
  );

  const xlsx = await post({ op: "order_excel", token, id });
  ok(
    "excel for room order",
    xlsx.status === 200 && (xlsx.data.url || xlsx.data.csv),
    xlsx.data.source + (xlsx.data.url ? " url" : " csv"),
  );

  const act = await post({ op: "customer_activity", token, email: "doc-test@example.com", filter: "all" });
  ok(
    "customer activity has order",
    act.status === 200 && (act.data.activity || []).some((a) => a.id === id),
    "count=" + ((act.data.activity || []).length),
  );

  const unlinked = await post({ op: "photos_unlinked", token, page: 1, pageSize: 10 });
  ok("unlinked photos endpoint", unlinked.status === 200 && Array.isArray(unlinked.data.rows));

  const adminHtml = fs.readFileSync(path.join(__dirname, "..", "public", "admin.html"), "utf8");
  ok("exports nav removed", !/data-sec="exports"/.test(adminHtml));
  ok("photo binder nav removed", !/data-sec="photos"/.test(adminHtml));
  ok("view order actions present", /View Order/.test(adminHtml) && /Download PDF/.test(adminHtml));

  // cleanup
  if (id) await sb.from("orders").delete().eq("id", id);

  const failed = results.filter((r) => !r.pass);
  console.log("\n" + results.filter((r) => r.pass).length + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
