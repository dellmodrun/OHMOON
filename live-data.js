(() => {
  const board = document.querySelector('.boardsec');
  const BASE = location.pathname.startsWith('/onemod') ? '/onemod' : '';
  const KEY = 'onemod-live-projects-v1';
  const fallbacks = ['orbit-memo','signal-garden','quiet-market','curve-atlas','mint-canvas','holder-map','tempo-node','open-relay','echo-pool','north-frame','pattern-zero','lucid-route'];
  let tokens = [];
  try { tokens = JSON.parse(localStorage.getItem(KEY) || '[]').filter(x => x?.mint); } catch {}
  const age = (time) => { const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000)); return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`; };
  const safe = (value, fallback = '') => String(value || fallback).replace(/[<>]/g, '');
  const image = (token, index) => token.image || `${BASE}/assets/projects/${fallbacks[index % fallbacks.length]}.svg`;
  const href = token => `${BASE}/trade/?mint=${encodeURIComponent(token.mint)}`;
  const progress = token => Math.max(1, Math.min(99, Math.round(((Number(token.vSolInBondingCurve || 30) - 30) / 55) * 100)));

  function render() {
    const cards = [...document.querySelectorAll('.boardsec .ccard')];
    cards.forEach((card, index) => {
      const token = tokens[index]; card.hidden = !token; card.style.display = token ? '' : 'none'; if (!token) return;
      const link = card.querySelector('.cc-hit'); link.href = href(token); link.setAttribute('aria-label', `${safe(token.name)} $${safe(token.symbol)}`);
      const pic = card.querySelector('.cc-pic'); pic.src = image(token, index); pic.alt = `$${safe(token.symbol)} token artwork`;
      card.querySelector('.cc-age').textContent = age(token.seenAt);
      card.querySelector('.cc-name').innerHTML = `${safe(token.name, 'Untitled')} <small>$${safe(token.symbol, 'TOKEN')}</small>`;
      card.querySelector('.cc-mcv').textContent = `${Number(token.marketCapSol || 0).toFixed(2)} SOL`;
      card.querySelector('.cc-desc').textContent = safe(token.description, 'Live Pump.fun token creation event.');
      const pct = progress(token); const bar = card.querySelector('[role="progressbar"]'); if (bar) { bar.style.setProperty('--v', pct / 100); bar.setAttribute('aria-valuenow', pct); }
      const pctNode = card.querySelector('.cc-pct'); if (pctNode) pctNode.textContent = `${pct}%`;
    });
    const tiles = [...document.querySelectorAll('.trend .tile')];
    tiles.forEach((tile, index) => {
      const token = tokens[index]; tile.hidden = !token; tile.style.display = token ? '' : 'none'; if (!token) return;
      tile.href = href(token); tile.querySelector('.tile-img').src = image(token, index); tile.querySelector('.tile-img').alt = `$${safe(token.symbol)} token artwork`;
      tile.querySelector('.tile-name').textContent = safe(token.name, 'Untitled'); tile.querySelector('.tile-tick').textContent = `$${safe(token.symbol, 'TOKEN')}`;
      tile.querySelector('.tile-mc').textContent = `${Number(token.marketCapSol || 0).toFixed(2)} SOL`;
      const change = tile.querySelector('.chg'); if (change) change.textContent = 'LIVE';
    });
    if (board) {
      let state = board.querySelector('.om-live-state');
      if (!state) { state = document.createElement('span'); state.className = 'om-live-state'; board.querySelector('.board-head')?.appendChild(state); }
      state.textContent = tokens.length ? `● LIVE · ${tokens.length} RECENT PUMP.FUN LAUNCHES` : '● CONNECTING TO PUMP.FUN LIVE FEED';
    }
    const spot = document.querySelector('.lc-spot');
    if (spot) {
      const t = tokens[0]; spot.hidden = !t; spot.style.display = t ? '' : 'none';
      if (t) { spot.querySelector('img').src=image(t,0); spot.querySelector('.lc-spot-tick').textContent=`$${safe(t.symbol,'TOKEN')}`; spot.querySelector('.lc-spot-name').textContent=safe(t.name,'Untitled'); spot.querySelector('.lc-spot-foot b').textContent=`${Number(t.marketCapSol||0).toFixed(2)} SOL`; spot.querySelector('.lc-spot-cta a').href=href(t); }
    }
    document.querySelectorAll('.lc-grid .lc-card-link').forEach((card,index)=>{const t=tokens[index+1];card.hidden=!t;card.style.display=t?'':'none';if(!t)return;card.href=href(t);card.querySelector('img').src=image(t,index+1);card.querySelector('.lc-card-tick').textContent=`$${safe(t.symbol,'TOKEN')}`;card.querySelector('.lc-card-name').textContent=safe(t.name,'Untitled');card.querySelector('.lc-card-right b').textContent=`${Number(t.marketCapSol||0).toFixed(2)} SOL`;card.querySelector('.lc-card-right span').textContent=`${age(t.seenAt)} ago`;});
    document.querySelectorAll('.so-call').forEach((call,index)=>{const t=tokens[index];call.hidden=!t;call.style.display=t?'':'none';if(!t)return;const coin=call.querySelector('.so-coin');coin.href=href(t);coin.querySelector('img').src=image(t,index);coin.querySelector('b').textContent=safe(t.name,'Untitled');coin.querySelector('.mono.muted').textContent=`$${safe(t.symbol,'TOKEN')}`;call.querySelector('.so-addr').textContent=shortAddress(t.traderPublicKey);call.querySelector('.so-ago').textContent=`${age(t.seenAt)} ago`;call.querySelector('.so-text').textContent='New Pump.fun market detected on the live creation stream.';call.querySelectorAll('.so-score b').forEach(x=>x.textContent=`${Number(t.marketCapSol||0).toFixed(2)} SOL`);call.querySelector('.so-chg').textContent='LIVE';});
    document.querySelectorAll('.main table tbody tr').forEach((row,index)=>{const t=tokens[index];row.hidden=!t;row.style.display=t?'':'none';if(!t)return;const cells=row.querySelectorAll('td');if(cells.length<5)return;cells[0].innerHTML=`<a href="${href(t)}"><b>$${safe(t.symbol,'TOKEN')}</b></a>`;cells[1].textContent='Pump.fun market created';cells[2].textContent=shortAddress(t.traderPublicKey);cells[3].textContent=`${age(t.seenAt)} ago`;cells[4].innerHTML='<span class="chip chip-ok">live</span>';});
    const liveStats=document.querySelectorAll('.lc-stat b');if(liveStats.length){liveStats[0].textContent=tokens.length;liveStats[1].textContent=tokens.length;liveStats[2].textContent='LIVE';}
    const activityStats=document.querySelectorAll('.receipts-tot b');if(activityStats.length){activityStats[0].textContent=tokens.length;activityStats[1].textContent=tokens.length;activityStats[2].textContent='0';activityStats[3].textContent='0';}
    const homeProjectCount=document.querySelector('.hstats .hstat b');if(homeProjectCount)homeProjectCount.textContent=tokens.length;
  }

  const shortAddress = value => value ? `${value.slice(0,4)}…${value.slice(-4)}` : '—';

  async function hydrate(token) {
    if (!token.uri || token.metadataLoaded) return;
    try {
      const response = await fetch(token.uri); if (!response.ok) return;
      const meta = await response.json(); token.image = meta.image || token.image; token.description = meta.description || token.description; token.twitter = meta.twitter || ''; token.website = meta.website || ''; token.metadataLoaded = true;
      localStorage.setItem(KEY, JSON.stringify(tokens.slice(0, 12))); render();
    } catch {}
  }

  function add(event) {
    if (!event?.mint || event.txType !== 'create') return;
    const token = { ...event, seenAt: Date.now() };
    tokens = [token, ...tokens.filter(x => x.mint !== token.mint)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(tokens)); render(); hydrate(token);
  }

  render(); tokens.forEach(hydrate);
  let retry = 1000;
  function open() {
    const socket = new WebSocket('wss://pumpportal.fun/api/data');
    socket.onopen = () => { retry = 1000; socket.send(JSON.stringify({ method: 'subscribeNewToken' })); };
    socket.onmessage = message => { try { add(JSON.parse(message.data)); } catch {} };
    socket.onclose = () => { setTimeout(open, retry); retry = Math.min(retry * 2, 30000); };
    socket.onerror = () => socket.close();
  }
  open();
  document.querySelectorAll('.search input').forEach(input => input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase(); document.querySelectorAll('.boardsec .ccard').forEach(card => { if (!card.dataset.streamHidden) card.style.display = !q || card.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  }));
  setInterval(render, 10000);
})();
