import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const PORT = Number(process.env.PORT || 5180);
const MAX_BACKUPS = Number(process.env.MAX_BACKUPS || 60);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  const raw = fs.readFileSync(STATE_FILE, "utf8");
  return JSON.parse(raw);
}

function writeState(state) {
  ensureDirs();

  // Rotate a timestamped backup of the previous state before overwriting.
  if (fs.existsSync(STATE_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(STATE_FILE, path.join(BACKUP_DIR, `state-${stamp}.json`));
  }

  // Atomic write: temp file then rename, so a crash never corrupts the state.
  const tmp = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, STATE_FILE);

  pruneBackups();
}

function pruneBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith("state-") && name.endsWith(".json"))
    .sort();
  while (files.length > MAX_BACKUPS) {
    fs.rmSync(path.join(BACKUP_DIR, files.shift()));
  }
}

// The frontend may be mirrored to another domain (e.g. a static git-pull
// deploy) while this backend stays the single source of truth, so cross-origin
// calls from that known domain need to be allowed explicitly.
const ALLOWED_ORIGINS = new Set(["https://game-of-more.lecagibi.ch"]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req, limit = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.normalize(path.join(PUBLIC_DIR, filePath));

  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    // SPA fallback: unknown routes serve the app shell.
    const index = path.join(PUBLIC_DIR, "index.html");
    if (fs.existsSync(index)) {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(fs.readFileSync(index));
      return;
    }
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(resolved).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
  });
  res.end(fs.readFileSync(resolved));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const { pathname } = url;

  applyCors(req, res);

  if (pathname === "/api/state" && req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/state") {
    try {
      if (req.method === "GET") {
        const state = readState();
        sendJson(res, state ? 200 : 404, state || { error: "no state yet" });
        return;
      }

      if (req.method === "PUT") {
        const body = await readBody(req);
        let state;
        try {
          state = JSON.parse(body);
        } catch {
          sendJson(res, 400, { error: "invalid JSON" });
          return;
        }
        if (!state || !Array.isArray(state.classes)) {
          sendJson(res, 400, { error: "not a Game of More state" });
          return;
        }
        state.updatedAt = new Date().toISOString();
        writeState(state);
        sendJson(res, 200, { ok: true, updatedAt: state.updatedAt });
        return;
      }

      res.writeHead(405, { Allow: "GET, PUT" });
      res.end("Method not allowed");
      return;
    } catch (error) {
      sendJson(res, 500, { error: error.message });
      return;
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }

  serveStatic(req, res, pathname);
});

ensureDirs();
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Game of More backend on http://127.0.0.1:${PORT}`);
  console.log(`state file: ${STATE_FILE}`);
});
