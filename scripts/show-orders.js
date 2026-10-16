const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envFile = path.join(__dirname, "..", ".env");
fs.readFileSync(envFile, "utf8")
  .split(/\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

(async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("id,customer_name,customer_email,customer_phone,delivery_address,items,total,status,created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) {
    console.error("ERROR", error.message);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
})();
