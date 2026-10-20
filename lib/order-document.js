const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

function itemsOf(row) {
  return row && row.items && typeof row.items === "object" ? row.items : {};
}

function money(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n;
}

function formatMoney(v, currency) {
  const n = money(v);
  if (n == null) return "Not provided";
  const cur = currency || "EGP";
  return (
    new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(n) +
    " " +
    cur
  );
}

function orderTypeOf(row) {
  const items = itemsOf(row);
  if (row.status === "room" || items.order_type === "seniors_excel") return "Full Excel / Seniors sheet";
  if (items.order_type === "seniors" || items.slug === "seniors-uniform") return "Seniors";
  if (items.service || items.slug) return items.service || items.slug;
  if (row.status === "meeting") return "Meeting room";
  return row.status || "Order";
}

function sizeSummary(sheetItems, sheetRows) {
  const it = Array.isArray(sheetItems) ? sheetItems : [];
  const rows = Array.isArray(sheetRows) ? sheetRows : [];
  return it.map((item, k) => {
    const counts = {};
    SIZES.forEach((z) => {
      counts[z] = 0;
    });
    let pieces = 0;
    rows.forEach((row) => {
      const cell = (row && row.l && row.l[k]) || {};
      const q = Math.max(0, Number(cell.q) || 0);
      const s = String(cell.s || "M").toUpperCase();
      if (counts[s] == null) counts[s] = 0;
      counts[s] += q;
      pieces += q;
    });
    const unit = Number(item.p) || 0;
    return {
      name: item.n || "Item",
      unit_price: unit,
      pieces,
      subtotal: pieces * unit,
      sizes: counts,
    };
  });
}

function buildOrderDocument(row) {
  const items = itemsOf(row);
  const currency = items.currency || "EGP";
  const isRoom = row.status === "room" || items.order_type === "seniors_excel";
  const lines = [];
  let computedTotal = null;
  let students = [];
  let size_breakdown = [];
  let extras = [];
  let delivery = null;

  if (isRoom) {
    const sheetItems = Array.isArray(items.items) ? items.items : [];
    const sheetRows = Array.isArray(items.rows) ? items.rows : [];
    size_breakdown = sizeSummary(sheetItems, sheetRows);
    students = sheetRows.map((r, idx) => {
      const cells = Array.isArray(r.l) ? r.l : [];
      let lineTotal = 0;
      const products = sheetItems.map((it, i) => {
        const cell = cells[i] || {};
        const q = Math.max(0, Number(cell.q) || 0);
        const unit = Number(it.p) || 0;
        const sub = q * unit;
        lineTotal += sub;
        return {
          name: it.n || "Item",
          size: cell.s || "Not provided",
          quantity: q || "Not provided",
          unit_price: unit,
          subtotal: sub,
        };
      });
      return {
        index: idx + 1,
        name: r.n || "Not provided",
        phone: r.p || "Not provided",
        products,
        line_total: lineTotal,
      };
    });
    const goods = size_breakdown.reduce((a, x) => a + (x.subtotal || 0), 0);
    const ex = items.ex || {};
    if (Array.isArray(ex.t)) {
      extras = ex.t.map((t) => ({
        name: t.n || "Personalization",
        unit_price: Number(t.p) || 0,
        note: "Per student personalization",
        subtotal: (Number(t.p) || 0) * students.length,
      }));
    }
    if (ex.ct) extras.push({ name: "Custom personal touch", unit_price: null, note: "Priced later", subtotal: null });
    if (ex.dl || ex.pc) {
      const pct = Number(ex.pc) || 0;
      const fee = pct ? (goods * pct) / 100 : 0;
      delivery = {
        label: ex.dl || "Delivery",
        percent: pct || null,
        amount: fee,
      };
    }
    computedTotal =
      goods +
      extras.reduce((a, x) => a + (Number(x.subtotal) || 0), 0) +
      (delivery ? Number(delivery.amount) || 0 : 0);
    size_breakdown.forEach((b) => {
      lines.push({
        name: b.name,
        quantity: b.pieces,
        unit_price: b.unit_price,
        subtotal: b.subtotal,
        detail: SIZES.map((z) => (b.sizes[z] ? z + ": " + b.sizes[z] : null))
          .filter(Boolean)
          .join(", "),
      });
    });
  } else if (Array.isArray(items.lines) && items.lines.length) {
    items.lines.forEach((l) => {
      lines.push({
        name: l.name || l.item || "Item",
        question: l.question || "",
        quantity: l.quantity != null ? l.quantity : l.qty != null ? l.qty : "Not provided",
        unit_price: l.unit_price != null ? l.unit_price : l.unit != null ? l.unit : null,
        subtotal: l.line_total != null ? l.line_total : l.total != null ? l.total : null,
        detail: l.detail || l.kind || "",
      });
    });
    computedTotal = row.total != null ? Number(row.total) : null;
  }

  const storedTotal = row.total != null && row.total !== "" ? Number(row.total) : null;
  const grand =
    storedTotal != null && Number.isFinite(storedTotal)
      ? storedTotal
      : computedTotal != null && Number.isFinite(computedTotal)
        ? computedTotal
        : null;

  return {
    brand: "LAY C Factory",
    title: "Order report",
    order_number: row.id || "Not provided",
    order_short: row.id ? String(row.id).slice(0, 8) : "Not provided",
    source: orderTypeOf(row),
    status: row.status || "Not provided",
    created_at: row.created_at || null,
    updated_at: items.updated_at || items.excel_updated_at || row.created_at || null,
    customer: {
      name: row.customer_name || "Not provided",
      email: row.customer_email || "Not provided",
      phone: row.customer_phone || "Not provided",
      address: row.delivery_address || "Not provided",
    },
    sheet_code: items.code || "",
    currency,
    lines,
    students,
    size_breakdown,
    extras,
    delivery,
    notes: items.extra || items.admin_note || "",
    excel_path: items.excel_path || "",
    has_excel: Boolean(items.excel_path || items.has_excel),
    grand_total: grand,
    grand_total_label: formatMoney(grand, currency),
    is_room: isRoom,
    service: items.service || items.slug || "",
  };
}

module.exports = { SIZES, buildOrderDocument, orderTypeOf, formatMoney, sizeSummary, itemsOf };
