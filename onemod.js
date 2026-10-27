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
 document.title='Onemod — Modify the launch';
 $$('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(x=>{if(!x.dataset.onemod)x.remove()});
 if(!$('link[data-onemod="favicon"]')){const l=document.createElement('link');l.rel='icon';l.type='image/png';l.sizes='64x64';l.href=BASE+'/assets/onemod-favicon.png?v=4';l.dataset.onemod='favicon';document.head.appendChild(l)}
 if(!$('link[data-onemod="apple"]')){const l=document.createElement('link');l.rel='apple-touch-icon';l.sizes='180x180';l.href=BASE+'/brand/app-apple-180.png?v=4';l.dataset.onemod='apple';document.head.appendChild(l)}
 const md=$('meta[name="description"]'); if(md)md.content='Onemod is a modular genesis layer for tokens launching into Pump.fun.';
 $$('img').forEach(img=>{const src=img.getAttribute('src')||'';if(src.includes('/brand/mark-')||src.includes('/brand/app-')||src.includes('/mascot/pose-')){img.src=LOGO;img.alt='Onemod'}});
 $$('.brand,.brand-m').forEach(a=>{if(!a.querySelector('.onemod-word'))a.innerHTML=`<img class="mark" src="${LOGO}" alt="Onemod"><span class="onemod-word">onemod</span>`});
 $$('.tn-brand').forEach(a=>{if(!a.querySelector('.onemod-word'))a.innerHTML=`<img class="mark" src="${LOGO}" alt="Onemod"><span class="onemod-word">onemod</span>`});
 const nav={'/':'launch board','/live':'live launches','/calls':'signals','/burns':'receipts','/launch':'configure','/how':'protocol'};
 $$('a[href]').forEach(a=>{const raw=a.getAttribute('href');const h=BASE&&raw?.startsWith(BASE)?raw.slice(BASE.length)||'/':raw;if(nav[h]&&(a.matches('.sidelink,.topnav a,.mobilebar a')||a.closest('nav')))txt(a,nav[h]);});
 $$('a.btn[href="/launch"],button.btn').forEach(el=>{if(/create (a )?coin|wallet to launch/i.test(el.textContent))txt(el,el.tagName==='A'?'configure launch':'Connect wallet')});
 $$('.xlink').forEach(a=>{if(/\$LAUNCH|\$ONEMOD/i.test(a.textContent)){txt(a,'$ONEMOD');a.href='#'}});
 $$('footer').forEach(f=>{f.innerHTML=f.innerHTML.replace(/launch/gi,'Onemod').replace(/Raydium, StonkFun or pump\.fun/gi,'Pump.fun')});
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const nodes=[];while(n=walker.nextNode())nodes.push(n);
 nodes.forEach(node=>{if(node.parentElement?.closest('script,style'))return;let v=node.nodeValue;v=v.replace(/\$LAUNCH\b/g,'$ONEMOD').replace(/\bLAUNCH\b/g,'ONEMOD').replace(/\bLaunch\b/g,'Onemod');if(v!==node.nodeValue)node.nodeValue=v});
 $$('.lart-bubble').forEach(x=>txt(x,'configure the genesis. keep the market.'));
}
function home(){
 const hero=$('.hero-copy'); if(!hero)return;
 if(!$('.onemod-kicker',hero)){const k=document.createElement('span');k.className='onemod-kicker';k.textContent='modular genesis layer · pump.fun native';hero.prepend(k)}
 const h=$('.hero h1');if(h&&h.dataset.onemodHero!=='1'){h.dataset.onemodHero='1';h.setAttribute('aria-label','one market. better genesis.');h.innerHTML='<span class="h-word" aria-hidden="true">one</span><span class="h-word" aria-hidden="true">market.</span><span class="h-word h-pop" aria-hidden="true">better<svg class="h-squiggle" viewBox="0 0 300 30" preserveAspectRatio="none"><path pathLength="1" d="M4 18 C 40 4,70 28,108 14 S176 4,214 18 S268 26,296 10"/></svg></span><span class="h-word" aria-hidden="true">genesis.</span>'}
 txt($('.hero-line'),'Onemod adds configurable genesis rules before a token enters Pump.fun. Creators commit the launch manifest, block-zero privileges are removed, and every decision becomes a public receipt. The curve, liquidity and distribution stay where the market already is.');
 const stickers=$$('.sticker');['Pump.fun native','committed manifest','no creator bundle','public genesis receipt','modular fee routing'].forEach((v,i)=>{if(stickers[i]){const icon=stickers[i].querySelector('svg')?.outerHTML||'';html(stickers[i],icon+v)}});
 const ctas=$$('.hero-cta .btn');if(ctas[0])txt(ctas[0],'configure a launch');if(ctas[1])txt(ctas[1],'read the protocol');
 const stats=$$('.hstat');[['24','manifests committed'],['6','modules available'],['100%','receipts public']].forEach((v,i)=>{const d=stats[i]?.querySelector('div:last-child');if(d)html(d,`<b${i===1?' class="pos"':''}>${v[0]}</b><span>${v[1]}</span>`)});
 txt($('.hp-say'),'one market. better genesis mechanics.');
 const ticket=$('.hp-ticket');if(ticket){ticket.href=BASE+'/how';html(ticket,'<span class="hp-tk-top">genesis module</span><span class="hp-tk-main"><b>Origin</b> <span class="mono">01</span></span><span class="hp-tk-mc mono">PUBLIC RECEIPT</span>')}
 txt($('.trend .sec-head h2'),'module activity');txt($('.trend .sec-head .muted'),'live protocol previews');txt($('.board-head h2'),'the launch board');
 $$('.tile').forEach((card,i)=>{txt($('.tile-name',card),projects[i%projects.length]);txt($('.tile-tick',card),'$MOD'+String(i+1).padStart(2,'0'))});
 $$('.ccard').forEach((card,i)=>{const name=$('.cc-name',card);if(name)html(name,`${projects[i%projects.length]}<small>$${['ZERO','CURVE','SIGNAL','ORIGIN','PROOF','ROUTE'][i%6]}${String(i+1).padStart(2,'0')}</small>`);const desc=card.querySelector('p');if(desc)txt(desc,['Genesis manifest committed. Execution routes directly to Pump.fun.','Block-zero creator advantage disabled by the selected launch module.','Public configuration receipt available before curve activation.','Liquidity remains on the native Pump.fun market.'][i%4])});
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
 if(!$('.split.launch'))return;txt($('.lp-title'),'configure a launch');
 const p=$('.split.launch .muted');if(p&&/free|wallet|coin|launch/i.test(p.textContent))txt(p,'Build a signed genesis manifest, choose the modules, and route the final deployment to Pump.fun.');
 $$('label').forEach(l=>{l.innerHTML=l.innerHTML.replace(/pair/gi,'execution pair').replace(/description/gi,'project brief')});
 const heads=$$('.card.pad h3');if(heads[0])txt(heads[0],'genesis checks');if(heads[1])txt(heads[1],'value routing');
}
function secondary(){
 if($('.lc')){txt($('.lc-title'),'launches in motion.');const p=$('.lc-hero-copy p');if(p)txt(p,'Follow every committed manifest from configuration through Pump.fun execution. Each launch keeps its public receipt attached.');txt($('.lc-feed-title'),'earlier manifests')}
 if($('.calls-head')){txt($('.calls-head h1'),'community signals.');const p=$('.calls-head p');if(p)txt(p,'Wallet-weighted signals around active launches. Calls inform discovery; they never change the committed genesis rules.');const h=$('.calls-feed .sec-head h2');if(h)txt(h,'signal feed')}
 if($('.burns-head')){txt($('.burns-head h1'),'protocol receipts.');const p=$('.burns-head p');if(p)txt(p,'A public ledger of module execution, value routing and post-launch actions linked back to each genesis manifest.');$$('.burns-head,.card.pad').forEach(x=>x.innerHTML=x.innerHTML.replace(/burns?/gi,'receipts').replace(/burned/gi,'verified'))}
}
function apply(){if(lock)return;lock=true;try{common();const path=BASE?location.pathname.slice(BASE.length)||'/':location.pathname;if(path==='/')home();if(path==='/how'||path==='/how/')how();if(path==='/launch'||path==='/launch/')launch();secondary();document.documentElement.classList.add('onemod-ready')}finally{lock=false}}
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,60)}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();setTimeout(apply,500);setTimeout(apply,1800);
})();
