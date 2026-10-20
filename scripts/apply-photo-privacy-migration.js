/** Apply one-way photo lock fields + enable orders RLS (service-role only access). */
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

const sb = createClient(
  String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
  String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

(async () => {
  const photos = await sb.from("orders").select("id, items, created_at").eq("status", "photo").limit(1000);
  if (photos.error) {
    console.error(photos.error.message);
    process.exit(1);
  }
  let locked = 0;
  let normalizedPrivate = 0;
  for (const row of photos.data || []) {
    const it = row.items && typeof row.items === "object" ? { ...row.items } : {};
    const sharedFlag = it.shared;
    const isPublic = sharedFlag === true || (sharedFlag == null && it.privacy !== "private" && sharedFlag !== false);
    const isPriv = sharedFlag === false || it.privacy === "private";
    if (isPublic && it.rejected !== true) {
      if (it.publish_locked === true && it.privacy === "public") continue;
      const next = Object.assign({}, it, {
        shared: true,
        publish_locked: true,
        privacy: "public",
        published_at: it.published_at || row.created_at || new Date().toISOString(),
      });
      const up = await sb.from("orders").update({ items: next }).eq("id", row.id);
      if (!up.error) locked += 1;
    } else if (isPriv) {
      if (it.shared === false && it.privacy === "private" && it.publish_locked === false) continue;
      const next = Object.assign({}, it, { shared: false, privacy: "private", publish_locked: false });
      const up = await sb.from("orders").update({ items: next }).eq("id", row.id);
      if (!up.error) normalizedPrivate += 1;
    }
  }
  console.log("LOCKED_PUBLIC", locked, "NORMALIZED_PRIVATE", normalizedPrivate);
  console.log("Apply RLS SQL in Supabase SQL editor if not already enabled:");
  console.log("  alter table public.orders enable row level security;");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
