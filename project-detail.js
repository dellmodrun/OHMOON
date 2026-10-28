(() => {
  const root = document.querySelector('[data-project]'), canvas = document.querySelector('#pd-chart');
  if (!root || !canvas) return;
  const BASE = ['/onemod', '/OHMOON'].find(base => location.pathname === base || location.pathname.startsWith(`${base}/`)) || '';
  const params = new URLSearchParams(location.search);
  const mint = params.get('mint') || root.dataset.mint || '';
  if (!mint) { location.replace(`${BASE}/`); return; }
  let token = null;
  try { token = JSON.parse(localStorage.getItem('onemod-live-projects-v2') || localStorage.getItem('onemod-live-projects-v1') || '[]').find(item => item.mint === mint) || null; } catch {}
  let ticker = token?.symbol || root.dataset.ticker || 'TOKEN';
  let side = 'buy', period = '5m', trades = [], history = [], poolAddress = '', chartState = 'LOADING MARKET HISTORY';
  let solUsd = Number(sessionStorage.getItem('onemod-sol-usd') || 0);
  const chartCache = new Map();
  const periodMs = { '1m':60000, '5m':300000, '15m':900000, '1h':3600000, '4h':14400000 };
  const fmt = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
  const short = value => value ? `${value.slice(0,4)}...${value.slice(-4)}` : 'unknown';
  const money = value => { const amount = Number(value); return Number.isFinite(amount) && amount > 0 ? amount.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:amount >= 100 ? 0 : 2}) : 'loading'; };
  const marketCapUsd = () => { const stored = Number(token?.marketCapUsd || 0); if (stored > 0) return stored; const curve = Number(token?.marketCapSol || 0); return curve > 0 && solUsd > 0 ? curve * solUsd : 0; };
  const tokenImage = () => token?.localImage ? `${BASE}/${String(token.localImage).replace(/^\/+/, '')}` : token?.marketImage || token?.image || `${BASE}/assets/projects/token-placeholder.svg`;
  async function cachedJson(key,url,ttl=60000){let cached=null;try{cached=JSON.parse(localStorage.getItem(`onemod-cache:${key}`)||'null');if(cached&&Date.now()-cached.savedAt<ttl)return cached.data;}catch{}try{const response=await fetch(url,{headers:{Accept:'application/json;version=20230203'}});if(!response.ok)throw new Error(`${response.status}`);const data=await response.json();try{localStorage.setItem(`onemod-cache:${key}`,JSON.stringify({savedAt:Date.now(),data}));}catch{}return data;}catch(error){if(cached?.data)return cached.data;throw error;}}

  function hydrateIdentity() {
    if (!mint) return;
    const name = token?.name || 'Live Pump.fun token'; ticker = token?.symbol || ticker;
    root.dataset.ticker = ticker; root.dataset.mint = mint; document.title = `${name} ($${ticker}) - Onemod`;
    const title = document.querySelector('.pd-id h1'); if (title) title.innerHTML = `${name} <span class="pd-up">$${ticker}</span>`;
    const desc = document.querySelector('.pd-id p'); if (desc) desc.textContent = token?.description || `Live Pump.fun market ${mint}`;
    const profile = document.querySelector('.pd-profile p'); if (profile) profile.textContent = token?.description || `Live Pump.fun market ${mint}`;
    const art = document.querySelector('.pd-coin-mark img'); if (art) { art.onerror = () => { art.onerror = null; art.src = `${BASE}/assets/projects/token-placeholder.svg`; }; art.src = tokenImage(); art.alt = `${ticker} token artwork`; }
    const cap = document.querySelector('.pd-head-price b'); if (cap && !poolAddress) cap.textContent = money(marketCapUsd());
    const change = document.querySelector('.pd-head-price div'); if (change && !poolAddress) change.textContent = 'LIVE | Pump.fun';
    const pair = document.querySelector('.pd-chart-card h2'); if (pair) pair.textContent = `$${ticker} / SOL${poolAddress?' · GeckoTerminal':''}`;
    if(!poolAddress)document.querySelectorAll('.pd-stat b').forEach((node, i) => { node.textContent = i === 0 ? money(marketCapUsd()) : i === 1 && token ? money(token.volumeUsd24h) : i === 3 && token ? `${Math.max(0, Math.round(((Number(token.vSolInBondingCurve || 30)-30)/55)*100))}%` : 'pending'; });
    document.querySelector('.pd-table tbody')?.replaceChildren();
    const owner = document.querySelector('.pd-profile-row:last-child b'); if (owner) owner.textContent = short(token?.traderPublicKey);
    const tags = document.querySelector('.pd-tags');
    if (tags && !tags.querySelector('.pd-market-link')) { const link = document.createElement('a'); link.className = 'pd-tag pd-market-link'; link.href = `https://pump.fun/coin/${mint}`; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'open on Pump.fun'; tags.appendChild(link); }
  }

  function candles() {
    const width = periodMs[period], buckets = new Map(history.map(item => [item.time, { ...item }]));
    trades.forEach(trade => { const time = Number(trade.timestamp || Date.now()); const key = Math.floor(time / width) * width; const price = Number(trade.price || (trade.solAmount && trade.tokenAmount ? trade.solAmount / trade.tokenAmount : 0)); if (!price) return; const item = buckets.get(key) || { time:key, open:price, high:price, low:price, close:price, volume:0 }; item.high=Math.max(item.high,price); item.low=Math.min(item.low,price); item.close=price; item.volume += Number(trade.solAmount || 0); buckets.set(key,item); });
    return [...buckets.values()].sort((a,b)=>a.time-b.time).slice(-100);
  }

  function draw() {
    const ratio=window.devicePixelRatio||1, rect=canvas.getBoundingClientRect(); canvas.width=Math.round(rect.width*ratio); canvas.height=Math.round(rect.height*ratio);
    const ctx=canvas.getContext('2d'); ctx.scale(ratio,ratio); const w=rect.width,h=rect.height,pad={l:16,r:76,t:46,b:94}; ctx.clearRect(0,0,w,h);
    const data=candles();
    ctx.strokeStyle='#ded7c4';ctx.lineWidth=1; for(let i=0;i<=5;i++){const yy=pad.t+(h-pad.t-pad.b)*i/5;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();}
    if(!data.length){ctx.fillStyle='#858075';ctx.font='12px IBM Plex Mono, monospace';ctx.fillText(mint?chartState:'NO MARKET MINT LINKED',pad.l+12,pad.t+28);return;}
    const high=Math.max(...data.map(c=>c.high)),low=Math.min(...data.map(c=>c.low)),span=Math.max(high-low,high*.002),chartH=h-pad.t-pad.b,y=v=>pad.t+(high-v)/span*chartH,step=(w-pad.l-pad.r)/data.length,body=Math.max(3,step*.56);
    ctx.font='10px IBM Plex Mono, monospace';ctx.fillStyle='#858075'; for(let i=0;i<=5;i++){const v=high-span*i/5;ctx.fillText(v.toExponential(3),w-pad.r+7,pad.t+chartH*i/5+3);}
    data.forEach((c,i)=>{const x=pad.l+i*step+step/2,up=c.close>=c.open;ctx.strokeStyle=ctx.fillStyle=up?'#1c9d79':'#d65f55';ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();const top=y(Math.max(c.open,c.close)),bottom=y(Math.min(c.open,c.close));ctx.fillRect(x-body/2,top,body,Math.max(2,bottom-top));});
    const maxVolume=Math.max(...data.map(c=>Number(c.volume||0)),1e-12),volumeTop=h-70,volumeBase=h-34;
    data.forEach((c,i)=>{const x=pad.l+i*step+step/2,up=c.close>=c.open,height=Math.max(1,Number(c.volume||0)/maxVolume*(volumeBase-volumeTop));ctx.globalAlpha=.4;ctx.fillStyle=up?'#1c9d79':'#d65f55';ctx.fillRect(x-body/2,volumeBase-height,body,height);ctx.globalAlpha=1;});
    const labelIndexes=[0,Math.floor((data.length-1)/3),Math.floor((data.length-1)*2/3),data.length-1];ctx.fillStyle='#858075';ctx.textAlign='center';labelIndexes.forEach(index=>{const item=data[index];if(!item)return;const stamp=new Date(item.time);ctx.fillText(period==='1h'||period==='4h'?stamp.toLocaleDateString([], {month:'short',day:'numeric'}):stamp.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),pad.l+index*step+step/2,h-14);});ctx.textAlign='left';
    const last=data[data.length-1],meta=document.querySelector('.pd-chart-meta'); if(meta)meta.innerHTML=`<span>O <b>${last.open.toExponential(4)}</b></span><span>H <b>${last.high.toExponential(4)}</b></span><span>L <b>${last.low.toExponential(4)}</b></span><span>C <b>${last.close.toExponential(4)}</b></span><span>VOL <b>${fmt(last.volume)} SOL</b></span>`;
  }

  async function loadTokenIdentity() {
    try {
      const response = await fetch(`${BASE}/feed/live-projects.json?ts=${Math.floor(Date.now()/300000)}`); const items = response.ok ? await response.json() : [];
      const shared = Array.isArray(items) ? items.find(item => item.mint === mint) : null; if (shared) { token = { ...(token || {}), ...shared }; try { const saved = JSON.parse(localStorage.getItem('onemod-live-projects-v2') || '[]').filter(item => item?.mint !== mint); localStorage.setItem('onemod-live-projects-v2', JSON.stringify([token, ...saved].slice(0, 40))); } catch {} }
      hydrateIdentity();
      if (token?.uri && !token.metadataLoaded) {
        const cid = String(token.uri).match(/(?:ipfs:\/\/|\/ipfs\/)([^?#]+)/)?.[1], uri = cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : token.uri;
        const metadataResponse = await fetch(uri,{signal:AbortSignal.timeout(3500)}); if (metadataResponse.ok) { const meta = await metadataResponse.json(); const imageCid = String(meta.image || '').match(/(?:ipfs:\/\/|\/ipfs\/)([^?#]+)/)?.[1]; token = { ...token, description:meta.description || token.description, image:imageCid ? `https://gateway.pinata.cloud/ipfs/${imageCid}` : (meta.image || token.image), metadataLoaded:true }; hydrateIdentity(); }
      }
    } catch {}
    try {
      const info=(await cachedJson(`info:${mint}`,`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/info`,300000)).data?.attributes;if(info)token={name:info.name,symbol:info.symbol,description:info.description,image:info.image_url,holderCount:info.holders?.count,graduation:info.launchpad_details?.graduation_percentage,...(token||{})};
    } catch {}
    hydrateIdentity();
  }

  async function loadSolPrice() {
    if (solUsd > 0) return solUsd;
    try {
      const solMint = 'So11111111111111111111111111111111111111112';
      const response = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${solMint}`);
      const payload = response.ok ? await response.json() : null;
      const value = Number(payload?.data?.attributes?.token_prices?.[solMint] || 0);
      if (value > 0) { solUsd = value; sessionStorage.setItem('onemod-sol-usd', String(value)); hydrateIdentity(); }
    } catch {}
    return solUsd;
  }
  async function loadPool() {
    try {
      const payload = await cachedJson(`pools:${mint}`,`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/pools`,60000), pools = payload.data || [], selected = pools.find(item => item.relationships?.dex?.data?.id === 'pump-fun') || pools[0]; if (!selected) throw new Error('market pool not indexed yet');
      poolAddress = selected.attributes.address; const market = selected.attributes;
      const liveCap = Number(market.market_cap_usd || market.fdv_usd || 0); if (liveCap > 0) token = { ...(token || {}), marketCapUsd:liveCap, marketSource:'market' };
      const cap = document.querySelector('.pd-head-price b'); if (cap) cap.textContent = money(marketCapUsd());
      const change = document.querySelector('.pd-head-price div'), pct = Number(market.price_change_percentage?.h24 || 0); if (change) { change.textContent = `${pct>=0?'+':''}${pct.toFixed(2)}% · 24H`; change.className = pct >= 0 ? 'pd-up' : 'pd-down'; }
      const stats = document.querySelectorAll('.pd-stat b'); if (stats.length) { stats[0].textContent=money(marketCapUsd()); stats[1].textContent=money(market.volume_usd?.h24 || token?.volumeUsd24h); stats[2].textContent=token?.holderCount == null ? 'on-chain' : Number(token.holderCount).toLocaleString(); stats[3].textContent=token?.graduation != null ? `${Math.max(0,Number(token.graduation)).toFixed(1)}%` : token ? `${Math.max(0,Math.round(((Number(token.vSolInBondingCurve||30)-30)/55)*100))}%` : 'pending'; }
      const pair = document.querySelector('.pd-chart-card h2'); if (pair) pair.textContent = `$${ticker} / SOL · GeckoTerminal`;
      await Promise.all([loadHistory(period), loadRecentTrades()]);
    } catch (error) { chartState = String(error.message || 'MARKET HISTORY UNAVAILABLE').toUpperCase(); draw(); }
  }

  async function loadRecentTrades() {
    const body=document.querySelector('.pd-table tbody'); if(!body||!poolAddress)return;
    try {
      const payload=await cachedJson(`trades:${poolAddress}`,`https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/trades`,30000);
      body.replaceChildren(); (payload.data||[]).slice(0,12).forEach(item=>{const trade=item.attributes||{},buy=trade.kind==='buy',sol=Number(buy?trade.from_token_amount:trade.to_token_amount),tokens=Number(buy?trade.to_token_amount:trade.from_token_amount),row=document.createElement('tr'),stamp=new Date(trade.block_timestamp);row.innerHTML=`<td class="${buy?'pd-up':'pd-down'}">${buy?'buy':'sell'}</td><td>${fmt(sol)} SOL</td><td>${fmt(tokens)} $${ticker}</td><td>${stamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td><td><a href="https://solscan.io/tx/${trade.tx_hash}" target="_blank" rel="noreferrer">${short(trade.tx_from_address)}</a></td>`;body.appendChild(row);});
    } catch {}
  }

  async function loadHistory(nextPeriod) {
    period = nextPeriod; if (!poolAddress) return;
    if (chartCache.has(period)) { history=chartCache.get(period); chartState=''; draw(); return; }
    chartState='LOADING MARKET HISTORY'; history=[]; draw();
    const config = { '1m':['minute',1], '5m':['minute',5], '15m':['minute',15], '1h':['hour',1], '4h':['hour',4] }[period];
    try {
      const url=`https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${config[0]}?aggregate=${config[1]}&limit=100&currency=token&token=base`;
      const payload=await cachedJson(`ohlcv:${poolAddress}:${period}`,url,30000);
      history=(payload.data?.attributes?.ohlcv_list||[]).map(row=>({time:Number(row[0])*1000,open:Number(row[1]),high:Number(row[2]),low:Number(row[3]),close:Number(row[4]),volume:Number(row[5])})).sort((a,b)=>a.time-b.time); chartCache.set(period,history); chartState=history.length?'':'NO HISTORICAL TRADES YET'; draw();
    } catch(error){chartState=String(error.message||'MARKET HISTORY UNAVAILABLE').toUpperCase();draw();}
  }

  function addTrade(event) {
    if (!event || event.mint !== mint || !['buy','sell'].includes(event.txType)) return;
    const sol=Number(event.solAmount||0),amount=Number(event.tokenAmount||0); trades.push({...event,timestamp:Date.now(),price:sol&&amount?sol/amount:0}); trades=trades.slice(-500); draw();
    const body=document.querySelector('.pd-table tbody'); if(body){const row=document.createElement('tr');row.innerHTML=`<td class="${event.txType==='buy'?'pd-up':'pd-down'}">${event.txType}</td><td>${fmt(sol)} SOL</td><td>${fmt(amount)} $${ticker}</td><td>now</td><td>${short(event.traderPublicKey)}</td>`;body.prepend(row);while(body.children.length>12)body.lastElementChild.remove();}
    if(event.marketCapSol) { token = { ...(token || {}), marketCapSol:Number(event.marketCapSol), marketCapUsd:solUsd > 0 ? Number(event.marketCapSol) * solUsd : token?.marketCapUsd }; const cap=document.querySelector('.pd-head-price b'); if(cap)cap.textContent=money(marketCapUsd()); const stat=document.querySelector('.pd-stat b'); if(stat)stat.textContent=money(marketCapUsd()); }
  }

  function curveStream(endpointIndex = 0) {
    const endpoints = ['wss://solana-rpc.publicnode.com', 'wss://api.mainnet-beta.solana.com'];
    let curve, socket, previous = null, intentional = false;
    try {
      const program = new solanaWeb3.PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
      [curve] = solanaWeb3.PublicKey.findProgramAddressSync([new TextEncoder().encode('bonding-curve'), new solanaWeb3.PublicKey(mint).toBytes()], program);
      socket = new WebSocket(endpoints[endpointIndex % endpoints.length]);
    } catch { return; }
    const readU64 = (view, offset) => view.getBigUint64(offset, true);
    const handleEncoded = encoded => {
      if (!encoded) return;
      const binary = atob(encoded), bytes = Uint8Array.from(binary, char => char.charCodeAt(0)); if (bytes.length < 49) return;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), current = { vToken:readU64(view,8), vSol:readU64(view,16), realToken:readU64(view,24), realSol:readU64(view,32), supply:readU64(view,40), complete:Boolean(bytes[48]) };
      const price = Number(current.vSol) / Number(current.vToken) * 0.001;
      if (!previous) { trades.push({ timestamp:Date.now(), price, solAmount:0, tokenAmount:0 }); draw(); }
      else if (current.vSol !== previous.vSol) {
        const buying = current.vSol > previous.vSol, solAmount = Math.abs(Number(current.realSol - previous.realSol)) / 1e9, tokenAmount = Math.abs(Number(current.realToken - previous.realToken)) / 1e6;
        addTrade({ mint, txType:buying?'buy':'sell', solAmount, tokenAmount, price, marketCapSol:price * Number(current.supply) / 1e6, traderPublicKey:'' });
      }
      previous = current;
      const streamTag = document.querySelector('.pd-table .pd-tag'); if (streamTag) streamTag.textContent = current.complete ? 'curve migrated' : 'on-chain curve';
    };
    socket.onopen = async () => {
      socket.send(JSON.stringify({ jsonrpc:'2.0', id:1, method:'accountSubscribe', params:[curve.toBase58(), { encoding:'base64', commitment:'confirmed' }] }));
      try { const result = await OnemodWallet.rpc('getAccountInfo', [curve.toBase58(), { encoding:'base64', commitment:'confirmed' }]); handleEncoded(result?.value?.data?.[0]); } catch {}
    };
    socket.onmessage = message => { try { handleEncoded(JSON.parse(message.data)?.params?.result?.value?.data?.[0]); } catch {} };
    socket.onerror = () => socket.close();
    socket.onclose = () => { if (!intentional) setTimeout(() => curveStream(endpointIndex + 1), 2500); };
    window.addEventListener('beforeunload', () => { intentional = true; socket.close(); }, { once:true });
  }

  document.querySelectorAll('.pd-periods button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.pd-periods button').forEach(x=>x.classList.toggle('on',x===btn));loadHistory(btn.dataset.period)}));
  const amount=document.querySelector('.pd-amount input'),unit=document.querySelector('.pd-amount b'),wallet=document.querySelector('.pd-wallet'),note=document.querySelector('.pd-trade-note');
  const settings=document.createElement('div'); settings.className='pd-trade-settings'; settings.innerHTML='<label>slippage <span><input name="slippage" type="number" min="1" max="50" step="1" value="10">%</span></label><label>priority fee <span><input name="priorityFee" type="number" min="0" step="0.00001" value="0.00005">SOL</span></label>';
  document.querySelector('.pd-quick')?.after(settings);
  const slippage=settings.querySelector('[name="slippage"]'),priorityFee=settings.querySelector('[name="priorityFee"]');
  const balanceNode=document.querySelector('.pd-balance span:last-child');
  function updateTradeButton(){
    const walletState=window.OnemodWallet?.state;
    if(balanceNode) balanceNode.textContent=walletState?.address ? `balance ${walletState.balance == null ? 'loading' : walletState.balance.toFixed(4)} SOL` : 'wallet not connected';
    if(!mint){wallet.textContent='Market not linked';wallet.disabled=true;return;}
    wallet.disabled=false;wallet.textContent=walletState?.address?`${side==='buy'?'Buy':'Sell'} $${ticker}`:'Connect wallet';
  }
  document.querySelectorAll('.pd-tabs button').forEach(btn=>btn.addEventListener('click',()=>{side=btn.dataset.side;document.querySelectorAll('.pd-tabs button').forEach(x=>x.classList.toggle('on',x===btn));unit.textContent=side==='buy'?'SOL':'%';amount.placeholder=side==='buy'?'0.00':'0-100';document.querySelectorAll('.pd-quick button').forEach((x,i)=>{const values=side==='buy'?['0.1','0.5','1','2']:['25','50','75','100'];x.dataset.amount=values[i];x.textContent=values[i]+(side==='sell'?'%':i===3?' SOL':'')});updateTradeButton();}));
  document.querySelectorAll('.pd-quick button').forEach(btn=>btn.addEventListener('click',()=>amount.value=btn.dataset.amount));
  wallet.addEventListener('click',async()=>{
    try{
      if(!window.OnemodWallet.state.address){await window.OnemodWallet.connect();updateTradeButton();return;}
      const value=Number(amount.value),slip=Number(slippage.value),fee=Number(priorityFee.value);
      if(!(value>0)) throw new Error('Enter an amount greater than zero.');
      if(side==='sell' && value>100) throw new Error('Sell percentage cannot exceed 100%.');
      if(!(slip>=1&&slip<=50)) throw new Error('Slippage must be between 1% and 50%.');
      if(!(fee>=0)) throw new Error('Priority fee cannot be negative.');
      wallet.disabled=true;wallet.textContent='Building transaction...';
      note.textContent=`Review: ${side.toUpperCase()} ${side==='buy'?value+' SOL':value+'%'} of $${ticker}, ${slip}% max slippage, ${fee} SOL priority fee.`;
      const signature=await window.OnemodWallet.trade({mint,action:side,amount:side==='sell'?`${value}%`:value,denominatedInSol:side==='buy',slippage:slip,priorityFee:fee});
      note.innerHTML=`Submitted | <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noreferrer">view on Solscan</a>`;wallet.textContent='Transaction submitted';
    }catch(error){note.textContent=error.message||'Transaction was not submitted.';updateTradeButton();}finally{wallet.disabled=false;}
  });
  window.addEventListener('onemod:wallet',updateTradeButton); new ResizeObserver(draw).observe(canvas); hydrateIdentity();updateTradeButton();draw();loadSolPrice();loadTokenIdentity();loadPool();curveStream();
})();
