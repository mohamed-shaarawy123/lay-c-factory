const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { priceOrder } = require("../lib/catalog");
const { readPayload } = require("../lib/body");

const TO = "eyadellithy80@gmail.com";
const recentKeys = new Map();

function loadEnv() {
  try {
    const file = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(file)) return;
    fs.readFileSync(file, "utf8")
      .split(/\n/)
      .forEach((line) => {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m || process.env[m[1]]) return;
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      });
  } catch (e) {}
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function text(v, max) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error("Supabase is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mapsLink(addr) {
  return addr ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr) : "";
}

function customerBlock(payload) {
  const addr = text(payload.delivery_address, 500);
  const client = text(payload.customer_email, 160);
  const name = text(payload.customer_name, 120);
  const phone = text(payload.customer_phone, 40);
  const who = [name, phone].filter(Boolean).join(" · ");
  const lines = [];
  if (who) lines.push("Customer: " + who);
  if (client) lines.push("Email: " + client);
  if (addr) lines.push("Delivery address: " + addr);
  const map = mapsLink(addr);
  if (map) lines.push("Map: " + map);
  return lines.join("\n");
}

function notifyParams(priced, payload, to) {
  const email = payload.email_fields || {};
  const addr = text(payload.delivery_address, 500);
  const client = text(payload.customer_email, 160);
  const name = text(payload.customer_name, 120);
  const phone = text(payload.customer_phone, 40);
  const map = mapsLink(addr);
  let summary =
    email.order_summary ||
    priced.service +
      "\n" +
      priced.lines.map((l) => "- " + l.name + " x" + l.quantity + ": " + l.line_total).join("\n") +
      "\nTotal: " +
      priced.total +
      " L.E";
  if (!/Delivery address:|Client email:|^Email:/m.test(summary)) {
    const block = customerBlock(payload);
    if (block) summary = summary.replace(/\s+$/, "") + "\n" + block;
  }
  return {
    to_email: to,
    service: priced.service,
    order_summary: summary,
    products: email.products || priced.lines.map((l) => "- " + l.name + ": " + l.line_total).join("\n"),
    quantities: email.quantities || priced.lines.map((l) => "- " + l.name + ": x" + l.quantity).join("\n"),
    total_price: email.total_price || "Total: " + priced.total + " L.E",
    customer_details: [name, phone, client].filter(Boolean).join(" · "),
    client_email: client,
    delivery_address: addr,
    maps_link: map,
  };
}

async function sendOneEmail(serviceId, templateId, publicKey, params) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: params,
    }),
  });
  if (!res.ok) {
    const err = new Error((await res.text()) || "Email notification failed.");
    err.status = 502;
    throw err;
  }
}

async function sendEmailNotification(priced, payload) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) {
    const err = new Error("Email notification is not configured on the server.");
    err.status = 502;
    throw err;
  }
  const client = text(payload.customer_email, 160);
  await sendOneEmail(serviceId, templateId, publicKey, notifyParams(priced, payload, TO));
  if (client && client.toLowerCase() !== TO.toLowerCase()) {
    try {
      await sendOneEmail(serviceId, templateId, publicKey, notifyParams(priced, payload, client));
    } catch (e) {}
  }
}

async function findExisting(supabase, key) {
  if (!key) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("id,status,total")
    .eq("items->>idempotency_key", key)
    .maybeSingle();
  if (!error && data) return data;
  return null;
}

module.exports = async function handler(req, res) {
  try {
  loadEnv();
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Use POST." });
  const payload = await readPayload(req);
  if (!payload) return json(res, 400, { ok: false, error: "The order is missing." });

  const key = text(payload.idempotency_key, 80);
  if (key && recentKeys.has(key)) {
    const prev = recentKeys.get(key);
    return json(res, 200, prev);
  }

  let priced;
  try {
    priced = priceOrder(payload);
  } catch (err) {
    return json(res, err.status || 400, { ok: false, error: err.message });
  }

  const customer_name = text(payload.customer_name, 120);
  const customer_email = text(payload.customer_email, 160);
  const customer_phone = text(payload.customer_phone, 40);
  const delivery_address = text(payload.delivery_address, 500);
  const items = {
    idempotency_key: key || null,
    service: priced.service,
    slug: priced.slug,
    lines: priced.lines,
    extra: String(payload.extra || "")
      .trim()
      .slice(0, 2000),
  };
  const row = {
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    items,
    total: priced.total,
    status: "received",
  };

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message });
  }

  if (key) {
    const existing = await findExisting(supabase, key);
    if (existing) {
      const reused = { ok: true, order_id: existing.id, email_sent: existing.status === "notified", duplicate: true };
      recentKeys.set(key, reused);
      return json(res, 200, reused);
    }
  }

  const inserted = await supabase.from("orders").insert(row).select("id").single();
  if (inserted.error || !inserted.data || !inserted.data.id) {
    return json(res, 502, {
      ok: false,
      error: (inserted.error && inserted.error.message) || "The order was not saved.",
    });
  }
  const orderId = inserted.data.id;
  let email_sent = false;
  try {
    await sendEmailNotification(priced, payload);
    email_sent = true;
    await supabase.from("orders").update({ status: "notified" }).eq("id", orderId);
  } catch (err) {
    const body = {
      ok: true,
      order_id: orderId,
      email_sent: false,
      error: "Order saved, but the email notification failed.",
    };
    if (key) recentKeys.set(key, body);
    return json(res, 200, body);
  }
  const ok = { ok: true, order_id: orderId, email_sent, total: priced.total };
  if (key) recentKeys.set(key, ok);
  return json(res, 200, ok);
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || "The order was not saved." });
  }
};
