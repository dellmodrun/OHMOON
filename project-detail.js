(() => {
  const root = document.querySelector('[data-project]'), canvas = document.querySelector('#pd-chart');
  if (!root || !canvas) return;
  const BASE = location.pathname.startsWith('/onemod') ? '/onemod' : '';
  const params = new URLSearchParams(location.search);
  const mint = params.get('mint') || root.dataset.mint || '';
  let token = null;
  try { token = JSON.parse(localStorage.getItem('onemod-live-projects-v1') || '[]').find(item => item.mint === mint) || null; } catch {}
  let ticker = token?.symbol || root.dataset.ticker || 'TOKEN';
  let side = 'buy', period = '5m', trades = [];
  const periodMs = { '1m':60000, '5m':300000, '15m':900000, '1h':3600000, '4h':14400000 };
  const fmt = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
  const short = value => value ? `${value.slice(0,4)}?${value.slice(-4)}` : '?';

  function hydrateIdentity() {
    if (!mint) return;
    const name = token?.name || 'Live Pump.fun token'; ticker = token?.symbol || ticker;
    root.dataset.ticker = ticker; root.dataset.mint = mint; document.title = `${name} ($${ticker}) - Onemod`;
    const title = document.querySelector('.pd-id h1'); if (title) title.innerHTML = `${name} <span class="pd-up">$${ticker}</span>`;
    const desc = document.querySelector('.pd-id p'); if (desc) desc.textContent = token?.description || `Live Pump.fun market ${mint}`;
    const profile = document.querySelector('.pd-profile p'); if (profile) profile.textContent = token?.description || `Live Pump.fun market ${mint}`;
    const art = document.querySelector('.pd-coin-mark img'); if (art && token?.image) art.src = token.image;
    const cap = document.querySelector('.pd-head-price b'); if (cap) cap.textContent = token?.marketCapSol ? `${Number(token.marketCapSol).toFixed(2)} SOL` : 'live';
    const change = document.querySelector('.pd-head-price div'); if (change) change.textContent = 'LIVE · Pump.fun';
    const pair = document.querySelector('.pd-chart-card h2'); if (pair) pair.textContent = `$${ticker} / SOL`;
    document.querySelectorAll('.pd-stat b').forEach((node, i) => { node.textContent = i === 0 && token?.marketCapSol ? `${Number(token.marketCapSol).toFixed(2)} SOL` : i === 3 && token ? `${Math.max(1, Math.round(((Number(token.vSolInBondingCurve || 30)-30)/55)*100))}%` : '?'; });
    document.querySelector('.pd-table tbody')?.replaceChildren();
    const owner = document.querySelector('.pd-profile-row:last-child b'); if (owner) owner.textContent = short(token?.traderPublicKey);
  }

  function candles() {
    const width = periodMs[period], buckets = new Map();
    trades.forEach(trade => { const time = Number(trade.timestamp || Date.now()); const key = Math.floor(time / width) * width; const price = Number(trade.price || (trade.solAmount && trade.tokenAmount ? trade.solAmount / trade.tokenAmount : 0)); if (!price) return; const item = buckets.get(key) || { time:key, open:price, high:price, low:price, close:price, volume:0 }; item.high=Math.max(item.high,price); item.low=Math.min(item.low,price); item.close=price; item.volume += Number(trade.solAmount || 0); buckets.set(key,item); });
    return [...buckets.values()].sort((a,b)=>a.time-b.time).slice(-80);
  }

  function draw() {
    const ratio=window.devicePixelRatio||1, rect=canvas.getBoundingClientRect(); canvas.width=Math.round(rect.width*ratio); canvas.height=Math.round(rect.height*ratio);
    const ctx=canvas.getContext('2d'); ctx.scale(ratio,ratio); const w=rect.width,h=rect.height,pad={l:16,r:68,t:46,b:52}; ctx.clearRect(0,0,w,h);
    const data=candles();
    ctx.strokeStyle='#ded7c4';ctx.lineWidth=1; for(let i=0;i<=5;i++){const yy=pad.t+(h-pad.t-pad.b)*i/5;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();}
    if(!data.length){ctx.fillStyle='#858075';ctx.font='12px IBM Plex Mono, monospace';ctx.fillText(mint?'WAITING FOR LIVE ON-CHAIN TRADES':'NO MARKET MINT LINKED',pad.l+12,pad.t+28);return;}
    const high=Math.max(...data.map(c=>c.high)),low=Math.min(...data.map(c=>c.low)),span=Math.max(high-low,high*.002),chartH=h-pad.t-pad.b,y=v=>pad.t+(high-v)/span*chartH,step=(w-pad.l-pad.r)/data.length,body=Math.max(3,step*.56);
    ctx.font='10px IBM Plex Mono, monospace';ctx.fillStyle='#858075'; for(let i=0;i<=5;i++){const v=high-span*i/5;ctx.fillText(v.toExponential(3),w-pad.r+7,pad.t+chartH*i/5+3);}
    data.forEach((c,i)=>{const x=pad.l+i*step+step/2,up=c.close>=c.open;ctx.strokeStyle=ctx.fillStyle=up?'#1c9d79':'#d65f55';ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();const top=y(Math.max(c.open,c.close)),bottom=y(Math.min(c.open,c.close));ctx.fillRect(x-body/2,top,body,Math.max(2,bottom-top));});
    const last=data[data.length-1],meta=document.querySelector('.pd-chart-meta'); if(meta)meta.innerHTML=`<span>O <b>${last.open.toExponential(4)}</b></span><span>H <b>${last.high.toExponential(4)}</b></span><span>L <b>${last.low.toExponential(4)}</b></span><span>C <b>${last.close.toExponential(4)}</b></span>`;
  }

  function addTrade(event) {
    if (!event || event.mint !== mint || !['buy','sell'].includes(event.txType)) return;
    const sol=Number(event.solAmount||0),amount=Number(event.tokenAmount||0); trades.push({...event,timestamp:Date.now(),price:sol&&amount?sol/amount:0}); trades=trades.slice(-500); draw();
    const body=document.querySelector('.pd-table tbody'); if(body){const row=document.createElement('tr');row.innerHTML=`<td class="${event.txType==='buy'?'pd-up':'pd-down'}">${event.txType}</td><td>${fmt(sol)} SOL</td><td>${fmt(amount)} $${ticker}</td><td>now</td><td>${short(event.traderPublicKey)}</td>`;body.prepend(row);while(body.children.length>12)body.lastElementChild.remove();}
    const cap=document.querySelector('.pd-head-price b'); if(cap&&event.marketCapSol)cap.textContent=`${Number(event.marketCapSol).toFixed(2)} SOL`;
  }

  function stream() {
    if(!mint)return; const socket=new WebSocket('wss://pumpportal.fun/api/data');
    socket.onopen=()=>socket.send(JSON.stringify({method:'subscribeTokenTrade',keys:[mint]}));
    socket.onmessage=message=>{try{addTrade(JSON.parse(message.data))}catch{}}; socket.onerror=()=>socket.close(); socket.onclose=()=>setTimeout(stream,3000);
  }

  document.querySelectorAll('.pd-periods button').forEach(btn=>btn.addEventListener('click',()=>{period=btn.dataset.period;document.querySelectorAll('.pd-periods button').forEach(x=>x.classList.toggle('on',x===btn));draw()}));
  const amount=document.querySelector('.pd-amount input'),unit=document.querySelector('.pd-amount b'),wallet=document.querySelector('.pd-wallet'),note=document.querySelector('.pd-trade-note');
  function updateTradeButton(){if(!mint){wallet.textContent='Market not linked';wallet.disabled=true;return}wallet.disabled=false;wallet.textContent=window.OnemodWallet?.state.address?`${side==='buy'?'Buy':'Sell'} $${ticker}`:'Connect wallet';}
  document.querySelectorAll('.pd-tabs button').forEach(btn=>btn.addEventListener('click',()=>{side=btn.dataset.side;document.querySelectorAll('.pd-tabs button').forEach(x=>x.classList.toggle('on',x===btn));unit.textContent=side==='buy'?'SOL':'%';amount.placeholder=side==='buy'?'0.00':'0?100';document.querySelectorAll('.pd-quick button').forEach((x,i)=>{const values=side==='buy'?['0.1','0.5','1','2']:['25','50','75','100'];x.dataset.amount=values[i];x.textContent=values[i]+(side==='sell'?'%':i===3?' SOL':'')});updateTradeButton()}));
  document.querySelectorAll('.pd-quick button').forEach(btn=>btn.addEventListener('click',()=>amount.value=btn.dataset.amount));
  wallet.addEventListener('click',async()=>{try{if(!window.OnemodWallet.state.address){await window.OnemodWallet.connect();updateTradeButton();return}wallet.disabled=true;wallet.textContent='Building transaction?';const value=amount.value;const signature=await window.OnemodWallet.trade({mint,action:side,amount:side==='sell'?`${value}%`:value,denominatedInSol:side==='buy'});note.innerHTML=`Submitted ? <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noreferrer">view on Solscan</a>`;wallet.textContent='Transaction submitted';}catch(error){note.textContent=error.message||'Transaction was not submitted.';updateTradeButton()}finally{wallet.disabled=false}});
  window.addEventListener('onemod:wallet',updateTradeButton); new ResizeObserver(draw).observe(canvas); hydrateIdentity();updateTradeButton();draw();stream();
})();
