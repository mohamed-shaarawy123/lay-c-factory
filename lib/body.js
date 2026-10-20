function parseJson(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object" && !Buffer.isBuffer(raw)) return raw;
  try {
    const parsed = JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
}

async function readPayload(req, opts) {
  const fromBody = parseJson(req.body);
  if (fromBody) return fromBody;
  if (typeof req.json === "function") {
    try {
      const parsed = await req.json();
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) {}
  }
  if (!req.on || req.readableEnded) return null;
  const headers = req.headers || {};
  const len = Number(headers["content-length"] || headers["Content-Length"] || 0);
  const wait =
    (opts && opts.timeoutMs) ||
    (len > 200000 ? 45000 : len > 50000 ? 20000 : 8000);
  return await new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(parseJson(chunks.length ? Buffer.concat(chunks) : ""));
    };
    const timer = setTimeout(finish, wait);
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", finish);
    req.on("error", finish);
  });
}

module.exports = { readPayload };
