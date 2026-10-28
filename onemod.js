(() => {
  const BASE = ['/onemod', '/OHMOON'].find(base => location.pathname === base || location.pathname.startsWith(`${base}/`)) || '';
  const LOGO = `${BASE}/assets/onemod-logo-transparent.png`;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function setBrand() {
    document.documentElement.dataset.brand = 'onemod';
    document.title = 'Onemod - Plan once. Launch with context.';
    const description = $('meta[name="description"]');
    if (description) description.content = 'Onemod is a live Pump.fun launch, trading and market operations workspace.';
    $$('link[rel="icon"],link[rel="shortcut icon"]').forEach(link => link.remove());
    const favicon = document.createElement('link'); favicon.rel = 'icon'; favicon.type = 'image/png'; favicon.href = `${BASE}/assets/onemod-favicon.png?v=6`; document.head.appendChild(favicon);
    $$('.brand,.tn-brand').forEach(brand => { brand.setAttribute('aria-label', 'Onemod'); brand.innerHTML = `<img class="mark" src="${LOGO}" alt="Onemod"><span class="onemod-word">onemod</span>`; });
    $$('.xlink').forEach(link => {
      link.classList.add('om-xlink'); link.setAttribute('aria-label', 'Follow Onemod on X'); link.title = 'Follow @onemoruntime on X'; link.href = 'https://x.com/onemoruntime'; link.target = '_blank'; link.rel = 'noreferrer';
      link.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
      if (!link.previousElementSibling?.classList.contains('om-ca-panel')) { const ca = document.createElement('div'); ca.className = 'om-ca-panel'; ca.innerHTML = '<span>OFFICIAL TOKEN</span><strong>$ONEMOD</strong><code>CA · TBA</code>'; link.before(ca); }
    });
    $$('.wchip-cta,.wtab').forEach(button => { button.textContent = 'Connect wallet'; button.setAttribute('aria-label', 'Connect Solana wallet'); });
    document.documentElement.classList.add('onemod-ready');
  }

  function bindLooks() {
    document.documentElement.removeAttribute('data-look');
    $$('.lookswitch').forEach(node => node.remove());
  }

  function bindLaunchForm() {
    const form = $('.split.launch .form'); if (!form) return;
    const labels = [...form.querySelectorAll('label')];
    const field = text => labels.find(label => label.textContent.trim().toLowerCase().startsWith(text))?.querySelector('input,textarea');
    const name = field('name'), ticker = field('ticker'), brief = field('project brief');
    const x = field('x '), telegram = field('telegram'), website = field('website');
    labels.find(label => label.textContent.trim().toLowerCase().startsWith('png,'))?.remove();
    form.querySelector('.pp > input[disabled]')?.remove();
    if (x) { x.disabled = false; x.placeholder = 'https://x.com/project'; }
    if (telegram) telegram.placeholder = 'https://t.me/project';
    if (website) website.placeholder = 'https://project.com';
    const previewName = $('.lp-preview .cc-nm'), previewTicker = $('.lp-preview .cc-tick'), previewBrief = $('.lp-preview .cc-desc');
    const update = () => { if (previewName) previewName.textContent = name?.value.trim() || 'your project'; if (previewTicker) previewTicker.textContent = `$${(ticker?.value || 'TICKER').replace(/^\$/, '').toUpperCase()}`; if (previewBrief) previewBrief.textContent = brief?.value.trim() || 'Your project brief will appear here.'; };
    [name, ticker, brief].filter(Boolean).forEach(input => input.addEventListener('input', update)); update();
    const button = [...form.querySelectorAll('button')].find(node => /connect wallet/i.test(node.textContent)); if (!button) return;
    button.type = 'button'; button.dataset.wallet = 'launch';
    const extra = document.createElement('div'); extra.className = 'om-create-fields';
    extra.innerHTML = `<label>project image <small>PNG, JPG, WebP or GIF | automatically optimized for permanent storage</small><span class="om-file-picker"><input name="projectImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Choose project image"><span class="om-file-action">Choose image</span><span class="om-file-name">No file selected</span></span></label><button class="btn btn-ghost om-upload" type="button">Upload image & build metadata</button><label>metadata URI <small>generated automatically | advanced users may also paste a public URI</small><input name="metadataUri" type="url" required placeholder="Generated after upload"></label><div class="two"><label>initial buy <small>SOL</small><input name="initialBuy" type="number" min="0.0001" step="0.0001" value="0.01"></label><label>slippage <small>%</small><input name="slippage" type="number" min="1" max="50" step="1" value="10"></label></div><label>priority fee <small>SOL</small><input name="priorityFee" type="number" min="0" step="0.00001" value="0.00005"></label><div class="om-create-note">Images and metadata are stored permanently through AR.IO Turbo. Eligible files under 105 KiB use its free tier. Your wallet signs upload ownership and the final Pump.fun transaction; Onemod never receives your private key.</div><div class="om-create-status" aria-live="polite"></div>`;
    button.before(extra);
    const status = extra.querySelector('.om-create-status');
    const fileInput = extra.querySelector('[name="projectImage"]'), fileName = extra.querySelector('.om-file-name'), metadataInput = extra.querySelector('[name="metadataUri"]'), uploadButton = extra.querySelector('.om-upload');
    const loadTurbo = () => new Promise((resolve, reject) => {
      if (window.OnemodTurbo?.TurboFactory) { resolve(window.OnemodTurbo); return; }
      const existing = document.querySelector('script[data-onemod-turbo]'); if (existing) { existing.addEventListener('load', () => resolve(window.OnemodTurbo), { once:true }); existing.addEventListener('error', reject, { once:true }); return; }
      const script = document.createElement('script'); script.src = `${BASE}/vendor/turbo.min.js`; script.dataset.onemodTurbo = 'true'; script.onload = () => resolve(window.OnemodTurbo); script.onerror = () => reject(new Error('Permanent storage module could not load.')); document.head.appendChild(script);
    });
    const optimizeImage = async file => {
      if (!file || !file.type.startsWith('image/')) throw new Error('Choose a PNG, JPG, WebP or GIF image.');
      if (file.size <= 100 * 1024) return file;
      const bitmap = await createImageBitmap(file); let scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height)), quality = .86, blob;
      for (let pass = 0; pass < 8; pass += 1) {
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale)); canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality)); if (blob && blob.size <= 100 * 1024) break; scale *= .78; quality = Math.max(.52, quality - .07);
      }
      bitmap.close?.(); if (!blob || blob.size > 105 * 1024) throw new Error('The image could not be optimized below the permanent-storage free-tier limit.');
      return new File([blob], 'token.webp', { type:'image/webp' });
    };
    fileInput.addEventListener('change', () => { const file = fileInput.files?.[0], pic = $('.lp-preview .cc-pic'); if (fileName) { fileName.textContent = file?.name || 'No file selected'; fileName.title = file?.name || ''; } if (file && pic) { const url = URL.createObjectURL(file); if (pic.tagName === 'IMG') pic.src = url; else { pic.style.backgroundImage = `url("${url}")`; pic.style.backgroundSize = 'cover'; pic.style.backgroundPosition = 'center'; } } });
    uploadButton.addEventListener('click', async () => {
      try {
        if (!name?.value.trim() || !ticker?.value.trim()) throw new Error('Enter the project name and ticker first.');
        const source = fileInput.files?.[0]; if (!source) throw new Error('Choose a project image first.');
        uploadButton.disabled = true; uploadButton.textContent = 'Preparing image...'; status.textContent = ''; status.classList.remove('error');
        await window.OnemodWallet.connect(); const file = await optimizeImage(source); uploadButton.textContent = 'Signing permanent upload...';
        const { TurboFactory } = await loadTurbo();
        const turbo = await TurboFactory.authenticated({ token:'solana', walletAdapter:{ publicKey:new solanaWeb3.PublicKey(window.OnemodWallet.state.address), signMessage:message => window.OnemodWallet.signMessage(message) } });
        const imageResult = await turbo.upload({ data:file, dataItemOpts:{ tags:[{name:'Content-Type',value:file.type},{name:'App-Name',value:'Onemod'}] } });
        const imageUrl = `https://turbo-gateway.com/${imageResult.id}`;
        const metadata = JSON.stringify({ name:name.value.trim(), symbol:ticker.value.trim().replace(/^\$/, '').toUpperCase(), description:brief?.value.trim() || '', image:imageUrl, showName:true, platform:'onemod', twitter:x?.value.trim() || '', telegram:telegram?.value.trim() || '', website:website?.value.trim() || '' });
        const metadataResult = await turbo.upload({ data:metadata, dataItemOpts:{ tags:[{name:'Content-Type',value:'application/json'},{name:'App-Name',value:'Onemod'}] } });
        metadataInput.value = `https://turbo-gateway.com/${metadataResult.id}`; status.textContent = 'Image and metadata uploaded permanently. Review the values, then create the token.'; uploadButton.textContent = 'Metadata ready';
      } catch (error) { status.textContent = error.message || 'Metadata upload failed.'; status.classList.add('error'); uploadButton.textContent = 'Upload image & build metadata'; }
      finally { uploadButton.disabled = false; }
    });
    const setButton = () => { button.textContent = window.OnemodWallet?.state.address ? 'Review & create on Pump.fun' : 'Connect wallet'; };
    window.addEventListener('onemod:wallet', setButton); setButton();
    button.addEventListener('click', async event => {
      event.preventDefault();
      try {
        if (!window.OnemodWallet.state.address) { await window.OnemodWallet.connect(); setButton(); return; }
        button.disabled = true; button.textContent = 'Building transaction...'; status.textContent = ''; status.classList.remove('error');
        const result = await window.OnemodWallet.createCoin({ name: name?.value, symbol: ticker?.value, uri: metadataInput.value.trim(), initialBuy: extra.querySelector('[name="initialBuy"]').value, slippage: Number(extra.querySelector('[name="slippage"]').value), priorityFee: Number(extra.querySelector('[name="priorityFee"]').value) });
        status.innerHTML = `Submitted | <a href="https://solscan.io/tx/${result.signature}" target="_blank" rel="noreferrer">view transaction</a> | mint <a href="${BASE}/trade/?mint=${result.mint}">${result.mint.slice(0, 6)}...${result.mint.slice(-6)}</a>`;
        button.textContent = 'Transaction submitted';
      } catch (error) { status.textContent = error.message || 'The transaction was not submitted.'; status.classList.add('error'); setButton(); }
      finally { button.disabled = false; }
    });
    form.addEventListener('submit', event => event.preventDefault());
  }

  function bindSearch() {
    $$('.search').forEach(form => form.addEventListener('submit', event => {
      event.preventDefault();
      const query = form.querySelector('input')?.value.trim();
      if (!query) return;
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query)) location.href = `${BASE}/trade/?mint=${encodeURIComponent(query)}`;
      else {
        let items = []; try { items = JSON.parse(localStorage.getItem('onemod-live-projects-v2') || localStorage.getItem('onemod-live-projects-v1') || '[]'); } catch {}
        const q = query.toLowerCase();
        const found = items.find(item => item.name?.toLowerCase().includes(q) || item.symbol?.toLowerCase().includes(q));
        if (found) location.href = `${BASE}/trade/?mint=${encodeURIComponent(found.mint)}`;
        else window.OnemodWallet?.toast('No recent live token matched that search.', 'error');
      }
    }));
  }

  function bindInstall() {
    const sheet = $('.ai-sheet'); if (!sheet) return;
    const install = sheet.querySelector('.btn'), close = sheet.querySelector('.ai-x');
    let prompt = null;
    const hide = () => { sheet.hidden = true; sheet.style.display = 'none'; };
    if (sessionStorage.getItem('onemod-install-dismissed')) hide();
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt = event; if (!sessionStorage.getItem('onemod-install-dismissed')) { sheet.hidden = false; sheet.style.display = ''; } });
    close?.addEventListener('click', () => { sessionStorage.setItem('onemod-install-dismissed', '1'); hide(); });
    install?.addEventListener('click', async () => {
      if (prompt) { await prompt.prompt(); prompt = null; hide(); return; }
      window.OnemodWallet?.toast('Use your browser menu and choose Install app or Add to Home Screen.');
    });
  }

  function cleanDecorativeControls() {
    $$('.lart-bubble').forEach(node => { node.disabled = true; node.setAttribute('aria-hidden', 'true'); node.tabIndex = -1; });
    $$('.lchy-fab').forEach(node => { node.addEventListener('click', () => location.href = `${BASE}/how/`); node.setAttribute('aria-label', 'Read how Onemod works'); });
  }

  function registerApp() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
  }

  function init() { setBrand(); bindLooks(); bindLaunchForm(); bindSearch(); bindInstall(); cleanDecorativeControls(); registerApp(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
