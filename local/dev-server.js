// Local dev only: serves public/ and runs api/*.js with a Vercel-like req/res. Uses the in-memory store.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname.startsWith('/api/')) {
    const file = path.join(__dirname, pathname.replace(/\/+$/, '') + '.js');
    if (!file.startsWith(path.join(__dirname, 'api')) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = undefined; }
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    return require(file)(req, res);
  }

  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
