(() => {
  const BASE = location.pathname === '/OHMOON' || location.pathname.startsWith('/OHMOON/') ? '/OHMOON' : '';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function toast(message) {
    let node = $('.toast');
    if (!node) {
      node = document.createElement('div');
      node.className = 'toast';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 4200);
  }

  function navigation() {
    const button = $('.menu');
    const nav = $('.nav');
    if (!button || !nav) return;
    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  }

  function imagePreview() {
    const input = $('#coin-image');
    const label = $('.upload-copy');
    if (!input || !label) return;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        input.value = '';
        toast('Choose a PNG, JPG, GIF or WebP image.');
        return;
      }
      const image = document.createElement('img');
      image.className = 'upload-preview';
      image.alt = 'Token artwork preview';
      image.src = URL.createObjectURL(file);
      label.replaceWith(image);
    });
  }

  function launchForm() {
    const form = $('#survival-launch-form');
    if (!form) return;
    const name = $('#coin-name');
    const ticker = $('#coin-ticker');
    ticker?.addEventListener('input', () => {
      ticker.value = ticker.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!name?.value.trim() || !ticker?.value.trim()) {
        toast('Add a coin name and ticker first.');
        return;
      }
      localStorage.setItem('ohmoon-launch-draft', JSON.stringify({
        name: name.value.trim(),
        ticker: ticker.value.trim(),
        description: $('#coin-description')?.value.trim() || '',
        updatedAt: Date.now(),
      }));
      toast('Draft saved. Opening Pump.fun to create the coin.');
      setTimeout(() => window.open('https://pump.fun/create', '_blank', 'noopener,noreferrer'), 500);
    });
    try {
      const draft = JSON.parse(localStorage.getItem('ohmoon-launch-draft') || 'null');
      if (draft) {
        name.value = draft.name || '';
        ticker.value = draft.ticker || '';
        const description = $('#coin-description');
        if (description) description.value = draft.description || '';
      }
    } catch {}
  }

  function registerForm() {
    const form = $('#register-launch-form');
    const input = $('#launch-ca');
    if (!form || !input) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const mint = input.value.trim();
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
        toast('Enter a valid Solana token address.');
        return;
      }
      localStorage.setItem('ohmoon-pending-ca', mint);
      toast('Launch saved locally. Survival Vault routing is available to beta launches only.');
      input.value = '';
    });
  }

  function launchSearch() {
    const input = $('#launch-search');
    if (!input) return;
    input.addEventListener('input', () => {
      const value = input.value.trim().toLowerCase();
      $$('.launch-card').forEach(card => {
        card.hidden = Boolean(value) && !card.textContent.toLowerCase().includes(value);
      });
    });
  }

  function installServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register(`${BASE}/sw.js`).catch(() => {});
    }
  }

  navigation();
  imagePreview();
  launchForm();
  registerForm();
  launchSearch();
  installServiceWorker();
})();
