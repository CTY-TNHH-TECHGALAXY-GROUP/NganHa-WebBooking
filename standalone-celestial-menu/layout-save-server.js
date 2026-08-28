const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.CELESTIAL_LAYOUT_SAVE_PORT || 8772);
const OUT_FILE = path.join(__dirname, "layout-overrides.saved.json");

function send(res, status, body) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, {});
    return;
  }

  if (req.method !== "POST" || req.url !== "/save-layout") {
    send(res, 404, { ok: false, error: "Not found" });
    return;
  }

  let raw = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 1_000_000) req.destroy();
  });
  req.on("end", () => {
    try {
      const data = JSON.parse(raw || "{}");
      fs.writeFileSync(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`);
      send(res, 200, { ok: true, file: OUT_FILE });
    } catch (error) {
      send(res, 400, { ok: false, error: error.message });
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Celestial layout save server listening at http://127.0.0.1:${PORT}`);
  console.log(`Writing layout saves to ${OUT_FILE}`);
});
