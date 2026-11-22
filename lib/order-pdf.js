const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { buildOrderDocument, SIZES, formatMoney } = require("./order-document");

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const NAVY = rgb(15 / 255, 42 / 255, 138 / 255);
const BLUE = rgb(65 / 255, 105 / 255, 225 / 255);
const BLACK = rgb(0.07, 0.07, 0.07);
const GRAY = rgb(0.4, 0.4, 0.4);
const LINE = rgb(197 / 255, 208 / 255, 240 / 255);

function safe(v) {
  return v == null || v === "" ? "Not provided" : String(v);
}

function makeWriter(pdfDoc, fonts) {
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const maxWidth = PAGE_W - MARGIN * 2;

  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  function ensure(space) {
    if (y - space < MARGIN) newPage();
  }

  function write(text, opts) {
    opts = opts || {};
    const size = opts.size || 10;
    const font = opts.bold ? fonts.bold : fonts.regular;
    const color = opts.color || BLACK;
    const indent = opts.indent || 0;
    const width = maxWidth - indent;
    const lineHeight = size * 1.35;
    const words = String(text == null ? "" : text).split(/\s+/);
    let line = "";
    const flush = (chunk) => {
      ensure(lineHeight + 2);
      const align = opts.align || "left";
      let x = MARGIN + indent;
      if (align === "center") x = (PAGE_W - font.widthOfTextAtSize(chunk, size)) / 2;
      else if (align === "right") x = PAGE_W - MARGIN - font.widthOfTextAtSize(chunk, size);
      page.drawText(chunk, {
        x,
        y: y - size,
        size,
        font,
        color,
      });
      y -= lineHeight;
    };
    if (!words.length || (words.length === 1 && words[0] === "")) {
      flush("");
      return;
    }
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        flush(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) flush(line);
  }

  function gap(n) {
    y -= n || 8;
  }

  function pair(left, right) {
    const size = 10;
    const lineHeight = size * 1.45;
    ensure(lineHeight + 2);
    page.drawText(String(left), {
      x: MARGIN,
      y: y - size,
      size,
      font: fonts.bold,
      color: BLACK,
    });
    const value = String(right);
    page.drawText(value, {
      x: PAGE_W - MARGIN - fonts.regular.widthOfTextAtSize(value, size),
      y: y - size,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    y -= lineHeight;
  }

  function rule() {
    ensure(10);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.6,
      color: LINE,
    });
    gap(10);
  }

  function logo() {
    ensure(48);
    const cx = PAGE_W / 2;
    const top = y - 28;
    const s = 12;
    page.drawRectangle({ x: cx - 15, y: top, width: s, height: s, color: BLUE });
    page.drawRectangle({ x: cx + 1, y: top, width: s, height: s, color: BLUE });
    page.drawRectangle({ x: cx - 15, y: top - 16, width: s, height: s, color: BLUE });
    page.drawRectangle({ x: cx + 1, y: top - 16, width: s, height: s, color: NAVY });
    y -= 40;
  }

  function section(title) {
    gap(10);
    ensure(28);
    write(title, { size: 12, bold: true, color: NAVY });
    gap(2);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 1,
      color: LINE,
    });
    gap(8);
  }

  return { write, gap, section, ensure, rule, logo, pair };
}

const TERMS = [
  "A 50% deposit is due before we start. The balance is due before delivery or handover.",
  "Prices shown as ?* are confirmed after we review your request. This receipt is the request until we confirm the final price.",
  "Work starts after you approve the design, colours and quantities.",
  "You approve designs, mockups and product details before production. Changes after approval can change the price and the date.",
  "Small differences in colour, size or finish can happen between a screen preview and the finished item.",
  "Check the order on delivery and tell us within 48 hours about any defect so we can fix it. Custom-made items are made for you.",
  "The finalized receipt is sent on WhatsApp and by email.",
];

async function renderOrderPdf(row) {
  const d = buildOrderDocument(row);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("LAY C Factory — " + d.order_short);
  pdfDoc.setAuthor("LAY C Factory");
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const w = makeWriter(pdfDoc, fonts);
  const when = d.created_at ? new Date(d.created_at).toLocaleString("en-US") : "Not provided";
  const no = "LC-" + String(d.order_short || "000000").replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  const service = d.service || d.source || "Request";

  w.logo();
  w.write("Lay C wishes you a happy life", { size: 13, bold: true, color: BLUE, align: "center" });
  w.gap(8);
  w.write("SALES RECEIPT", { size: 9, color: GRAY });
  w.gap(6);
  w.pair("Receipt no.", no);
  w.pair("Date", when);
  w.pair("Service", service);
  if (d.customer && d.customer.name && d.customer.name !== "Not provided") w.pair("Customer", safe(d.customer.name));
  w.rule();
  if (!d.lines.length) {
    w.write("No line items stored for this order.");
  } else {
    d.lines.forEach((line) => {
      const price =
        line.subtotal != null
          ? formatMoney(line.subtotal, d.currency)
          : line.unit_price != null
            ? formatMoney(line.unit_price, d.currency)
            : safe(line.quantity);
      const label = safe(line.name) + (line.question ? " (" + line.question + ")" : "");
      w.write("- " + label + ": " + price, { size: 10 });
      if (line.detail) w.write(String(line.detail), { size: 8, color: GRAY, indent: 12 });
    });
  }

  if (d.is_room && d.size_breakdown.length) {
    w.section("Size breakdown");
    d.size_breakdown.forEach((b) => {
      const sizes = SIZES.map((z) => z + " " + (b.sizes[z] || 0)).join("  ");
      w.write(b.name + " — " + b.pieces + " pcs · " + formatMoney(b.subtotal, d.currency), { bold: true });
      w.write(sizes);
      w.gap(3);
    });
  }

  if (d.is_room && d.students.length) {
    w.section("Student / class sheet (" + d.students.length + ")");
    d.students.forEach((s) => {
      w.write(s.index + ". " + safe(s.name) + " · " + safe(s.phone), { bold: true });
      (s.products || []).forEach((p) => {
        w.write(
          safe(p.name) +
            " · size " +
            safe(p.size) +
            " · qty " +
            safe(p.quantity) +
            " · " +
            formatMoney(p.subtotal, d.currency),
          { indent: 12 },
        );
      });
      w.write("Line total: " + formatMoney(s.line_total, d.currency), { indent: 12 });
      w.gap(4);
    });
  }

  if (d.extras && d.extras.length) {
    w.section("Personalization & extras");
    d.extras.forEach((x) => {
      w.write(
        safe(x.name) +
          (x.note ? " (" + x.note + ")" : "") +
          " — " +
          (x.subtotal == null ? "Not provided" : formatMoney(x.subtotal, d.currency)),
      );
    });
  }

  if (d.delivery) {
    w.section("Delivery");
    w.write(
      safe(d.delivery.label) +
        (d.delivery.percent ? " (" + d.delivery.percent + "%)" : "") +
        " — " +
        formatMoney(d.delivery.amount, d.currency),
    );
  }

  if (d.notes) {
    w.section("Notes");
    w.write(String(d.notes).slice(0, 2000));
  }

  w.rule();
  w.write("Total: " + d.grand_total_label, { size: 12, bold: true, align: "right" });
  w.gap(8);
  w.write("ORDER RECEIVED", { size: 12, bold: true, color: NAVY, align: "center" });
  w.write("The finalized receipt will be sent to you on WhatsApp & as an Email.", {
    size: 10,
    bold: true,
    color: BLUE,
    align: "center",
  });
  w.gap(8);
  w.write("TERMS AND CONDITIONS", { size: 8, bold: true, color: GRAY });
  TERMS.forEach((term, i) => w.write(i + 1 + ". " + term, { size: 8, color: GRAY }));

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

module.exports = { renderOrderPdf };
