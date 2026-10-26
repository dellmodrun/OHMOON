const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname);
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(DATA, 'uploads');
const LAUNCHES = path.join(DATA, 'launches.json');
const PORT = Number(process.env.PORT || 4184);
const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const RPC = process.env.SOLANA_RPC_URL || 'https://rpc.solanatracker.io/public';
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon'
};

fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(LAUNCHES)) fs.writeFileSync(LAUNCHES, '[]\n');

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

function body(req, limit = 3_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Request is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function requestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || `127.0.0.1:${PORT}`).split(',')[0].trim();
  return `${proto}://${host}`;
}

function safeText(value, max) {
  return String(value || '').trim().slice(0, max);
}

async function createMetadata(req, res) {
  const input = await body(req);
  const name = safeText(input.name, 32);
  const symbol = safeText(input.symbol, 10).toUpperCase();
  const description = safeText(input.description, 500);
  if (name.length < 2 || !/^[A-Z0-9]{2,10}$/.test(symbol) || !description) {
    return json(res, 400, { error: 'Name, ticker and description are required.' });
  }
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(input.imageData || ''));
  if (!match) return json(res, 400, { error: 'A PNG, JPG or WebP image is required.' });
  const image = Buffer.from(match[2], 'base64');
  if (!image.length || image.length > 2_000_000) return json(res, 413, { error: 'Image must be 2 MB or smaller.' });
  const id = crypto.randomUUID();
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const origin = requestOrigin(req);
  const imageUrl = `${origin}/uploads/${id}.${ext}`;
  const metadataUrl = `${origin}/uploads/${id}.json`;
  const metadata = {
    name, symbol, description, image: imageUrl, showName: true, createdOn: origin,
    twitter: safeText(input.twitter, 240), website: safeText(input.website, 240)
  };
  fs.writeFileSync(path.join(UPLOADS, `${id}.${ext}`), image);
  fs.writeFileSync(path.join(UPLOADS, `${id}.json`), JSON.stringify(metadata, null, 2));
  json(res, 201, { uri: metadataUrl, image: imageUrl });
}

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!response.ok) throw new Error(`RPC returned ${response.status}.`);
  const result = await response.json();
  if (result.error) throw new Error(result.error.message || 'RPC rejected the request.');
  return result.result;
}

async function verifyLaunch(record) {
  const transaction = await rpc('getTransaction', [record.signature, {
    commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 0
  }]);
  if (!transaction || transaction.meta?.err) return false;
  const keys = transaction.transaction?.message?.accountKeys || [];
  const addresses = keys.map(key => typeof key === 'string' ? key : key.pubkey);
  return addresses.includes(PUMP_PROGRAM) && addresses.includes(record.mint) && addresses.includes(record.creator);
}

function readLaunches() {
  try { return JSON.parse(fs.readFileSync(LAUNCHES, 'utf8')); }
  catch { return []; }
}

async function registerLaunch(req, res) {
  const input = await body(req, 100_000);
  const record = {
    mint: safeText(input.mint, 60), signature: safeText(input.signature, 100),
    name: safeText(input.name, 32), symbol: safeText(input.symbol, 10).toUpperCase(),
    uri: safeText(input.uri, 500), creator: safeText(input.creator, 60),
    createdAt: safeText(input.createdAt, 40), network: 'mainnet-beta'
  };
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,60}$/.test(record.mint) ||
      !/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(record.signature) ||
      !/^[1-9A-HJ-NP-Za-km-z]{32,60}$/.test(record.creator) ||
      !record.name || !/^[A-Z0-9]{2,10}$/.test(record.symbol) || !/^https?:\/\//.test(record.uri)) {
    return json(res, 400, { error: 'Invalid launch receipt.' });
  }
  let verified = false;
  try { verified = await verifyLaunch(record); }
  catch (error) { return json(res, 503, { error: `Unable to verify transaction: ${error.message}` }); }
  if (!verified) return json(res, 422, { error: 'The transaction is not a confirmed Pump create transaction.' });
  const launches = readLaunches();
  if (!launches.some(item => item.signature === record.signature)) {
    launches.unshift(record);
    fs.writeFileSync(LAUNCHES, JSON.stringify(launches.slice(0, 500), null, 2) + '\n');
  }
  json(res, 201, { ok: true, record });
}

function serve(res, file, status = 200) {
  try {
    let data = fs.readFileSync(file);
    const mime = types[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (mime.includes('text/html')) {
      let html = data.toString('utf8');
      if (!html.includes('onemod.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/onemod.css"></head>');
      if (!html.includes('onemod.js')) html = html.replace('</body>', '<script src="/onemod.js"></script><script src="/pump-client.bundle.js"></script></body>');
      data = Buffer.from(html);
    }
    res.writeHead(status, { 'content-type': mime, 'cache-control': mime.includes('html') ? 'no-cache' : 'public, max-age=3600' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/onemod') url.pathname = '/';
    else if (url.pathname.startsWith('/onemod/')) url.pathname = url.pathname.slice('/onemod'.length);
    if (url.pathname === '/api/onemod/metadata' && req.method === 'POST') return await createMetadata(req, res);
    if (url.pathname === '/api/onemod/launches' && req.method === 'GET') return json(res, 200, readLaunches());
    if (url.pathname === '/api/onemod/launches' && req.method === 'POST') return await registerLaunch(req, res);
    if (url.pathname.startsWith('/uploads/')) {
      const upload = path.resolve(UPLOADS, url.pathname.slice('/uploads/'.length));
      if (!upload.startsWith(UPLOADS + path.sep)) return json(res, 403, { error: 'Forbidden.' });
      if (fs.existsSync(upload) && fs.statSync(upload).isFile()) return serve(res, upload);
      return json(res, 404, { error: 'Not found.' });
    }

    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { return json(res, 400, { error: 'Invalid path.' }); }
    let relative = pathname.replace(/^\/+/, '');
    if (!relative || pathname.endsWith('/')) relative = path.join(relative, 'index.html');
    let file = path.resolve(ROOT, relative);
    if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return json(res, 403, { error: 'Forbidden.' });
    if (!path.extname(pathname) && fs.existsSync(path.join(file, 'index.html'))) file = path.join(file, 'index.html');
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return serve(res, file);
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (error) {
    if (!res.headersSent) json(res, error.status || 500, { error: error.message || 'Internal server error.' });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Onemod launchpad: http://127.0.0.1:${PORT}/`));
