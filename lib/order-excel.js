const BUCKET = "order-files";

function csvEscape(v) {
  const s = String(v == null ? "" : v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function roomToCsv(items, rows, ex) {
  const it = Array.isArray(items) ? items : [];
  const list = Array.isArray(rows) ? rows : [];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const head = ["Name", "Phone", ...it.map((x) => (x.n || "Item") + " size"), ...it.map((x) => (x.n || "Item") + " qty"), "Line total"];
  const lines = [head.map(csvEscape).join(",")];
  let grand = 0;
  list.forEach((row) => {
    const cells = row && row.l ? row.l : [];
    let total = 0;
    it.forEach((item, i) => {
      const cell = cells[i] || {};
      const q = Math.max(0, Number(cell.q) || 0);
      total += q * (Number(item.p) || 0);
    });
    grand += total;
    lines.push(
      [
        row.n || "",
        row.p || "",
        ...it.map((_, i) => (cells[i] && cells[i].s) || "M"),
        ...it.map((_, i) => (cells[i] && cells[i].q) || 1),
        total,
      ]
        .map(csvEscape)
        .join(","),
    );
  });
  lines.push(["TOTAL", "", ...it.map(() => ""), ...it.map(() => ""), grand].map(csvEscape).join(","));
  if (ex && Array.isArray(ex.t) && ex.t.length) {
    lines.push(["Extras"].map(csvEscape).join(","));
    ex.t.forEach((t) => lines.push([t.n || "", t.p || 0].map(csvEscape).join(",")));
  }
  if (ex && ex.dl) lines.push(["Delivery", ex.dl, ex.pc || 0].map(csvEscape).join(","));
  void sizes;
  return "\uFEFF" + lines.join("\r\n");
}

async function ensureOrderBucket(supabase) {
  const listed = await supabase.storage.getBucket(BUCKET);
  if (!listed.error && listed.data) return;
  const created = await supabase.storage.createBucket(BUCKET, { public: false });
  if (created.error && !/already exists/i.test(created.error.message || "")) throw created.error;
}

async function storeRoomExcel(supabase, roomId, code, items, rows, ex) {
  await ensureOrderBucket(supabase);
  const csv = roomToCsv(items, rows, ex);
  const path = "rooms/" + String(code || roomId) + "/" + String(roomId) + ".csv";
  const buf = Buffer.from(csv, "utf8");
  const up = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: "text/csv; charset=utf-8",
    upsert: true,
  });
  if (up.error) {
    const err = new Error(up.error.message || "The Excel file was not stored.");
    err.status = 502;
    throw err;
  }
  return { path, bytes: buf.length, updated_at: new Date().toISOString() };
}

async function signedExcelUrl(supabase, path, seconds) {
  if (!path) return null;
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, seconds || 60 * 10);
  if (signed.error || !signed.data || !signed.data.signedUrl) return null;
  return signed.data.signedUrl;
}

function quoteToCsv(row) {
  const items = row && row.items && typeof row.items === "object" ? row.items : {};
  const lines = Array.isArray(items.lines) ? items.lines : [];
  const head = ["Product", "Question", "Quantity", "Unit price", "Subtotal"].map(csvEscape).join(",");
  const body = lines
    .map((l) =>
      [
        l.name || l.item || "",
        l.question || "",
        l.quantity != null ? l.quantity : l.qty != null ? l.qty : "",
        l.unit_price != null ? l.unit_price : l.unit != null ? l.unit : "",
        l.line_total != null ? l.line_total : l.total != null ? l.total : "",
      ]
        .map(csvEscape)
        .join(","),
    )
    .join("\r\n");
  const totalLine = ["TOTAL", "", "", "", row.total != null ? row.total : ""].map(csvEscape).join(",");
  return "\uFEFF" + head + "\r\n" + body + (body ? "\r\n" : "") + totalLine + "\r\n";
}

function orderToExcelCsv(row) {
  const items = row && row.items && typeof row.items === "object" ? row.items : {};
  if (row.status === "room" || items.order_type === "seniors_excel") {
    return roomToCsv(items.items || [], items.rows || [], items.ex || null);
  }
  return quoteToCsv(row);
}

module.exports = {
  BUCKET,
  roomToCsv,
  quoteToCsv,
  orderToExcelCsv,
  storeRoomExcel,
  signedExcelUrl,
  ensureOrderBucket,
};
