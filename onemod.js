(() => {
  const BASE = location.pathname === '/onemod' || location.pathname.startsWith('/onemod/') ? '/onemod' : '';
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
    $$('.xlink').forEach(link => { link.textContent = 'BUILD'; link.setAttribute('aria-label', 'Open launch workspace'); link.href = `${BASE}/launch/`; link.removeAttribute('target'); });
    $$('.wchip-cta,.wtab').forEach(button => { button.textContent = 'Connect wallet'; button.setAttribute('aria-label', 'Connect Solana wallet'); });
    document.documentElement.classList.add('onemod-ready');
  }

  function bindLooks() {
    $$('.lookswitch button').forEach(button => button.addEventListener('click', () => {
      const value = button.textContent.trim().toLowerCase();
      if (value === 'old') document.documentElement.removeAttribute('data-look'); else document.documentElement.setAttribute('data-look', value);
      $$('.lookswitch button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    }));
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
    extra.innerHTML = `<label>metadata URI <small>required | public IPFS/HTTPS JSON</small><input name="metadataUri" type="url" required placeholder="https://ipfs.io/ipfs/..."></label><div class="two"><label>initial buy <small>SOL</small><input name="initialBuy" type="number" min="0.0001" step="0.0001" value="0.01"></label><label>slippage <small>%</small><input name="slippage" type="number" min="1" max="50" step="1" value="10"></label></div><label>priority fee <small>SOL</small><input name="priorityFee" type="number" min="0" step="0.00001" value="0.00005"></label><div class="om-create-note">Onemod builds a Pump.fun transaction for the values above. Your wallet shows the final transaction before signing. Onemod never receives your private key.</div><div class="om-create-status" aria-live="polite"></div>`;
    button.before(extra);
    const status = extra.querySelector('.om-create-status');
    const setButton = () => { button.textContent = window.OnemodWallet?.state.address ? 'Review & create on Pump.fun' : 'Connect wallet'; };
    window.addEventListener('onemod:wallet', setButton); setButton();
    button.addEventListener('click', async event => {
      event.preventDefault();
      try {
        if (!window.OnemodWallet.state.address) { await window.OnemodWallet.connect(); setButton(); return; }
        button.disabled = true; button.textContent = 'Building transaction...'; status.textContent = '';
        const result = await window.OnemodWallet.createCoin({ name: name?.value, symbol: ticker?.value, uri: extra.querySelector('[name="metadataUri"]').value.trim(), initialBuy: extra.querySelector('[name="initialBuy"]').value, slippage: Number(extra.querySelector('[name="slippage"]').value), priorityFee: Number(extra.querySelector('[name="priorityFee"]').value) });
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
