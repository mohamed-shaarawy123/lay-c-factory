const http = require("http");
const fs = require("fs");
const path = require("path");
const quote = require("./api/quote");
const account = require("./api/account");
const room = require("./api/room");
const album = require("./api/album");

const root = path.join(__dirname, "public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

function handler(req, res) {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/api/quote") {
    quote(req, res);
    return;
  }
  if (urlPath === "/api/account") {
    account(req, res);
    return;
  }
  if (urlPath === "/api/room") {
    room(req, res);
    return;
  }
  if (urlPath === "/api/album") {
    album(req, res);
    return;
  }
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const file = path.resolve(root, rel);
  if (!file.startsWith(root)) {
    res.statusCode = 403;
    return res.end("forbidden");
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.statusCode = 404;
      return res.end("missing");
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(buf);
  });
}

module.exports = handler;

if (!process.env.VERCEL) {
  const port = process.env.PORT || 8765;
  http.createServer(handler).listen(port, "127.0.0.1", () =>
    console.log("Lithyy Factory http://127.0.0.1:" + port),
  );
}
