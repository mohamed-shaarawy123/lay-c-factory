/** Probe whether anon JWT can read photo rows (RLS should block). */
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

(async () => {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const anon = String(process.env.SUPABASE_ANON_KEY || "").replace(/\s+/g, "");
  console.log("HAS_DB_URL", Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL));
  console.log("HAS_ANON", Boolean(anon));
  if (!anon) {
    console.log("ANON_PHOTO_READ skip");
    process.exit(0);
  }
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const r = await sb.from("orders").select("id, items").eq("status", "photo").limit(3);
  if (r.error) {
    console.log("ANON_PHOTO_READ blocked:", r.error.message);
  } else {
    console.log("ANON_PHOTO_READ rows:", (r.data || []).length);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
