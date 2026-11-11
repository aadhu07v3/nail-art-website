"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 3000;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
};

function send(res, status, body) {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(body);
}

function serveFile(req, res, filePath) {
    fs.stat(filePath, function (error, stats) {
        if (error || !stats.isFile()) return send(res, 404, "Not found");

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || "application/octet-stream";
        const range = req.headers.range;

        if (range && /^bytes=\d*-\d*$/.test(range)) {
            const parts = range.replace("bytes=", "").split("-");
            const start = parts[0] ? parseInt(parts[0], 10) : 0;
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            if (start >= stats.size || end >= stats.size || start > end) {
                res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
                return res.end();
            }
            res.writeHead(206, {
                "Content-Type": type,
                "Content-Length": end - start + 1,
                "Content-Range": `bytes ${start}-${end}/${stats.size}`,
                "Accept-Ranges": "bytes"
            });
            return fs.createReadStream(filePath, { start, end }).pipe(res);
        }

        res.writeHead(200, {
            "Content-Type": type,
            "Content-Length": stats.size,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache"
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

const server = http.createServer(function (req, res) {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch (error) {
        return send(res, 400, "Bad request");
    }

    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = path.resolve(root, "." + pathname);
    const relative = path.relative(root, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return send(res, 403, "Forbidden");
    }

    serveFile(req, res, filePath);
});

server.listen(port, function () {
    console.log(`Nail Art dev server running at http://localhost:${port}/`);
});
