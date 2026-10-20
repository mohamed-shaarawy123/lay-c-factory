const PDFDocument = require("pdfkit");
const { buildOrderDocument, SIZES, formatMoney } = require("./order-document");

function drawSection(doc, title) {
  doc.moveDown(0.6);
  doc.fillColor("#0f2a8a").fontSize(12).font("Helvetica-Bold").text(title);
  doc.moveDown(0.2);
  doc
    .strokeColor("#c5d0f0")
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.35);
  doc.fillColor("#111").font("Helvetica").fontSize(10);
}

function safe(v) {
  return v == null || v === "" ? "Not provided" : String(v);
}

function renderOrderPdf(row) {
  const d = buildOrderDocument(row);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4", info: { Title: "LAY C Factory — " + d.order_short, Author: "LAY C Factory" } });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#0f2a8a").fontSize(20).font("Helvetica-Bold").text(d.brand);
    doc.fillColor("#4169e1").fontSize(11).font("Helvetica").text(d.title);
    doc.moveDown(0.4);
    doc.fillColor("#111").fontSize(10);
    doc.text("Order number: " + safe(d.order_number));
    doc.text("Source: " + safe(d.source));
    doc.text("Status: " + safe(d.status));
    doc.text("Order date: " + (d.created_at ? new Date(d.created_at).toLocaleString("en-GB") : "Not provided"));
    if (d.sheet_code) doc.text("Sheet password: " + d.sheet_code);

    drawSection(doc, "Customer");
    doc.text("Name: " + safe(d.customer.name));
    doc.text("Email: " + safe(d.customer.email));
    doc.text("Phone: " + safe(d.customer.phone));
    doc.text("Address: " + safe(d.customer.address));

    drawSection(doc, "Order lines");
    if (!d.lines.length) {
      doc.text("No line items stored for this order.");
    } else {
      d.lines.forEach((line, i) => {
        doc.font("Helvetica-Bold").text(i + 1 + ". " + safe(line.name));
        doc.font("Helvetica");
        if (line.question) doc.text("   " + line.question);
        doc.text(
          "   Qty: " +
            safe(line.quantity) +
            "   Unit: " +
            (line.unit_price == null ? "Not provided" : formatMoney(line.unit_price, d.currency)) +
            "   Subtotal: " +
            (line.subtotal == null ? "Not provided" : formatMoney(line.subtotal, d.currency)),
        );
        if (line.detail) doc.fillColor("#555").text("   " + line.detail).fillColor("#111");
        doc.moveDown(0.25);
      });
    }

    if (d.is_room && d.size_breakdown.length) {
      drawSection(doc, "Size breakdown");
      d.size_breakdown.forEach((b) => {
        const sizes = SIZES.map((z) => z + " " + (b.sizes[z] || 0)).join("  ");
        doc.font("Helvetica-Bold").text(b.name + " — " + b.pieces + " pcs · " + formatMoney(b.subtotal, d.currency));
        doc.font("Helvetica").text(sizes);
        doc.moveDown(0.2);
      });
    }

    if (d.is_room && d.students.length) {
      drawSection(doc, "Student / class sheet (" + d.students.length + ")");
      d.students.forEach((s) => {
        if (doc.y > 720) doc.addPage();
        doc.font("Helvetica-Bold").text(s.index + ". " + safe(s.name) + " · " + safe(s.phone));
        doc.font("Helvetica");
        (s.products || []).forEach((p) => {
          doc.text(
            "   " +
              safe(p.name) +
              " · size " +
              safe(p.size) +
              " · qty " +
              safe(p.quantity) +
              " · " +
              formatMoney(p.subtotal, d.currency),
          );
        });
        doc.text("   Line total: " + formatMoney(s.line_total, d.currency));
        doc.moveDown(0.2);
      });
    }

    if (d.extras && d.extras.length) {
      drawSection(doc, "Personalization & extras");
      d.extras.forEach((x) => {
        doc.text(
          safe(x.name) +
            (x.note ? " (" + x.note + ")" : "") +
            " — " +
            (x.subtotal == null ? "Not provided" : formatMoney(x.subtotal, d.currency)),
        );
      });
    }

    if (d.delivery) {
      drawSection(doc, "Delivery");
      doc.text(
        safe(d.delivery.label) +
          (d.delivery.percent ? " (" + d.delivery.percent + "%)" : "") +
          " — " +
          formatMoney(d.delivery.amount, d.currency),
      );
    }

    if (d.notes) {
      drawSection(doc, "Notes");
      doc.text(String(d.notes).slice(0, 2000));
    }

    drawSection(doc, "Total");
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#0f2a8a").text(d.grand_total_label);
    doc.moveDown(0.4);
    doc.fontSize(9).font("Helvetica").fillColor("#666");
    if (d.has_excel && d.excel_path) doc.text("Attached Excel reference: " + d.excel_path);
    else doc.text("Attached Excel reference: Not provided");
    doc.text("Generated for admin use — LAY C Factory");

    doc.end();
  });
}

module.exports = { renderOrderPdf };
