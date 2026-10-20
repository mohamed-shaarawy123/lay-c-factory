const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const file = path.join(__dirname, "..", ".env");
fs.readFileSync(file, "utf8")
  .split(/\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) return;
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });

const sb = createClient(
  String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
  String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

(async () => {
  await sb.storage.createBucket("order-files", { public: false }).catch(() => {});
  const p = await sb.from("meeting_invites").select("id").limit(1);
  if (p.error) {
    console.log("NEED_SQL:" + p.error.message);
    process.exit(2);
  }
  console.log("TABLE_OK");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
