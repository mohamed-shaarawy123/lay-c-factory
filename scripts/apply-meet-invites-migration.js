const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8")
    .split(/\n/)
    .forEach((line) => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) return;
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    });
}

loadEnv();
const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, "");
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  // Prefer RPC exec if available; otherwise create via REST-friendly steps.
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261020180000_orders_meet_invites.sql"), "utf8");
  const { error } = await sb.rpc("exec_sql", { query: sql }).maybeSingle?.() || (await sb.rpc("exec_sql", { query: sql }));
  if (error) {
    // Fallback: create table through insert probe + storage bucket API
    console.log("RPC unavailable, applying via client APIs…", error.message || error);
    await sb.storage.createBucket("order-files", { public: false }).catch(() => {});
    const probe = await sb.from("meeting_invites").select("id").limit(1);
    if (probe.error && /does not exist|Could not find/i.test(probe.error.message || "")) {
      console.error("Apply this SQL in the Supabase SQL editor:");
      console.error(sql);
      process.exit(2);
    }
    if (probe.error) {
      console.error(probe.error.message);
      process.exit(1);
    }
    console.log("meeting_invites already exists");
    process.exit(0);
  }
  console.log("MIGRATION_OK");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
