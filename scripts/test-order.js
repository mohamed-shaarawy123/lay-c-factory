const handler = require("../api/quote");

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(s) {
      this.body = s;
    },
  };
}

(async () => {
  const res = mockRes();
  await handler(
    {
      method: "POST",
      body: {
        slug: "designing",
        service: "Designing",
        idempotency_key: "test-" + Date.now(),
        lines: [
          { name: "Logo and identity", question: "What do you need designed?", quantity: 1 },
          { name: "2", question: "How many designs do you need?", quantity: 2 },
          { name: "PDF file", question: "What else should we deliver?", quantity: 1 },
          { name: "Standard (7 days)", question: "How fast do you need it?", quantity: 1 },
        ],
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        delivery_address: "",
        email_fields: {
          order_summary: "Designing quote\nTotal: 16,000 L.E",
          products: "- Logo and identity: 8,000 L.E",
          quantities: "- How many designs do you need: x 2",
          total_price: "Total: 16,000 L.E",
        },
      },
    },
    res,
  );
  console.log(res.statusCode, res.body);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
