function entry(price, extra) {
  if (Array.isArray(price)) return { min: price[0], max: price[1], ...extra };
  if (typeof price === "string") return { custom: true, min: 0, max: 0, ...extra };
  return { min: price, max: price, ...extra };
}

const CATALOG = {
  designing: {
    mb: true,
    items: {
      "Logo and identity": entry(8000),
      "Apparel graphics": entry(2000),
      Packaging: entry(1000),
      "Full brand kit": entry("?*"),
      "PDF file": entry(0),
      "PNG of the design": entry(0),
      "Editable source files": entry(0),
      "Brand guidelines PDF": entry(0),
      "Product mockups": entry(0),
      "Standard (7 days)": entry(0),
      "Rush (3 days)": entry(1000),
    },
    qty: { 1: 1, 2: 2, 3: 3, 5: 5, 10: 10 },
  },
  manufacturing: {
    items: {
      "Bulk boxes": entry(135, { oneTime: true }),
    },
    qty: { 50: 50, 100: 100, 250: 250, 500: 500, 1000: 1000 },
  },
  seniors: {
    perUnit: true,
    disc: (n) => (n > 100 ? 0.1 : n >= 50 ? 0.05 : 0),
    items: {
      "T-shirt": entry(600),
      Polo: entry(600),
      Jersey: entry([800, 1500]),
      Hoodie: entry(850),
      Sweatshirt: entry(800),
      Sweatpants: entry(800),
      "Cargo pants": entry(900),
      "Knitted polo": entry(1100),
      Beanie: entry(400),
      Jacket: entry([900, 2500]),
      "Name printed": entry(50),
      "Name embroidered": entry(220),
      "Metal piece": entry(120),
      "Standard delivery (3 weeks)": entry(0),
      "Rush delivery": entry(5, { pct: true }),
    },
    qty: { 25: 25, 50: 50, 75: 75, 100: 100, 150: 150, 200: 200 },
  },
  "seniors-uniform": null,
  web: {
    items: {
      "Landing page": entry(8000),
      "Business website": entry(20000),
      "Online store": entry([60000, 100000]),
      "Web app": entry([80000, 200000]),
      Shopify: entry(2500),
      "Custom back end": entry([30000, 90000]),
      "Up to 5 pages": entry(0),
      "6 to 15 pages": entry([15000, 30000]),
      "16 pages or more": entry([35000, 70000]),
      "Polished template": entry(0),
      "Fully custom design": entry([10000, 40000]),
      "Booking system": entry([8000, 20000]),
      Blog: entry([3000, 8000]),
      "Online payments": entry([6000, 18000]),
      "SEO setup": entry([5000, 15000]),
      "Admin dashboard": entry([12000, 35000]),
      "Standard (4 to 6 weeks)": entry(0),
      "Rush (2 weeks)": entry(25, { pct: true }),
    },
  },
  "photo-shoot": { items: {} },
  "photo-studio": {
    hours: { min: 2, max: 20, rate: 350 },
    items: {
      "Area 1": entry(0),
      "Area 2": entry(0),
    },
  },
};

CATALOG["seniors-uniform"] = CATALOG.seniors;

function lookup(slug, name) {
  const cat = CATALOG[slug];
  if (!cat) return null;
  if (cat.items && cat.items[name]) return cat.items[name];
  if (cat.qty && cat.qty[name] != null) return { qty: cat.qty[name], min: 0, max: 0 };
  return null;
}

function priceOrder(payload) {
  const slug = String(payload.slug || "");
  const cat = CATALOG[slug];
  if (!cat) {
    const err = new Error("Unknown service.");
    err.status = 400;
    throw err;
  }
  const linesIn = Array.isArray(payload.lines) ? payload.lines : [];
  if (!linesIn.length) {
    const err = new Error("The order has no products.");
    err.status = 400;
    throw err;
  }
  let sum = 0;
  let mul = 1;
  let base = 0;
  let fl = 0;
  let pct = 0;
  let hours = Math.max(cat.hours ? cat.hours.min : 0, Math.min(cat.hours ? cat.hours.max : 0, +payload.hours || 0));
  const priced = [];
  linesIn.forEach((raw, i) => {
    const name = String((raw && raw.name) || "").trim();
    const question = String((raw && raw.question) || "").trim();
    const qtyIn = Math.max(0, Number(raw && raw.quantity));
    if (!name) {
      const err = new Error("Line " + (i + 1) + " is missing a product name.");
      err.status = 400;
      throw err;
    }
    if (name === "Other" || raw.custom) {
      const qty = qtyIn || 1;
      if (qtyIn > 0 && /how many/i.test(question)) mul = qtyIn;
      priced.push({
        name,
        question,
        quantity: qty,
        unit_price: 0,
        line_total: 0,
        custom: true,
        detail: String((raw && raw.detail) || "").slice(0, 500),
      });
      return;
    }
    const found = lookup(slug, name);
    if (!found && !(cat.hours && /hours/i.test(question))) {
      const err = new Error("Unknown product: " + name);
      err.status = 400;
      throw err;
    }
    if (found && found.qty != null) {
      mul = found.qty;
      priced.push({
        name,
        question,
        quantity: found.qty,
        unit_price: 0,
        line_total: 0,
        kind: "quantity",
      });
      return;
    }
    if (found && found.pct) {
      pct += found.min;
      priced.push({
        name,
        question,
        quantity: 1,
        unit_price: found.min,
        line_total: 0,
        kind: "percent",
      });
      return;
    }
    if (cat.hours && (raw.hours || /hours/i.test(question))) {
      const h = Math.max(cat.hours.min, Math.min(cat.hours.max, +raw.hours || hours || cat.hours.min));
      hours = h;
      const line = h * cat.hours.rate;
      sum += line;
      priced.push({
        name: h + (h > 1 ? " hours" : " hour"),
        question,
        quantity: h,
        unit_price: cat.hours.rate,
        line_total: line,
      });
      return;
    }
    const unit = found ? found.min : 0;
    const qty = Math.max(1, qtyIn || 1);
    if (found && found.oneTime) {
      fl += unit * qty;
      priced.push({ name, question, quantity: qty, unit_price: unit, line_total: unit * qty });
      return;
    }
    if (found && found.custom) {
      priced.push({ name, question, quantity: qty, unit_price: 0, line_total: 0, custom: true });
      return;
    }
    sum += unit;
    if (!base) base = unit;
    priced.push({ name, question, quantity: 1, unit_price: unit, line_total: unit });
  });
  if (cat.hours && hours) {
    const already = priced.some((l) => l.unit_price === cat.hours.rate);
    if (!already) {
      const line = hours * cat.hours.rate;
      sum += line;
      priced.unshift({
        name: hours + " hours",
        question: "Studio hours",
        quantity: hours,
        unit_price: cat.hours.rate,
        line_total: line,
      });
    }
  }
  const t0 = (cat.mb ? base * mul + (sum - base) : cat.perUnit ? sum * mul : sum * mul) + fl;
  const d = cat.disc ? cat.disc(mul) : 0;
  let total = t0 * (1 - d);
  if (pct) total += (total * pct) / 100;
  total = Math.round(total * 100) / 100;
  return {
    service: payload.service || slug,
    slug,
    lines: priced,
    quantity: mul,
    total,
  };
}

module.exports = { CATALOG, priceOrder };
