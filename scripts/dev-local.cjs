"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const generateHandler = require(path.join(ROOT, "api", "generate.js"));

function patchRes(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    if (!res.writableEnded) {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      res.end(JSON.stringify(data));
    }
    return res;
  };
}

function mime(ext) {
  const m = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
  };
  return m[ext] || "application/octet-stream";
}

const server = http.createServer(async (req, res) => {
  patchRes(res);
  const u = new URL(req.url || "/", "http://127.0.0.1");
  let pathname = u.pathname;
  if (pathname.endsWith("/") && pathname.length > 1) pathname = pathname.slice(0, -1);

  if (pathname === "/api/generate") {
    let raw = "";
    req.setEncoding("utf8");
    for await (const chunk of req) raw += chunk;
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = raw;
    }
    try {
      await generateHandler(req, res);
    } catch (e) {
      console.error(e);
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: e.message || "Internal error" }));
      }
    }
    return;
  }

  let file = pathname === "/" ? path.join(PUBLIC, "index.html") : path.join(PUBLIC, pathname.slice(1));
  if (!file.startsWith(PUBLIC)) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", mime(path.extname(file)));
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("  圆桌 本地开发 (无需 vercel login)");
  console.log("  页面: http://127.0.0.1:" + PORT + "/");
  console.log("  API:  POST http://127.0.0.1:" + PORT + "/api/generate");
  console.log("");
});
