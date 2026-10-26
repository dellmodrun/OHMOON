(()=>{
const BASE=location.pathname==='/onemod'||location.pathname.startsWith('/onemod/')?'/onemod':'';
const LOGO=BASE+'/assets/onemod-logo-transparent.png';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const txt=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v};
const html=(el,v)=>{if(el&&el.innerHTML!==v)el.innerHTML=v};
const directP=(el)=>el?[...el.children].find(x=>x.tagName==='P'):null;
const projects=['Terminal Zero','Soft Fork','Open Curve','Signal Room','Mint Condition','Proof Mode','Ghost Relay','Public Memory','Curve Native','First Block','Origin Point','Fair Queue','Open Circuit','No Privilege','Genesis Log','Equal Entry','Module One','Clear Start','Market Native','Commit Layer','Route Zero','Public Receipt','Open Manifest','Curve Signal'];
let lock=false;
function common(){
 document.documentElement.dataset.brand='onemod';
 if(document.title!=='Onemod — One market. Better genesis.')document.title='Onemod — One market. Better genesis.';
 $$('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(x=>{if(!x.dataset.onemod)x.remove()});
 if(!$('link[data-onemod="favicon"]')){const l=document.createElement('link');l.rel='icon';l.type='image/png';l.sizes='64x64';l.href=BASE+'/assets/onemod-favicon.png?v=4';l.dataset.onemod='favicon';document.head.appendChild(l)}
 if(!$('link[data-onemod="apple"]')){const l=document.createElement('link');l.rel='apple-touch-icon';l.sizes='180x180';l.href=BASE+'/brand/app-apple-180.png?v=4';l.dataset.onemod='apple';document.head.appendChild(l)}
 const md=$('meta[name="description"]'); if(md)md.content='Onemod is a modular genesis layer for tokens launching into Pump.fun.';
 $$('img').forEach(img=>{const src=img.getAttribute('src')||'';if(src.includes('/brand/mark-')||src.includes('/brand/app-')||src.includes('/mascot/pose-')){img.src=LOGO;img.alt='Onemod'}});
 $$('.brand,.brand-m').forEach(a=>{if(!a.querySelector('.onemod-word'))a.innerHTML=`<img class="mark" src="${LOGO}" alt="Onemod"><span class="onemod-word">onemod</span>`});
 $$('.tn-brand').forEach(a=>{if(!a.querySelector('.onemod-word'))a.innerHTML=`<img class="mark" src="${LOGO}" alt="Onemod"><span class="onemod-word">onemod</span>`});
 $$('.wchip-ph,.wtab').forEach(slot=>{if(!slot.querySelector('.wchip-cta'))slot.innerHTML='<button type="button" class="wchip-cta">Connect wallet</button>'});
 $$('.lbox,.lookswitch,.lchy-fab').forEach(x=>x.remove());
 $$('.search').forEach(box=>{if(!box.textContent.trim())box.innerHTML='<span class="om-network"><i></i>PUMP MAINNET / GENESIS ROUTER READY</span>'});
 const nav={'/':'launch board','/live':'live launches','/calls':'signals','/burns':'receipts','/launch':'configure','/how':'protocol'};
 $$('a[href]').forEach(a=>{const raw=a.getAttribute('href');const h=raw?.startsWith('/onemod')?raw.slice('/onemod'.length)||'/':raw;if(nav[h]&&(a.matches('.sidelink,.topnav a,.mobilebar a')||a.closest('nav')))txt(a,nav[h]);});
 $$('a.btn,button.btn').forEach(el=>{if(/create (a )?coin|wallet to launch/i.test(el.textContent))txt(el,el.tagName==='A'?'configure launch':'Connect wallet')});
 $$('.xlink').forEach(a=>a.remove());
 $$('footer').forEach(f=>{const next=f.innerHTML.replace(/launch/gi,'Onemod').replace(/Raydium, StonkFun or pump\.fun/gi,'Pump.fun');if(next!==f.innerHTML)f.innerHTML=next});
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const nodes=[];while(n=walker.nextNode())nodes.push(n);
 nodes.forEach(node=>{if(node.parentElement?.closest('script,style'))return;let v=node.nodeValue;v=v.replace(/\$LAUNCH\b/g,'$ONEMOD').replace(/\bLAUNCH\b/g,'ONEMOD').replace(/\bLaunch\b/g,'Onemod');if(v!==node.nodeValue)node.nodeValue=v});
 $$('.lart-bubble').forEach(x=>txt(x,'configure the genesis. keep the market.'));
}
function home(){
 if(!$('.hero-copy')){const main=$('main.main');if(!main)return;main.innerHTML=`<div class="om-home"><section class="hero om-home-hero"><div class="hero-copy"><h1></h1><p class="hero-line"></p><div class="hero-cta"><a class="btn btn-big" href="${BASE}/launch">configure a launch</a><a class="btn btn-ghost" href="${BASE}/how">read the protocol</a></div><div class="om-hero-stats"><div class="hstat"><div></div><div></div></div><div class="hstat"><div></div><div></div></div><div class="hstat"><div></div><div></div></div></div></div><div class="om-machine"><div class="om-machine-grid"></div><img src="${LOGO}" alt="Onemod"><div class="om-node n1"><i>01</i><b>MANIFEST</b></div><div class="om-node n2"><i>02</i><b>WALLET SIGN</b></div><div class="om-node n3"><i>03</i><b>PUMP CURVE</b></div><span class="om-orbit"></span><p>GENESIS ROUTER / MAINNET</p></div></section><section class="trend"></section><section class="om-flow"><div class="sec-head"><h2>from manifest to market</h2><span class="muted small">one transaction path</span></div><div class="om-flow-grid"><article><i>01</i><h3>Configure</h3><p>Set token metadata and inspect the exact genesis constraints before connecting a wallet.</p></article><article><i>02</i><h3>Sign</h3><p>Your wallet signs the official Pump create transaction. The creator private key never leaves the wallet.</p></article><article><i>03</i><h3>Verify</h3><p>Onemod checks the confirmed transaction against the Pump program before it enters the public board.</p></article></div></section><section class="boardsec"><div class="board-head"><h2>the launch board</h2><span class="muted small">verified Pump transactions only</span></div><div class="grid"></div></section></div>`}
 const hero=$('.hero-copy'); if(!hero)return;
 if(!$('.onemod-kicker',hero)){const k=document.createElement('span');k.className='onemod-kicker';k.textContent='modular genesis layer · pump.fun native';hero.prepend(k)}
 const h=$('.hero h1');if(h&&h.dataset.onemodHero!=='1'){h.dataset.onemodHero='1';h.setAttribute('aria-label','one market. better genesis.');h.innerHTML='<span class="h-word" aria-hidden="true">one</span><span class="h-word" aria-hidden="true">market.</span><span class="h-word h-pop" aria-hidden="true">better<svg class="h-squiggle" viewBox="0 0 300 30" preserveAspectRatio="none"><path pathLength="1" d="M4 18 C 40 4,70 28,108 14 S176 4,214 18 S268 26,296 10"/></svg></span><span class="h-word" aria-hidden="true">genesis.</span>'}
 txt($('.hero-line'),'Onemod adds configurable genesis rules before a token enters Pump.fun. Creators commit the launch manifest, block-zero privileges are removed, and every decision becomes a public receipt. The curve, liquidity and distribution stay where the market already is.');
 const stickers=$$('.sticker');['Pump.fun native','committed manifest','no creator bundle','public genesis receipt','modular fee routing'].forEach((v,i)=>{if(stickers[i]){const icon=stickers[i].querySelector('svg')?.outerHTML||'';html(stickers[i],icon+v)}});
 const ctas=$$('.hero-cta .btn');if(ctas[0])txt(ctas[0],'configure a launch');if(ctas[1])txt(ctas[1],'read the protocol');
 const stats=$$('.hstat');[['1','official execution route'],['0','creator buys attached'],['100%','wallet signed']].forEach((v,i)=>{const d=stats[i]?.querySelector('div:last-child');if(d)html(d,`<b${i===1?' class="pos"':''}>${v[0]}</b><span>${v[1]}</span>`)});
 txt($('.hp-say'),'one market. better genesis mechanics.');
 const ticket=$('.hp-ticket');if(ticket){ticket.href=BASE+'/how';html(ticket,'<span class="hp-tk-top">genesis module</span><span class="hp-tk-main"><b>Origin</b> <span class="mono">01</span></span><span class="hp-tk-mc mono">PUBLIC RECEIPT</span>')}
 const trend=$('.trend');if(trend&&trend.dataset.om!=='1'){trend.dataset.om='1';trend.innerHTML='<div class="sec-head"><h2>genesis modules</h2><span class="muted small">rules available at launch</span></div><div class="om-modules"><article class="om-module"><i>01 / REQUIRED</i><b>Public manifest</b><span>Token details and selected rules are committed before the wallet signs.</span></article><article class="om-module"><i>02 / ENFORCED</i><b>No bundled creator buy</b><span>The create transaction contains no hidden creator purchase.</span></article><article class="om-module"><i>03 / VERIFIED</i><b>On-chain receipt</b><span>Mint address and transaction signature are attached after confirmation.</span></article></div>'}
 txt($('.board-head h2'),'the launch board');
 const grid=$('.boardsec .grid');if(grid&&grid.dataset.om!=='1'){grid.dataset.om='1';grid.innerHTML=`<div class="om-empty"><img src="${LOGO}" alt=""><h3>No Onemod launches yet.</h3><p>The board only lists tokens created through Onemod and confirmed by the Pump program. The first verified launch will appear here.</p><a class="btn" href="${BASE}/launch">configure the first launch</a></div>`}
 renderLaunches();
}

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function renderLaunches(force=false){
 const grid=$('.boardsec .grid');if(!grid)return;
 if(!force&&Date.now()-(renderLaunches.last||0)<4000)return;renderLaunches.last=Date.now();
 let launches=[];
 try{launches=JSON.parse(localStorage.getItem('onemod_launches')||'[]')}catch{}
 try{const response=await fetch(`${BASE}/api/onemod/launches`,{headers:{accept:'application/json'}});if(response.ok){const shared=await response.json();const seen=new Set;launches=[...shared,...launches].filter(item=>item?.signature&&!seen.has(item.signature)&&seen.add(item.signature))}}catch{}
 if(!launches.length)return;
 grid.innerHTML=launches.slice(0,24).map(item=>`<article class="om-launch-card"><div class="om-launch-card-top"><span class="om-token-mark">${esc((item.symbol||'?').slice(0,2))}</span><div><h3>${esc(item.name)}</h3><b>$${esc(item.symbol)}</b></div><span class="om-verified">VERIFIED</span></div><dl><div><dt>mint</dt><dd>${esc(item.mint.slice(0,6))}…${esc(item.mint.slice(-6))}</dd></div><div><dt>creator</dt><dd>${esc(item.creator.slice(0,6))}…${esc(item.creator.slice(-6))}</dd></div></dl><div class="om-card-actions"><a href="https://pump.fun/coin/${encodeURIComponent(item.mint)}" target="_blank" rel="noopener">open on Pump ↗</a><a href="https://solscan.io/tx/${encodeURIComponent(item.signature)}" target="_blank" rel="noopener">receipt ↗</a></div></article>`).join('');
}
function how(){
 const root=$('.how');if(!root)return;
 txt($('.how-hero h1'),'one market.\nmodular genesis.');txt(directP($('.how-hero')),'Onemod is a launch layer that changes how a token begins without asking traders to leave Pump.fun. Every launch publishes its configuration before execution and produces a receipt the market can verify.');
 const data=[
  ['commit the manifest.','The creator selects the launch rules once. Supply, creator buy, timing, fee routing and optional protections are hashed into one signed manifest before deployment.'],
  ['keep the market.','Onemod does not create another isolated venue. The configured token routes into Pump.fun, preserving the liquidity, traders and distribution that already exist.'],
  ['remove block-zero privilege.','The creator cannot attach a private bundle to the deployment transaction. Mint details remain sealed until execution, so the creator enters under the same published rules as everyone else.'],
  ['make every rule explicit.','Ticker, image, social provenance and launch parameters are checked before execution. The interface shows what is enforced, what is optional and what no system can guarantee.'],
  ['route value by module.','Fee behavior is chosen before launch. A project can route value into buybacks, burns, liquidity or a public treasury, with every movement attached to the genesis receipt.'],
  ['verify the genesis.','The final receipt links the signed manifest, deployment wallet, mint address, executed modules and transaction signatures. Anyone can audit the token from its first block.']
 ];
 $$('.rule').forEach((r,i)=>{if(!data[i])return;txt($('h2',r),data[i][0]);txt(directP($('.rule-copy',r)),data[i][1])});
 txt($('.how-end h2'),'modify the launch.');txt(directP($('.how-end')),'Keep the market traders already use. Change the rules that define the first block.');
}
function launch(){
 const old=$('.split.launch');if(!old||old.dataset.om==='1')return;old.dataset.om='1';old.className='om-launch';old.innerHTML=`<div class="om-launch-head"><div><span class="onemod-kicker">Pump create_v2 · mainnet</span><h1>configure a launch.</h1></div><p>Create a real Pump.fun bonding-curve token. Your connected wallet signs the transaction; Onemod never receives a private key.</p></div><div class="om-form-grid"><form class="om-form-card" id="om-launch-form"><div class="om-fields"><div class="om-field"><label for="om-name">Token name</label><input id="om-name" name="name" maxlength="32" required placeholder="One Market"></div><div class="om-field"><label for="om-symbol">Ticker</label><input id="om-symbol" name="symbol" maxlength="10" required placeholder="ONEMOD"></div><div class="om-field full"><label for="om-description">Description</label><textarea id="om-description" name="description" maxlength="500" required placeholder="What is this token for?"></textarea></div><div class="om-field full om-upload"><label for="om-image">Token image</label><input id="om-image" name="image" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG or WebP. Used to build the public metadata URI.</small></div><div class="om-field full"><label for="om-uri">Existing metadata URI <span class="muted">(optional)</span></label><input id="om-uri" name="uri" type="url" placeholder="https://.../metadata.json"><small>Use this when metadata is already hosted permanently.</small></div><div class="om-field"><label for="om-twitter">X</label><input id="om-twitter" name="twitter" placeholder="https://x.com/..."></div><div class="om-field"><label for="om-website">Website</label><input id="om-website" name="website" placeholder="https://..."></div></div><div class="om-checks"><label class="om-check"><input type="checkbox" checked disabled><span><b>Public genesis manifest</b><span>Name, ticker, metadata URI and signer are recorded before submission.</span></span></label><label class="om-check"><input type="checkbox" checked disabled><span><b>No creator bundle</b><span>Onemod builds one create_v2 instruction without an attached buy.</span></span></label><label class="om-check"><input type="checkbox" checked disabled><span><b>Pump.fun execution</b><span>The token launches on the official Pump bonding curve.</span></span></label></div><button class="btn btn-big om-submit" type="submit">Connect wallet to continue</button><div class="om-status" id="om-status" role="status"></div></form><aside class="om-review"><img class="om-review-logo" src="${LOGO}" alt="Onemod"><small class="mono muted">GENESIS PREVIEW</small><h2 id="om-preview-name">Untitled token</h2><strong class="mono" id="om-preview-symbol">$TICKER</strong><p class="muted" id="om-preview-description">Complete the manifest to prepare the Pump transaction.</p><dl><div><dt>Network</dt><dd>SOLANA MAINNET</dd></div><div><dt>Venue</dt><dd>PUMP.FUN</dd></div><div><dt>Creator buy</dt><dd>NONE</dd></div><div><dt>Private key</dt><dd>NEVER SHARED</dd></div></dl></aside></div>`;
}
function secondary(){
 const empty=(root,title,copy,cta=false)=>{if(root&&root.dataset.om!=='1'){root.dataset.om='1';root.innerHTML=`<div class="om-empty"><img src="${LOGO}" alt=""><h3>${title}</h3><p>${copy}</p>${cta?`<a class="btn" href="${BASE}/launch">configure a launch</a>`:''}</div>`}};
 if($('.lc'))empty($('.lc'),'No live launches.','A launch appears here after its manifest is submitted and while its Pump transaction is confirming.',true);
 if($('.calls-head')){txt($('.calls-head h1'),'community signals.');const p=$('.calls-head p');if(p)txt(p,'Signals open after the first verified Onemod launch.');empty($('.calls-grid'),'No signals yet.','Only verified Onemod launches can receive community signals.')}
 if($('.burns-head')){txt($('.burns-head h1'),'protocol receipts.');const p=$('.burns-head p');if(p)txt(p,'Confirmed manifests and Pump transaction signatures appear here.');$$('.burns-head ~ *').forEach(x=>x.remove());const parent=$('.burns-head')?.parentElement;if(parent&&!$('.om-empty',parent))parent.insertAdjacentHTML('beforeend',`<div class="om-empty"><img src="${LOGO}" alt=""><h3>No receipts yet.</h3><p>The ledger begins with the first confirmed Onemod launch.</p></div>`)}
}
function apply(){if(lock)return;lock=true;try{common();const path=BASE?location.pathname.slice(BASE.length)||'/':location.pathname;if(path==='/')home();if(path==='/how'||path==='/how/')how();if(path==='/launch'||path==='/launch/')launch();secondary();document.documentElement.classList.add('onemod-ready')}finally{lock=false}}
window.Onemod={...(window.Onemod||{}),renderLaunches};
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,60)}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();setTimeout(apply,500);setTimeout(apply,1800);
})();
