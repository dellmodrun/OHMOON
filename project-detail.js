(() => {
  const root = document.querySelector('[data-project]');
  const canvas = document.querySelector('#pd-chart');
  if (!root || !canvas) return;
  const seedText = root.dataset.ticker || 'ONEMOD';
  const seed = [...seedText].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  let period = '5m';
  let candles = [];
  const rand = (index) => {
    const x = Math.sin(seed * 91.17 + index * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  function makeCandles(multiplier = 1) {
    const count = 72;
    let price = Number(root.dataset.price || 0.0000842);
    const result = [];
    for (let i = 0; i < count; i += 1) {
      const open = price;
      const drift = (rand(i * 3 + multiplier) - 0.46) * 0.085;
      const close = Math.max(open * (1 + drift), open * 0.88);
      const high = Math.max(open, close) * (1 + rand(i * 3 + 1) * 0.035);
      const low = Math.min(open, close) * (1 - rand(i * 3 + 2) * 0.035);
      const volume = 0.3 + rand(i * 7 + 4) * 0.7;
      result.push({ open, high, low, close, volume });
      price = close;
    }
    return result;
  }
  function draw() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    const w = rect.width, h = rect.height, pad = { l: 16, r: 68, t: 46, b: 52 };
    const chartH = h - pad.t - pad.b;
    const high = Math.max(...candles.map(c => c.high));
    const low = Math.min(...candles.map(c => c.low));
    const y = value => pad.t + (high - value) / (high - low) * chartH;
    ctx.strokeStyle = '#ded7c4'; ctx.lineWidth = 1; ctx.font = '10px IBM Plex Mono, monospace'; ctx.fillStyle = '#858075';
    for (let i = 0; i <= 5; i += 1) {
      const yy = pad.t + chartH * i / 5;
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke();
      const value = high - (high - low) * i / 5;
      ctx.fillText(value.toFixed(7), w - pad.r + 8, yy + 3);
    }
    const step = (w - pad.l - pad.r) / candles.length;
    const body = Math.max(2, step * 0.58);
    candles.forEach((c, i) => {
      const x = pad.l + i * step + step / 2;
      const up = c.close >= c.open;
      ctx.strokeStyle = up ? '#1c9d79' : '#d65f55';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.moveTo(x, y(c.high)); ctx.lineTo(x, y(c.low)); ctx.stroke();
      const top = y(Math.max(c.open, c.close)); const bottom = y(Math.min(c.open, c.close));
      ctx.fillRect(x - body / 2, top, body, Math.max(1.5, bottom - top));
      const vh = c.volume * 26;
      ctx.globalAlpha = .22; ctx.fillRect(x - body / 2, h - 14 - vh, body, vh); ctx.globalAlpha = 1;
    });
    const last = candles[candles.length - 1];
    const meta = document.querySelector('.pd-chart-meta');
    if (meta) meta.innerHTML = `<span>O <b>${last.open.toFixed(7)}</b></span><span>H <b>${last.high.toFixed(7)}</b></span><span>L <b>${last.low.toFixed(7)}</b></span><span>C <b>${last.close.toFixed(7)}</b></span>`;
  }
  function selectPeriod(value) {
    period = value;
    candles = makeCandles(['1m','5m','15m','1h','4h'].indexOf(period) + 1);
    document.querySelectorAll('.pd-periods button').forEach(btn => btn.classList.toggle('on', btn.dataset.period === period));
    draw();
  }
  document.querySelectorAll('.pd-periods button').forEach(btn => btn.addEventListener('click', () => selectPeriod(btn.dataset.period)));
  document.querySelectorAll('.pd-tabs button').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.pd-tabs button').forEach(x => x.classList.remove('on'));
    btn.classList.add('on');
    document.querySelector('.pd-wallet').dataset.side = btn.dataset.side;
  }));
  document.querySelectorAll('.pd-quick button').forEach(btn => btn.addEventListener('click', () => { document.querySelector('.pd-amount input').value = btn.dataset.amount; }));
  const wallet = document.querySelector('.pd-wallet');
  wallet.addEventListener('click', async () => {
    if (!window.solana?.connect) { wallet.textContent = 'Install a Solana wallet'; return; }
    try {
      const result = await window.solana.connect();
      const address = result.publicKey?.toString() || window.solana.publicKey?.toString() || '';
      wallet.textContent = address ? `${address.slice(0,4)}…${address.slice(-4)} connected` : 'Wallet connected';
    } catch { wallet.textContent = 'Connect wallet'; }
  });
  new ResizeObserver(draw).observe(canvas);
  selectPeriod('5m');
})();
