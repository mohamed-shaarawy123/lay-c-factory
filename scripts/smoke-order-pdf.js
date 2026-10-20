/* Verify order PDF generation (pdf-lib) produces a real %PDF buffer. */
const fs = require("fs");
const path = require("path");
const { renderOrderPdf } = require("../lib/order-pdf");

const row = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  customer_name: "PDF Smoke",
  customer_email: "pdf-smoke@example.com",
  customer_phone: "01000000000",
  delivery_address: "Cairo",
  total: 2050,
  status: "room",
  created_at: new Date().toISOString(),
  items: {
    order_type: "seniors_excel",
    source: "seniors",
    code: "123456",
    items: [
      { n: "Polo", p: 600 },
      { n: "Hoodie", p: 850 },
    ],
    rows: [
      { n: "Ali", p: "010", l: [{ s: "M", q: 1 }, { s: "L", q: 1 }] },
      { n: "Sara", p: "011", l: [{ s: "S", q: 2 }, { s: "M", q: 1 }] },
    ],
    ex: { t: [{ n: "Name printed", p: 50 }], ct: false, dl: "Standard", pc: 0 },
    excel_path: "rooms/123456/test.csv",
    has_excel: true,
  },
};

(async () => {
  const pdf = await renderOrderPdf(row);
  const out = path.join(__dirname, "..", "tmp-order-smoke.pdf");
  fs.writeFileSync(out, pdf);
  const head = pdf.slice(0, 5).toString("utf8");
  if (head !== "%PDF-") {
    console.error("FAIL not a PDF:", head);
    process.exit(1);
  }
  if (pdf.length < 500) {
    console.error("FAIL too small:", pdf.length);
    process.exit(1);
  }
  console.log("PASS local pdf-lib", "bytes=" + pdf.length, "file=" + out);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
