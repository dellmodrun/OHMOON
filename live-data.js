(() => {
  const BASE = location.pathname.startsWith('/onemod') ? '/onemod' : '';
  const KEY = 'onemod-live-projects-v2';
  const LEGACY_KEY = 'onemod-live-projects-v1';
  const fallbacks = ['fallback-01','fallback-02','fallback-03','fallback-04','fallback-05','fallback-06','fallback-07','fallback-08','fallback-09','fallback-10','fallback-11','fallback-12'];
  let sort = 'new';
  let query = '';
  let tokens = [];
  try { tokens = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || '[]').filter(item => item?.mint); } catch {}

  const safe = (value, fallback = '') => String(value || fallback).replace(/[<>]/g, '');
  const age = time => { const seconds = Math.max(0, Math.floor((Date.now() - Number(time || Date.now())) / 1000)); return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`; };
  const shortAddress = value => value ? `${value.slice(0, 4)}...${value.slice(-4)}` : 'unknown';
  const image = (token, index) => token.image || `${BASE}/assets/projects/${fallbacks[index % fallbacks.length]}.svg`;
  const href = token => `${BASE}/trade/?mint=${encodeURIComponent(token.mint)}`;
  const progress = token => Math.max(0, Math.min(100, Math.round(((Number(token.vSolInBondingCurve || 30) - 30) / 55) * 100)));
  const filtered = () => {
    const result = tokens.filter(token => !query || `${token.name || ''} ${token.symbol || ''} ${token.mint}`.toLowerCase().includes(query));
    return result.sort((a, b) => sort === 'mcap' ? Number(b.marketCapSol || 0) - Number(a.marketCapSol || 0) : sort === 'graduating' ? progress(b) - progress(a) : Number(b.seenAt || 0) - Number(a.seenAt || 0));
  };

  function renderCards(list) {
    document.querySelectorAll('.boardsec .ccard').forEach((card, index) => {
      const token = list[index]; card.hidden = !token; card.style.display = token ? '' : 'none'; if (!token) return;
      const link = card.querySelector('.cc-hit'); if (link) { link.href = href(token); link.setAttribute('aria-label', `${safe(token.name)} $${safe(token.symbol)}`); }
      const pic = card.querySelector('.cc-pic'); if (pic) { pic.src = image(token, index); pic.alt = `$${safe(token.symbol)} token artwork`; }
      const set = (selector, value) => { const node = card.querySelector(selector); if (node) node.textContent = value; };
      set('.cc-age', age(token.seenAt)); set('.cc-mcv', `${Number(token.marketCapSol || 0).toFixed(2)} SOL`); set('.cc-desc', safe(token.description, 'Live Pump.fun token creation event.'));
      const name = card.querySelector('.cc-name'); if (name) { name.textContent = safe(token.name, 'Untitled'); const ticker = document.createElement('small'); ticker.textContent = `$${safe(token.symbol, 'TOKEN')}`; name.append(' ', ticker); }
      const pct = progress(token), bar = card.querySelector('[role="progressbar"]'); if (bar) { bar.style.setProperty('--v', pct / 100); bar.setAttribute('aria-valuenow', pct); }
      set('.cc-pct', `${pct}%`);
    });
  }

  function render() {
    const list = filtered(); renderCards(list);
    document.querySelectorAll('.trend .tile').forEach((tile, index) => {
      const token = list[index]; tile.hidden = !token; tile.style.display = token ? '' : 'none'; if (!token) return;
      tile.href = href(token); const pic = tile.querySelector('.tile-img'); if (pic) { pic.src = image(token, index); pic.alt = `$${safe(token.symbol)} token artwork`; }
      const set = (selector, value) => { const node = tile.querySelector(selector); if (node) node.textContent = value; };
      set('.tile-name', safe(token.name, 'Untitled')); set('.tile-tick', `$${safe(token.symbol, 'TOKEN')}`); set('.tile-mc', `${Number(token.marketCapSol || 0).toFixed(2)} SOL`); set('.chg', 'LIVE');
    });
    const board = document.querySelector('.boardsec');
    if (board) {
      let state = board.querySelector('.om-live-state'); if (!state) { state = document.createElement('span'); state.className = 'om-live-state'; board.querySelector('.board-head')?.appendChild(state); }
      state.textContent = tokens.length ? `● LIVE | ${tokens.length} RECENT PUMP.FUN LAUNCHES` : '● CONNECTING TO PUMP.FUN LIVE FEED';
    }
    const spot = document.querySelector('.lc-spot'), first = list[0];
    if (spot) { spot.hidden = !first; spot.style.display = first ? '' : 'none'; if (first) { spot.querySelector('img').src = image(first, 0); spot.querySelector('.lc-spot-tick').textContent = `$${safe(first.symbol, 'TOKEN')}`; spot.querySelector('.lc-spot-name').textContent = safe(first.name, 'Untitled'); spot.querySelector('.lc-spot-foot b').textContent = `${Number(first.marketCapSol || 0).toFixed(2)} SOL`; spot.querySelector('.lc-spot-cta a').href = href(first); } }
    document.querySelectorAll('.lc-grid .lc-card-link').forEach((card, index) => { const token = list[index + 1]; card.hidden = !token; card.style.display = token ? '' : 'none'; if (!token) return; card.href = href(token); card.querySelector('img').src = image(token, index + 1); card.querySelector('.lc-card-tick').textContent = `$${safe(token.symbol, 'TOKEN')}`; card.querySelector('.lc-card-name').textContent = safe(token.name, 'Untitled'); card.querySelector('.lc-card-right b').textContent = `${Number(token.marketCapSol || 0).toFixed(2)} SOL`; card.querySelector('.lc-card-right span').textContent = `${age(token.seenAt)} ago`; });
    document.querySelectorAll('.so-call').forEach((call, index) => { const token = list[index]; call.hidden = !token; call.style.display = token ? '' : 'none'; if (!token) return; const coin = call.querySelector('.so-coin'); coin.href = href(token); coin.querySelector('img').src = image(token, index); coin.querySelector('b').textContent = safe(token.name, 'Untitled'); coin.querySelector('.mono.muted').textContent = `$${safe(token.symbol, 'TOKEN')}`; call.querySelector('.so-addr').textContent = shortAddress(token.traderPublicKey); call.querySelector('.so-ago').textContent = `${age(token.seenAt)} ago`; call.querySelector('.so-text').textContent = 'A new Pump.fun market appeared on the live creation stream.'; call.querySelectorAll('.so-score b').forEach(node => { node.textContent = `${Number(token.marketCapSol || 0).toFixed(2)} SOL`; }); call.querySelector('.so-chg').textContent = 'LIVE'; });
    document.querySelectorAll('.main table tbody tr').forEach((row, index) => { const token = list[index]; row.hidden = !token; row.style.display = token ? '' : 'none'; if (!token) return; const cells = row.querySelectorAll('td'); if (cells.length < 5) return; cells[0].innerHTML = `<a href="${href(token)}"><b>$${safe(token.symbol, 'TOKEN')}</b></a>`; cells[1].textContent = 'Pump.fun market created'; cells[2].textContent = shortAddress(token.traderPublicKey); cells[3].textContent = `${age(token.seenAt)} ago`; cells[4].innerHTML = '<span class="chip chip-ok">live</span>'; });
    const liveStats = document.querySelectorAll('.lc-stat b'); if (liveStats.length) { liveStats[0].textContent = tokens.length; liveStats[1].textContent = tokens.length; liveStats[2].textContent = 'LIVE'; }
    const activityStats = document.querySelectorAll('.receipts-tot b'); if (activityStats.length) { activityStats[0].textContent = tokens.length; activityStats[1].textContent = tokens.length; activityStats[2].textContent = '0'; activityStats[3].textContent = '0'; }
    const projectCount = document.querySelector('.hstats .hstat b'); if (projectCount) projectCount.textContent = tokens.length;
  }

  async function hydrate(token) {
    if (!token.uri || token.metadataLoaded) return;
    try {
      const cidPath = String(token.uri).match(/(?:ipfs:\/\/|\/ipfs\/)([^?#]+)/)?.[1];
      const uri = cidPath ? `https://gateway.pinata.cloud/ipfs/${cidPath}` : token.uri;
      const response = await fetch(uri); if (!response.ok) return;
      const meta = await response.json();
      const imagePath = String(meta.image || token.image || '').match(/(?:ipfs:\/\/|\/ipfs\/)([^?#]+)/)?.[1];
      token.image = imagePath ? `https://gateway.pinata.cloud/ipfs/${imagePath}` : (meta.image || token.image); token.description = meta.description || token.description; token.twitter = meta.twitter || ''; token.website = meta.website || ''; token.metadataLoaded = true;
      localStorage.setItem(KEY, JSON.stringify(tokens.slice(0, 40))); render();
    } catch {}
  }
  function add(event) {
    if (!event?.mint || event.txType !== 'create') return;
    const token = { ...event, seenAt: Date.now() }; tokens = [token, ...tokens.filter(item => item.mint !== token.mint)].slice(0, 40); localStorage.setItem(KEY, JSON.stringify(tokens)); render(); hydrate(token);
  }

  document.querySelectorAll('.board-head .tab').forEach(button => {
    if (!['new', 'mcap', 'graduating'].includes(button.dataset.id)) { button.remove(); return; }
    button.addEventListener('click', () => { sort = button.dataset.id; document.querySelectorAll('.board-head .tab').forEach(node => { node.classList.toggle('on', node === button); node.setAttribute('aria-selected', String(node === button)); }); render(); });
  });
  document.querySelectorAll('.search input').forEach(input => input.addEventListener('input', () => { query = input.value.trim().toLowerCase(); render(); }));
  render(); tokens.forEach(hydrate);
  fetch(`${BASE}/feed/live-projects.json?ts=${Math.floor(Date.now() / 300000)}`).then(response => response.ok ? response.json() : []).then(items => {
    if (!Array.isArray(items)) return;
    tokens = [...tokens, ...items].filter((item, index, all) => item?.mint && all.findIndex(other => other.mint === item.mint) === index).sort((a, b) => Number(b.seenAt || 0) - Number(a.seenAt || 0)).slice(0, 40);
    localStorage.setItem(KEY, JSON.stringify(tokens)); render(); tokens.forEach(hydrate);
  }).catch(() => {});
  let retry = 1000;
  function open() { const socket = new WebSocket('wss://pumpportal.fun/api/data'); socket.onopen = () => { retry = 1000; socket.send(JSON.stringify({ method: 'subscribeNewToken' })); }; socket.onmessage = message => { try { add(JSON.parse(message.data)); } catch {} }; socket.onclose = () => { setTimeout(open, retry); retry = Math.min(retry * 2, 30000); }; socket.onerror = () => socket.close(); }
  open(); setInterval(render, 10000);
})();
