const fs = require('fs');
const path = require('path');
const output = path.join(__dirname, '..', 'feed', 'live-projects.json');
const duration = Math.max(5000, Number(process.env.CAPTURE_MS || 120000));
let previous = [];
try { previous = JSON.parse(fs.readFileSync(output, 'utf8')); } catch {}
const incoming = [];
const socket = new WebSocket('wss://pumpportal.fun/api/data');
socket.addEventListener('open', () => socket.send(JSON.stringify({ method: 'subscribeNewToken' })));
socket.addEventListener('message', event => {
  try { const item = JSON.parse(event.data); if (item?.mint && item.txType === 'create') incoming.push({ ...item, seenAt: Date.now() }); } catch {}
});
socket.addEventListener('error', event => console.error('Live feed socket error', event.message || 'connection failed'));
setTimeout(() => {
  socket.close();
  const merged = [...incoming.reverse(), ...previous].filter((item, index, all) => item?.mint && all.findIndex(other => other.mint === item.mint) === index).slice(0, 100);
  fs.writeFileSync(output, JSON.stringify(merged, null, 2) + '\n');
  console.log(`Saved ${merged.length} real Pump.fun creation events (${incoming.length} new).`);
}, duration);
