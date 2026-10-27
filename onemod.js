(() => {
  const BASE = location.pathname === '/onemod' || location.pathname.startsWith('/onemod/') ? '/onemod' : '';
  const LOGO = `${BASE}/assets/onemod-logo-transparent.png`;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function setBrand() {
    document.documentElement.dataset.brand = 'onemod';
    document.title = 'Onemod — Plan once. Launch with context.';
    const description = $('meta[name="description"]');
    if (description) description.content = 'Onemod is a launch planning, publishing and market intelligence workspace built around Pump.fun.';
    $$('link[rel="icon"],link[rel="shortcut icon"]').forEach((link) => link.remove());
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = `${BASE}/assets/onemod-favicon.png?v=5`;
    document.head.appendChild(favicon);
    $$('.brand,.tn-brand').forEach((brand) => {
      brand.setAttribute('aria-label', 'Onemod');
      brand.innerHTML = `<img class="mark" src="${LOGO}" alt="Onemod"><span class="onemod-word">onemod</span>`;
    });
    $$('.xlink').forEach((link) => {
      link.textContent = '$ONEMOD';
      link.setAttribute('aria-label', '$ONEMOD');
      link.href = '#';
    });
    document.documentElement.classList.add('onemod-ready');
  }

  function bindLooks() {
    $$('.lookswitch button').forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.textContent.trim().toLowerCase();
        if (value === 'old') document.documentElement.removeAttribute('data-look');
        else document.documentElement.setAttribute('data-look', value);
        $$('.lookswitch button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      });
    });
  }

  function bindLaunchForm() {
    const form = $('.split.launch .form');
    if (!form) return;
    const fields = [...form.querySelectorAll('input')];
    const name = fields[0];
    const ticker = fields[1];
    const brief = form.querySelector('textarea');
    const previewName = $('.lp-preview .cc-nm');
    const previewTicker = $('.lp-preview .cc-tick');
    const previewBrief = $('.lp-preview .cc-desc');
    const update = () => {
      if (previewName) previewName.textContent = name?.value.trim() || 'your project';
      if (previewTicker) previewTicker.textContent = `$${(ticker?.value || 'TICKER').replace(/^\$/, '').toUpperCase()}`;
      if (previewBrief) previewBrief.textContent = brief?.value.trim() || 'Your project brief will appear here.';
    };
    [name, ticker, brief].filter(Boolean).forEach((field) => field.addEventListener('input', update));
    update();
    const walletButton = [...form.querySelectorAll('button')].find((button) => /connect wallet/i.test(button.textContent));
    if (walletButton) walletButton.addEventListener('click', async (event) => {
      event.preventDefault();
      const provider = window.solana;
      if (!provider?.connect) {
        walletButton.textContent = 'Install a Solana wallet';
        return;
      }
      try {
        const result = await provider.connect();
        const address = result.publicKey?.toString() || provider.publicKey?.toString() || '';
        walletButton.textContent = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : 'Wallet connected';
      } catch {
        walletButton.textContent = 'Connect wallet';
      }
    });
  }

  function init() {
    setBrand();
    bindLooks();
    bindLaunchForm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
