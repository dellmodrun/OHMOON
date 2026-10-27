const fs = require('fs');
const path = require('path');
const output = path.join(__dirname, '..', 'feed', 'live-projects.json');
const imageDir = path.join(__dirname, '..', 'feed', 'images');
const duration = Math.max(5000, Number(process.env.CAPTURE_MS || 120000));
let previous = [];
try { previous = JSON.parse(fs.readFileSync(output, 'utf8')); } catch {}
const incoming = [];
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const ipfs = value => {
  const cid = String(value || '').match(/(?:ipfs:\/\/|\/ipfs\/)([^?#]+)/)?.[1];
  return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : value;
};
async function metadata(item) {
  if (item.image && item.metadataLoaded) return item;
  try {
    const response = await fetch(ipfs(item.uri), { signal:AbortSignal.timeout(7000) }); if (!response.ok) return item;
    const meta = await response.json();
    return { ...item, image:ipfs(meta.image || item.image), description:meta.description || item.description || '', twitter:meta.twitter || item.twitter || '', website:meta.website || item.website || '', platform:String(meta.platform || item.platform || '').toLowerCase(), metadataLoaded:true };
  } catch { return item; }
}
async function market(items) {
  let solUsd = 0;
  try { const response = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${SOL_MINT}`, { signal:AbortSignal.timeout(7000) }); const body = await response.json(); solUsd = Number(body?.data?.attributes?.token_prices?.[SOL_MINT] || 0); } catch {}
  const groups = []; for (let index = 0; index < items.length; index += 30) groups.push(items.slice(index, index + 30));
  const responses = await Promise.all(groups.map(async group => { try { const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${group.map(item => item.mint).join(',')}`, { signal:AbortSignal.timeout(10000) }); return response.ok ? response.json() : []; } catch { return []; } }));
  const pairs = responses.flat().filter(pair => pair?.chainId === 'solana' && pair?.baseToken?.address && (pair.quoteToken?.address === SOL_MINT || pair.quoteToken?.symbol === 'SOL')), byMint = new Map();
  pairs.forEach(pair => { const mint = pair.baseToken.address, current = byMint.get(mint); if (!current || pair.dexId === 'pumpfun' || Number(pair.liquidity?.usd || 0) > Number(current.liquidity?.usd || 0)) byMint.set(mint, pair); });
  return items.map(item => {
    const pair = byMint.get(item.mint), baseline = Number(item.marketCapSol || 0) * solUsd, fromPrice = Number(pair?.priceUsd || 0) * 1_000_000_000, reported = Number(pair?.marketCap ?? pair?.fdv ?? 0), candidate = fromPrice > 0 ? fromPrice : reported;
    const credible = Number.isFinite(candidate) && candidate > 0 && candidate <= Math.max(100_000_000, baseline * 10_000);
    return { ...item, marketCapUsd:credible ? candidate : baseline || null, marketSource:credible ? 'market' : 'curve', volumeUsd24h:Number(pair?.volume?.h24 || 0), priceUsd:pair?.priceUsd || null, marketImage:pair?.info?.imageUrl || item.marketImage || '', marketUpdatedAt:Date.now() };
  });
}
async function cacheImages(items) {
  fs.mkdirSync(imageDir, { recursive:true });
  return Promise.all(items.map(async item => {
    const source = item.marketImage || item.image; if (!source) return { ...item, localImage:'' };
    const existing = fs.readdirSync(imageDir).find(name => name.startsWith(`${item.mint}.`));
    if (existing) return { ...item, localImage:`feed/images/${existing}` };
    try {
      const response = await fetch(source, { signal:AbortSignal.timeout(12000) }); if (!response.ok) return { ...item, localImage:'' };
      const data = Buffer.from(await response.arrayBuffer()); if (!data.length || data.length > 5 * 1024 * 1024) return { ...item, localImage:'' };
      const type = String(response.headers.get('content-type') || '').toLowerCase(), ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
      const filename = `${item.mint}.${ext}`; fs.writeFileSync(path.join(imageDir, filename), data);
      return { ...item, localImage:`feed/images/${filename}` };
    } catch { return { ...item, localImage:'' }; }
  }));
}
const socket = new WebSocket('wss://pumpportal.fun/api/data');
socket.addEventListener('open', () => socket.send(JSON.stringify({ method: 'subscribeNewToken' })));
socket.addEventListener('message', event => {
  try { const item = JSON.parse(event.data); if (item?.mint && item.txType === 'create') incoming.push({ ...item, seenAt: Date.now() }); } catch {}
});
socket.addEventListener('error', event => console.error('Live feed socket error', event.message || 'connection failed'));
setTimeout(async () => {
  socket.close();
  const seen = new Set(), merged = [...incoming.reverse(), ...previous].filter(item => { if (!item?.mint) return false; const identity = `${item.traderPublicKey || ''}|${item.name || ''}|${item.symbol || ''}`.toLowerCase(); if (seen.has(item.mint) || seen.has(identity)) return false; seen.add(item.mint); seen.add(identity); return true; }).slice(0, 100);
  const enriched = await cacheImages(await market(await Promise.all(merged.map(metadata))));
  fs.writeFileSync(output, JSON.stringify(enriched, null, 2) + '\n');
  console.log(`Saved ${enriched.length} verified Pump.fun creation events (${incoming.length} new).`);
}, duration);
