(() => {
  const BASE = ['/ohmoon', '/OHMOON'].find(base => location.pathname === base || location.pathname.startsWith(`${base}/`)) || '';
  const KEY = 'ohmoon-live-projects-v2';
  const LEGACY_KEY = 'ohmoon-live-projects-v1';
  const PLACEHOLDER = `${BASE}/assets/projects/token-placeholder.svg`;
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  let sort = 'new';
  let query = '';
  let tokens = [];
  let solUsd = Number(sessionStorage.getItem('ohmoon-sol-usd') || 0);
  try { tokens = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || '[]').filter(item => item?.mint); } catch {}
  const initialSeen = new Set(); tokens = tokens.filter(token => { const key = `${token.traderPublicKey || ''}|${token.name || ''}|${token.symbol || ''}`.toLowerCase(); if (initialSeen.has(token.mint) || initialSeen.has(key)) return false; initialSeen.add(token.mint); initialSeen.add(key); return true; });

  const safe = (value, fallback = '') => String(value || fallback).replace(/[<>]/g, '');
  const ticker = value => `$${safe(value, 'TOKEN').replace(/^\$+/, '')}`;
  const age = time => { const seconds = Math.max(0, Math.floor((Date.now() - Number(time || Date.now())) / 1000)); return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`; };
  const shortAddress = value => value ? `${value.slice(0, 4)}...${value.slice(-4)}` : 'unknown';
  const image = token => token.localImage ? `${BASE}/${String(token.localImage).replace(/^\/+/, '')}` : token.marketImage || token.image || PLACEHOLDER;
  const setImage = (node, token, alt) => {
    if (!node) return;
    if (node.tagName !== 'IMG') {
      const replacement = document.createElement('img'); replacement.className = node.className.replace(/\bnoimg\b/g, '').trim(); node.replaceWith(replacement); node = replacement;
    }
    const target = image(token); node.alt = alt; node.loading = 'lazy';
    if (node.dataset.tokenImage === target) return;
    node.dataset.tokenImage = target; node.src = PLACEHOLDER;
    if (target === PLACEHOLDER) return;
    const loader = new Image();
    loader.onload = () => { if (node.dataset.tokenImage === target) node.src = target; };
    loader.onerror = () => { if (node.dataset.tokenImage === target) node.src = PLACEHOLDER; };
    loader.src = target;
  };
  const href = token => `${BASE}/trade/?mint=${encodeURIComponent(token.mint)}`;
  const progress = token => {
    const marketCapSol = solUsd > 0 && Number(token.marketCapUsd) > 0 ? Number(token.marketCapUsd) / solUsd : Number(token.marketCapSol || 0);
    const virtualSol = marketCapSol > 0 ? Math.sqrt(marketCapSol * 32.1908571429) : Number(token.vSolInBondingCurve || 30);
    return Math.max(0, Math.min(100, Math.round(((virtualSol - 30) / 55) * 100)));
  };
  const usd = (value, zero = '—') => {
    const amount = Number(value); if (!Number.isFinite(amount) || amount < 0) return '—'; if (amount === 0) return zero;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(amount >= 1e10 ? 1 : 2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(amount >= 1e7 ? 1 : 2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(amount >= 1e4 ? 1 : 2)}K`;
    return `$${amount.toFixed(amount >= 100 ? 0 : 2)}`;
  };
  const filtered = () => {
    const result = tokens.filter(token => !query || `${token.name || ''} ${token.symbol || ''} ${token.mint}`.toLowerCase().includes(query));
    return result.sort((a, b) => sort === 'mcap' ? Number(b.marketCapUsd || 0) - Number(a.marketCapUsd || 0) : sort === 'graduating' ? progress(b) - progress(a) : Number(b.seenAt || 0) - Number(a.seenAt || 0));
  };

  function renderCards(list) {
    document.querySelectorAll('.boardsec .ccard').forEach((card, index) => {
      const token = list[index]; card.hidden = !token; card.style.display = token ? '' : 'none'; if (!token) return;
      let origin = card.querySelector('.om-origin-badge');
      if (token.platform === 'ohmoon') {
        if (!origin) { origin = document.createElement('span'); origin.className = 'om-origin-badge'; card.appendChild(origin); }
        origin.textContent = 'OHMOON'; origin.hidden = false;
      } else if (origin) origin.hidden = true;
      const link = card.querySelector('.cc-hit'); if (link) { link.href = href(token); link.setAttribute('aria-label', `${safe(token.name)} ${ticker(token.symbol)}`); }
      setImage(card.querySelector('.cc-pic'), token, `${ticker(token.symbol)} token artwork`);
      const set = (selector, value) => { const node = card.querySelector(selector); if (node) node.textContent = value; };
      set('.cc-age', age(token.seenAt)); set('.cc-mcv', usd(token.marketCapUsd)); set('.cc-desc', safe(token.description, 'Live Pump.fun token creation event.'));
      const ath = card.querySelector('.cc-ath'); if (ath) { ath.hidden = false; ath.style.display = ''; ath.textContent = token.marketSource === 'market' ? 'live market' : 'curve estimate'; }
      const marketCap = card.querySelector('.cc-mcv'); if (marketCap) marketCap.title = token.marketSource === 'market' ? 'Live USD market cap from the active SOL market' : 'USD estimate from the latest bonding-curve valuation';
      const volume = card.querySelector('.cc-foot .chip:not(.chip-pair) .mono'); if (volume) volume.textContent = usd(token.volumeUsd24h, '$0');
      const author = card.querySelector('.cc-by'); if (author) { author.textContent = token.platform === 'ohmoon' ? 'OhMoon' : 'Pump.fun'; author.title = token.platform === 'ohmoon' ? 'Created through OhMoon' : 'Discovered on the Pump.fun creation stream'; }
      card.querySelectorAll('.spark').forEach(node => { node.hidden = true; node.style.display = 'none'; });
      const name = card.querySelector('.cc-name'); if (name) { name.textContent = safe(token.name, 'Untitled'); const symbol = document.createElement('small'); symbol.textContent = ticker(token.symbol); name.append(' ', symbol); }
      const pct = progress(token), bar = card.querySelector('[role="progressbar"]'); if (bar) { bar.style.setProperty('--v', pct / 100); bar.setAttribute('aria-valuenow', pct); }
      set('.cc-pct', `${pct}%`);
    });
  }

  function render() {
    const list = filtered(); renderCards(list);
    document.querySelectorAll('.trend .tile').forEach((tile, index) => {
      const token = list[index]; tile.hidden = !token; tile.style.display = token ? '' : 'none'; if (!token) return;
      let origin = tile.querySelector('.om-origin-badge');
      if (token.platform === 'ohmoon') {
        if (!origin) { origin = document.createElement('span'); origin.className = 'om-origin-badge'; tile.appendChild(origin); }
        origin.textContent = 'OHMOON'; origin.hidden = false;
      } else if (origin) origin.hidden = true;
      tile.href = href(token); setImage(tile.querySelector('.tile-img'), token, `${ticker(token.symbol)} token artwork`);
      const set = (selector, value) => { const node = tile.querySelector(selector); if (node) node.textContent = value; };
      set('.tile-name', safe(token.name, 'Untitled')); set('.tile-tick', ticker(token.symbol)); set('.tile-mc', usd(token.marketCapUsd)); set('.chg', 'LIVE');
      tile.querySelectorAll('.spark').forEach(node => { node.hidden = true; node.style.display = 'none'; });
      const tileProgress = progress(token), tileBar = tile.querySelector('[role="progressbar"]'); if (tileBar) { tileBar.style.setProperty('--v', tileProgress / 100); tileBar.setAttribute('aria-valuenow', tileProgress); tileBar.setAttribute('aria-label', `${tileProgress}% of the bonding curve`); }
    });
    const board = document.querySelector('.boardsec');
    if (board) {
      let state = board.querySelector('.om-live-state'); if (!state) { state = document.createElement('span'); state.className = 'om-live-state'; board.querySelector('.board-head')?.appendChild(state); }
      state.textContent = tokens.length ? `● LIVE | ${tokens.length} RECENT PUMP.FUN LAUNCHES` : '● CONNECTING TO PUMP.FUN LIVE FEED';
    }
    const spot = document.querySelector('.lc-spot'), first = list[0];
    if (spot) { spot.hidden = !first; spot.style.display = first ? '' : 'none'; if (first) { setImage(spot.querySelector('img'), first, `${ticker(first.symbol)} token artwork`); spot.querySelector('.lc-spot-tick').textContent = ticker(first.symbol); spot.querySelector('.lc-spot-name').textContent = safe(first.name, 'Untitled'); spot.querySelector('.lc-spot-foot b').textContent = usd(first.marketCapUsd); spot.querySelector('.lc-spot-cta a').href = href(first); const pct = progress(first), fill = spot.querySelector('.lc-fill'); if (fill) fill.style.width = `${pct}%`; const steps = spot.querySelectorAll('.lc-steps span'); if (steps.length === 3) { steps[0].textContent = first.metadataLoaded ? 'metadata ready' : 'metadata pending'; steps[1].textContent = 'market live'; steps[2].textContent = `${pct}% curve`; } } }
    document.querySelectorAll('.lc-grid .lc-card-link').forEach((card, index) => { const token = list[index + 1]; card.hidden = !token; card.style.display = token ? '' : 'none'; if (!token) return; card.href = href(token); setImage(card.querySelector('img'), token, `${ticker(token.symbol)} token artwork`); card.querySelector('.lc-card-tick').textContent = ticker(token.symbol); card.querySelector('.lc-card-name').textContent = safe(token.name, 'Untitled'); card.querySelector('.lc-card-right b').textContent = usd(token.marketCapUsd); card.querySelector('.lc-card-right span').textContent = `${age(token.seenAt)} ago`; const pct = progress(token), shell = card.closest('.lc-card'), fill = shell?.querySelector('.lc-fill'); if (fill) fill.style.width = `${pct}%`; const steps = shell?.querySelectorAll('.lc-steps span') || []; if (steps.length === 3) { steps[0].textContent = token.metadataLoaded ? 'metadata' : 'metadata pending'; steps[1].textContent = 'market live'; steps[2].textContent = `${pct}% curve`; } });
    document.querySelectorAll('.so-call').forEach((call, index) => { const token = list[index]; call.hidden = !token; call.style.display = token ? '' : 'none'; if (!token) return; const coin = call.querySelector('.so-coin'); coin.href = href(token); setImage(coin.querySelector('img'), token, `${ticker(token.symbol)} token artwork`); coin.querySelector('b').textContent = safe(token.name, 'Untitled'); coin.querySelector('.mono.muted').textContent = ticker(token.symbol); call.querySelector('.so-ava').textContent = safe(token.symbol, '??').replace(/^\$+/, '').slice(0, 2).toUpperCase(); call.querySelector('.so-addr').textContent = shortAddress(token.traderPublicKey); call.querySelector('.so-badge').textContent = 'creator'; call.querySelector('.so-ago').textContent = `${age(token.seenAt)} ago`; call.querySelector('.so-text').textContent = token.description ? safe(token.description) : 'A live Pump.fun market discovered by OhMoon.'; const scores = call.querySelectorAll('.so-score>div'); if (scores.length >= 2) { scores[0].querySelector('.cc-lbl').textContent = 'market cap'; scores[0].querySelector('b').textContent = usd(token.marketCapUsd); scores[1].querySelector('.cc-lbl').textContent = '24h volume'; scores[1].querySelector('b').textContent = usd(token.volumeUsd24h, '$0'); } call.querySelector('.so-chg').textContent = `${progress(token)}% CURVE`; });
    document.querySelectorAll('.main table tbody tr').forEach((row, index) => { const token = list[index]; row.hidden = !token; row.style.display = token ? '' : 'none'; if (!token) return; const cells = row.querySelectorAll('td'); if (cells.length < 5) return; cells[0].innerHTML = `<a href="${href(token)}"><b>${ticker(token.symbol)}</b></a>`; cells[1].textContent = 'Pump.fun market created'; cells[2].textContent = shortAddress(token.traderPublicKey); cells[3].textContent = `${age(token.seenAt)} ago`; cells[4].innerHTML = '<span class="chip chip-ok">live</span>'; });
    const indexed = tokens.filter(token => token.marketSource === 'market').length, estimated = tokens.filter(token => token.marketSource !== 'market').length;
    const liveStats = document.querySelectorAll('.lc-stat b'); if (liveStats.length) { liveStats[0].textContent = tokens.length; liveStats[1].textContent = indexed; liveStats[2].textContent = 'LIVE'; const labels = document.querySelectorAll('.lc-stat span'); if (labels.length >= 3) { labels[0].textContent = 'projects loaded'; labels[1].textContent = 'markets indexed'; labels[2].textContent = 'feed status'; } }
    const quality = document.querySelectorAll('.calls-side .om-rule-grid>div'); if (quality.length >= 3) { quality[0].querySelector('b').textContent = `${tokens.length} observations`; quality[0].querySelector('span').textContent = 'live creation events currently loaded'; quality[1].querySelector('b').textContent = `${indexed} live markets`; quality[1].querySelector('span').textContent = 'priced from an active SOL market'; quality[2].querySelector('b').textContent = `${estimated} curve estimates`; quality[2].querySelector('span').textContent = 'used when a live market is not indexed yet'; }
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
      token.image = imagePath ? `https://gateway.pinata.cloud/ipfs/${imagePath}` : (meta.image || token.image); token.description = meta.description || token.description; token.twitter = meta.twitter || ''; token.website = meta.website || ''; token.platform = String(meta.platform || '').toLowerCase(); token.metadataLoaded = true;
      localStorage.setItem(KEY, JSON.stringify(tokens.slice(0, 40))); render();
    } catch {}
  }
  async function refreshSolPrice() {
    try {
      const response = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${SOL_MINT}`);
      if (!response.ok) return;
      const payload = await response.json(), value = Number(payload?.data?.attributes?.token_prices?.[SOL_MINT]);
      if (Number.isFinite(value) && value > 0) { solUsd = value; sessionStorage.setItem('ohmoon-sol-usd', String(value)); }
    } catch {}
  }
  async function refreshMarketData() {
    const mints = [...new Set(tokens.map(token => token.mint).filter(Boolean))];
    if (!mints.length) return;
    if (!(solUsd > 0)) await refreshSolPrice();
    const groups = []; for (let index = 0; index < mints.length; index += 30) groups.push(mints.slice(index, index + 30));
    try {
      const responses = await Promise.all(groups.map(async group => {
        const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${group.join(',')}`);
        return response.ok ? response.json() : [];
      }));
      const pairs = responses.flat().filter(pair => pair?.chainId === 'solana' && pair?.baseToken?.address && (pair.quoteToken?.address === SOL_MINT || pair.quoteToken?.symbol === 'SOL')), byMint = new Map();
      pairs.forEach(pair => {
        const mint = pair.baseToken?.address; if (!mint) return;
        const current = byMint.get(mint), score = (pair.dexId === 'pumpfun' ? 1e15 : 0) + Number(pair.liquidity?.usd || 0) + Number(pair.pairCreatedAt || 0) / 1e6, currentScore = current ? (current.dexId === 'pumpfun' ? 1e15 : 0) + Number(current.liquidity?.usd || 0) + Number(current.pairCreatedAt || 0) / 1e6 : -1;
        if (!current || score > currentScore) byMint.set(mint, pair);
      });
      tokens.forEach(token => {
        const pair = byMint.get(token.mint);
        const baseline = Number(token.marketCapSol || 0) * solUsd;
        const fromPrice = Number(pair?.priceUsd || 0) * 1_000_000_000;
        const reported = Number(pair?.marketCap ?? pair?.fdv ?? 0);
        const candidate = Number.isFinite(fromPrice) && fromPrice > 0 ? fromPrice : reported;
        const credible = Number.isFinite(candidate) && candidate > 0 && candidate <= Math.max(100_000_000, baseline * 10_000);
        token.marketCapUsd = credible ? candidate : baseline || null;
        token.marketSource = credible ? 'market' : 'curve';
        token.volumeUsd24h = pair ? Number(pair.volume?.h24 || 0) : 0;
        token.priceUsd = pair?.priceUsd || null;
        token.marketImage = pair?.info?.imageUrl || token.marketImage || '';
        token.marketUpdatedAt = Date.now();
      });
      localStorage.setItem(KEY, JSON.stringify(tokens.slice(0, 40))); render();
    } catch {}
  }
  async function add(event) {
    if (!event?.mint || event.txType !== 'create') return;
    if (!(solUsd > 0)) await refreshSolPrice();
    const baseline = Number(event.marketCapSol || 0) * solUsd;
    const token = { ...event, marketCapUsd:baseline || null, marketSource:'curve', volumeUsd24h:0, seenAt:Date.now() }, identity = `${token.traderPublicKey || ''}|${token.name || ''}|${token.symbol || ''}`.toLowerCase();
    tokens = [token, ...tokens.filter(item => item.mint !== token.mint && `${item.traderPublicKey || ''}|${item.name || ''}|${item.symbol || ''}`.toLowerCase() !== identity)].slice(0, 40); localStorage.setItem(KEY, JSON.stringify(tokens)); render(); hydrate(token); setTimeout(refreshMarketData, 1200);
  }

  const boardTabs = [...document.querySelectorAll('.board-head .tab')];
  document.querySelector('.board-head .tabs-ind')?.remove();
  boardTabs.forEach(button => {
    if (!['new', 'mcap', 'graduating'].includes(button.dataset.id)) { button.remove(); return; }
    const active = button.dataset.id === sort;
    button.classList.toggle('on', active);
    button.setAttribute('aria-selected', String(active));
    button.setAttribute('tabindex', active ? '0' : '-1');
  });
  const activeBoardTabs = () => [...document.querySelectorAll('.board-head .tab')];
  const selectBoardTab = button => {
    if (!button) return;
    sort = button.dataset.id;
    activeBoardTabs().forEach(node => {
      const active = node === button;
      node.classList.toggle('on', active);
      node.setAttribute('aria-selected', String(active));
      node.setAttribute('tabindex', active ? '0' : '-1');
    });
    render();
  };
  activeBoardTabs().forEach(button => {
    button.addEventListener('click', () => selectBoardTab(button));
    button.addEventListener('keydown', event => {
      const tabs = activeBoardTabs();
      const index = tabs.indexOf(button);
      const next = event.key === 'ArrowRight' ? tabs[(index + 1) % tabs.length]
        : event.key === 'ArrowLeft' ? tabs[(index - 1 + tabs.length) % tabs.length]
        : event.key === 'Home' ? tabs[0]
        : event.key === 'End' ? tabs[tabs.length - 1]
        : null;
      if (!next) return;
      event.preventDefault();
      selectBoardTab(next);
      next.focus();
    });
  });
  document.querySelectorAll('.search input').forEach(input => input.addEventListener('input', () => { query = input.value.trim().toLowerCase(); render(); }));
  render(); tokens.forEach(hydrate); refreshMarketData();
  fetch(`${BASE}/feed/live-projects.json?ts=${Math.floor(Date.now() / 300000)}`).then(response => response.ok ? response.json() : []).then(items => {
    if (!Array.isArray(items)) return;
    const seen = new Set(); tokens = [...tokens, ...items].filter(item => { if (!item?.mint) return false; const identity = `${item.traderPublicKey || ''}|${item.name || ''}|${item.symbol || ''}`.toLowerCase(); if (seen.has(item.mint) || seen.has(identity)) return false; seen.add(item.mint); seen.add(identity); return true; }).sort((a, b) => Number(b.seenAt || 0) - Number(a.seenAt || 0)).slice(0, 40);
    localStorage.setItem(KEY, JSON.stringify(tokens)); render(); tokens.forEach(hydrate); refreshMarketData();
  }).catch(() => {});
  let retry = 1000;
  function open() { const socket = new WebSocket('wss://pumpportal.fun/api/data'); socket.onopen = () => { retry = 1000; socket.send(JSON.stringify({ method: 'subscribeNewToken' })); }; socket.onmessage = message => { try { add(JSON.parse(message.data)); } catch {} }; socket.onclose = () => { setTimeout(open, retry); retry = Math.min(retry * 2, 30000); }; socket.onerror = () => socket.close(); }
  open(); setInterval(render, 10000); setInterval(refreshMarketData, 30000); setInterval(refreshSolPrice, 300000);
})();
