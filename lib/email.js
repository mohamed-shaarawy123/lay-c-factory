async function sendEmail(templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  // Private key unlocks server-side EmailJS when "non-browser API" is restricted.
  const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || "";
  if (!serviceId || !templateId || !publicKey) {
    const err = new Error("Email is not configured on the server.");
    err.status = 500;
    throw err;
  }
  const to = String((templateParams && templateParams.to_email) || "").trim();
  if (!to) {
    const err = new Error("A recipient email is required.");
    err.status = 400;
    throw err;
  }
  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams,
  };
  if (privateKey) body.accessToken = privateKey;
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text || "The email could not be sent.";
    if (/non-browser/i.test(message)) {
      message =
        "EmailJS blocked the server send. In EmailJS → Account → Security, enable API for non-browser apps, or set EMAILJS_PRIVATE_KEY in .env.";
    }
    const err = new Error(message);
    err.status = 502;
    throw err;
  }
  return true;
}

module.exports = { sendEmail };
