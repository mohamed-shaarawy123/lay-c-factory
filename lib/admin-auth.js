const { isStaffEmail } = require("./staff");

async function accountByToken(supabase, token) {
  const value = String(token || "").trim();
  if (value.length < 16) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, customer_phone, items")
    .eq("status", "account")
    .eq("items->>token", value)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function requireAdmin(supabase, token) {
  const who = await accountByToken(supabase, token);
  if (!who || !isStaffEmail(who.customer_email)) return null;
  return who;
}

async function logAdmin(supabase, who, action, detail) {
  try {
    await supabase.from("orders").insert({
      customer_name: who.customer_name || "Admin",
      customer_email: who.customer_email || "",
      customer_phone: "",
      delivery_address: "",
      items: {
        type: "admin_log",
        action: String(action || "").slice(0, 80),
        detail: detail && typeof detail === "object" ? detail : { note: String(detail || "").slice(0, 400) },
        by: who.customer_email || "",
        ts: Date.now(),
      },
      total: 0,
      status: "admin_log",
    });
  } catch (e) {}
}

function meetLink(code) {
  return "https://meet.ffmuc.net/LAYC-" + String(code || "").replace(/\D/g, "");
}

module.exports = { accountByToken, requireAdmin, logAdmin, meetLink, isStaffEmail };
