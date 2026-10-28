const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.OHMOON_PORT || 4184);
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.glb':'model/gltf-binary', '.ico':'image/x-icon' };
function send(res, file) {
  try { const data = fs.readFileSync(file); res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control':'no-cache' }); res.end(data); }
  catch { res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' }); res.end('Not found'); }
}
http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
  let pathname = decodeURIComponent(url.pathname);
  if (/^\/ohmoon\/?$/i.test(pathname)) pathname = '/';
  else if (/^\/ohmoon\//i.test(pathname)) pathname = pathname.slice('/OHMOON'.length);
  let file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  else if (!path.extname(file) && fs.existsSync(path.join(file, 'index.html'))) file = path.join(file, 'index.html');
  if (fs.existsSync(file) && fs.statSync(file).isFile()) { send(res, file); return; }
  res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' }); res.end(`OhMoon route not found: ${url.pathname}`);
}).listen(PORT, '127.0.0.1', () => console.log(`OhMoon: http://127.0.0.1:${PORT}/`));
