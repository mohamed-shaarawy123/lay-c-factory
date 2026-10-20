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
      page.drawText(chunk, {
        x: MARGIN + indent,
        y: y - size,
        size,
        font,
        color,
        maxWidth: width,
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

  return { write, gap, section, ensure };
}

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

  w.write(d.brand, { size: 20, bold: true, color: NAVY });
  w.write(d.title, { size: 11, color: BLUE });
  w.gap(6);
  w.write("Order number: " + safe(d.order_number), { size: 10 });
  w.write("Source: " + safe(d.source), { size: 10 });
  w.write("Status: " + safe(d.status), { size: 10 });
  w.write(
    "Order date: " + (d.created_at ? new Date(d.created_at).toLocaleString("en-GB") : "Not provided"),
    { size: 10 },
  );
  if (d.sheet_code) w.write("Sheet password: " + d.sheet_code, { size: 10 });

  w.section("Customer");
  w.write("Name: " + safe(d.customer.name));
  w.write("Email: " + safe(d.customer.email));
  w.write("Phone: " + safe(d.customer.phone));
  w.write("Address: " + safe(d.customer.address));

  w.section("Order lines");
  if (!d.lines.length) {
    w.write("No line items stored for this order.");
  } else {
    d.lines.forEach((line, i) => {
      w.write(i + 1 + ". " + safe(line.name), { bold: true });
      if (line.question) w.write(line.question, { indent: 12 });
      w.write(
        "Qty: " +
          safe(line.quantity) +
          "   Unit: " +
          (line.unit_price == null ? "Not provided" : formatMoney(line.unit_price, d.currency)) +
          "   Subtotal: " +
          (line.subtotal == null ? "Not provided" : formatMoney(line.subtotal, d.currency)),
        { indent: 12 },
      );
      if (line.detail) w.write(String(line.detail), { indent: 12, color: GRAY });
      w.gap(4);
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

  w.section("Total");
  w.write(d.grand_total_label, { size: 14, bold: true, color: NAVY });
  w.gap(6);
  if (d.has_excel && d.excel_path) w.write("Attached Excel reference: " + d.excel_path, { size: 9, color: GRAY });
  else w.write("Attached Excel reference: Not provided", { size: 9, color: GRAY });
  w.write("Generated for admin use — LAY C Factory", { size: 9, color: GRAY });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

module.exports = { renderOrderPdf };
