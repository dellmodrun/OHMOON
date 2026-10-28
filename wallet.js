(() => {
  const RPC_ENDPOINTS = ['https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'];
  const BASE = ['/ohmoon', '/OHMOON'].find(base => location.pathname === base || location.pathname.startsWith(`${base}/`)) || '';
  const OHMOON_LOGO = `${BASE}/assets/ohmoon-logo-transparent.png`;
  const state = { provider: null, account: null, standard: false, address: '', name: '', balance: null };
  const short = (value) => value ? `${value.slice(0, 4)}...${value.slice(-4)}` : '';
  const brandIcons = {
    Phantom: `${BASE}/assets/wallets-phantom.svg`, Solflare: `${BASE}/assets/wallets-solflare.ico`, Backpack: `${BASE}/assets/wallets-backpack.ico`,
    'Coinbase Wallet': `${BASE}/assets/wallets-coinbase.ico`, 'Trust Wallet': `${BASE}/assets/wallets-trust.ico`
  };
  const providers = () => {
    const standard = (window.OhMoonWalletRegistry?.get?.() || []).filter(wallet => wallet.features?.['standard:connect'] && wallet.chains?.some(chain => String(chain).startsWith('solana:'))).map(wallet => ({ name: wallet.name, icon: wallet.icon, wallet, standard: true }));
    const legacy = [
      ['Phantom', window.phantom?.solana], ['Solflare', window.solflare], ['Backpack', window.backpack], ['Coinbase Wallet', window.coinbaseSolana],
      ['Trust Wallet', window.trustwallet?.solana], ['Brave Wallet', window.braveSolana], ['Exodus', window.exodus?.solana], ['Glow', window.glowSolana],
      ['Coin98', window.coin98?.sol]
    ].filter(([, provider]) => provider?.connect).map(([name, provider]) => ({ name, icon: brandIcons[name] || '', provider, standard: false }));
    return [...standard, ...legacy].filter((entry, index, all) => all.findIndex(item => item.name.toLowerCase() === entry.name.toLowerCase()) === index);
  };

  function toast(message, kind = '') {
    let node = document.querySelector('.om-toast');
    if (!node) { node = document.createElement('div'); node.className = 'om-toast'; document.body.appendChild(node); }
    node.className = `om-toast show ${kind}`; node.textContent = message;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 5200);
  }

  function updateButtons() {
    document.querySelectorAll('[data-wallet],.wchip-cta,.wtab').forEach((button) => {
      if (!(button instanceof HTMLElement)) return;
      button.dataset.connected = state.address ? 'true' : 'false';
      if (state.address && !button.classList.contains('pd-wallet')) button.textContent = `${short(state.address)}${state.balance == null ? '' : ` | ${state.balance.toFixed(2)} SOL`}`;
    });
    window.dispatchEvent(new CustomEvent('ohmoon:wallet', { detail: { ...state } }));
  }

  async function rpc(method, params) {
    let lastError;
    for (const endpoint of RPC_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error?.message || `RPC request failed (${response.status})`);
        return data.result;
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error('Every configured Solana RPC endpoint failed.');
  }

  async function readBalance() {
    if (!state.address) return;
    try { const result = await rpc('getBalance', [state.address, { commitment: 'confirmed' }]); state.balance = result.value / 1e9; updateButtons(); } catch {}
  }

  async function useProvider(entry, options = {}) {
    let address = '', account = null;
    if (entry.standard) {
      const output = await entry.wallet.features['standard:connect'].connect({ silent: Boolean(options.onlyIfTrusted) });
      account = output.accounts?.find(item => item.chains?.some(chain => String(chain).startsWith('solana:'))) || output.accounts?.[0] || entry.wallet.accounts?.[0];
      address = account?.address || '';
    } else {
      const result = await entry.provider.connect(options); const publicKey = result?.publicKey || entry.provider.publicKey; address = publicKey?.toString?.() || '';
    }
    if (!address) throw new Error('The wallet did not return a Solana account.');
    state.provider = entry.standard ? entry.wallet : entry.provider; state.account = account; state.standard = entry.standard; state.address = address; state.name = entry.name;
    localStorage.setItem('ohmoon-wallet', entry.name);
    if (!entry.standard) {
      entry.provider.on?.('accountChanged', (key) => { state.address = key?.toString?.() || ''; state.balance = null; updateButtons(); readBalance(); });
      entry.provider.on?.('disconnect', () => { state.provider = null; state.account = null; state.address = ''; state.balance = null; updateButtons(); });
    }
    updateButtons(); readBalance();
    return state;
  }

  function walletModal() {
    return new Promise((resolve, reject) => {
      document.querySelector('.om-wallet-modal')?.remove();
      const found = providers();
      const wrap = document.createElement('div'); wrap.className = 'om-wallet-modal';
      const installs = [
        ['Phantom', brandIcons.Phantom, 'https://phantom.com/download'], ['Solflare', brandIcons.Solflare, 'https://www.solflare.com/download'], ['Backpack', brandIcons.Backpack, 'https://backpack.app/download'],
        ['Coinbase Wallet', brandIcons['Coinbase Wallet'], 'https://www.coinbase.com/wallet/downloads'], ['Trust Wallet', brandIcons['Trust Wallet'], 'https://trustwallet.com/download']
      ];
      wrap.innerHTML = `<button class="om-wallet-backdrop" aria-label="Close wallet selector"></button><section class="om-wallet-sheet" role="dialog" aria-modal="true" aria-label="Choose a Solana wallet"><header><div><small>SOLANA WALLET STANDARD</small><h2>Connect to OhMoon</h2></div><button class="om-wallet-close" aria-label="Close">x</button></header><p>Your compatible Solana wallets are detected automatically. Your wallet keeps custody and approves every transaction.</p><div class="om-wallet-list">${found.map((entry, i) => `<button data-provider="${i}"><img src="${entry.icon || brandIcons[entry.name] || OHMOON_LOGO}" alt=""><b>${entry.name}</b><em>detected</em></button>`).join('') || '<div class="om-wallet-empty">No compatible wallet was detected in this browser.</div>'}</div><div class="om-wallet-more"><small>POPULAR WALLETS</small>${installs.map(([name, icon, url]) => `<a href="${url}" target="_blank" rel="noreferrer"><img src="${icon}" alt=""><span>${name}</span><em>install -&gt;</em></a>`).join('')}</div></section>`;
      document.body.appendChild(wrap);
      const close = () => { wrap.remove(); reject(new Error('Wallet selection cancelled.')); };
      wrap.querySelector('.om-wallet-backdrop').onclick = close; wrap.querySelector('.om-wallet-close').onclick = close;
      wrap.querySelectorAll('[data-provider]').forEach(button => button.onclick = async () => {
        const entry = found[Number(button.dataset.provider)];
        button.disabled = true; button.querySelector('em').textContent = 'opening...';
        try { const result = await useProvider(entry); wrap.remove(); resolve(result); }
        catch (error) { button.disabled = false; button.querySelector('em').textContent = 'try again'; toast(error.message || 'Wallet connection was rejected.', 'error'); }
      });
    });
  }

  async function connect() {
    if (state.address && state.provider) return state;
    return walletModal();
  }

  async function disconnect() {
    try {
      if (state.standard) await state.provider?.features?.['standard:disconnect']?.disconnect?.();
      else await state.provider?.disconnect?.();
    } catch {}
    state.provider = null; state.account = null; state.standard = false; state.address = ''; state.name = ''; state.balance = null;
    localStorage.removeItem('ohmoon-wallet'); updateButtons();
  }

  function accountModal() {
    document.querySelector('.om-wallet-modal')?.remove();
    const wrap = document.createElement('div'); wrap.className = 'om-wallet-modal';
    wrap.innerHTML = `<button class="om-wallet-backdrop" aria-label="Close wallet account"></button><section class="om-wallet-sheet om-account-sheet" role="dialog" aria-modal="true" aria-label="Connected wallet"><header><div><small>CONNECTED WALLET</small><h2>${state.name || 'Solana wallet'}</h2></div><button class="om-wallet-close" aria-label="Close">x</button></header><div class="om-account-address"><span>${state.address}</span><b>${state.balance == null ? 'Balance loading...' : `${state.balance.toFixed(5)} SOL`}</b></div><div class="om-account-actions"><button data-copy>Copy address</button><a href="https://solscan.io/account/${state.address}" target="_blank" rel="noreferrer">View on Solscan</a><button data-disconnect>Disconnect</button></div></section>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove(); wrap.querySelector('.om-wallet-backdrop').onclick = close; wrap.querySelector('.om-wallet-close').onclick = close;
    wrap.querySelector('[data-copy]').onclick = async () => { await navigator.clipboard.writeText(state.address); toast('Wallet address copied.'); };
    wrap.querySelector('[data-disconnect]').onclick = async () => { await disconnect(); close(); toast('Wallet disconnected.'); };
  }

  async function signAndSend(transaction) {
    if (!state.provider || !state.address) await connect();
    let bytes;
    if (state.standard) {
      const feature = state.provider.features?.['solana:signTransaction'];
      if (!feature || !state.account) throw new Error(`${state.name || 'This wallet'} does not support Solana transaction signing.`);
      const [output] = await feature.signTransaction({ account: state.account, transaction: transaction.serialize(), chain: 'solana:mainnet' });
      bytes = output.signedTransaction;
    } else {
      if (!state.provider.signTransaction) throw new Error(`${state.name || 'This wallet'} does not support transaction signing.`);
      const signed = await state.provider.signTransaction(transaction); bytes = signed.serialize();
    }
    let binary = ''; for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    const signature = await rpc('sendTransaction', [btoa(binary), { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 }]);
    toast('Transaction submitted. Waiting for confirmation...');
    const started = Date.now();
    while (Date.now() - started < 45000) {
      try {
        const result = await rpc('getSignatureStatuses', [[signature], { searchTransactionHistory: true }]);
        const status = result?.value?.[0];
        if (status?.err) throw new Error('The transaction failed on-chain. Open Solscan for details.');
        if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') { toast('Transaction confirmed.', 'success'); break; }
      } catch (error) { if (/failed on-chain/i.test(error.message)) throw error; }
      await new Promise(resolve => setTimeout(resolve, 1800));
    }
    readBalance();
    return signature;
  }

  async function signMessage(message) {
    if (!state.provider || !state.address) await connect();
    const bytes = message instanceof Uint8Array ? message : new TextEncoder().encode(String(message));
    if (state.standard) {
      const feature = state.provider.features?.['solana:signMessage'];
      if (!feature || !state.account) throw new Error(`${state.name || 'This wallet'} does not support message signing.`);
      const [output] = await feature.signMessage({ account: state.account, message: bytes });
      if (!output?.signature) throw new Error('The wallet returned no message signature.');
      return output.signature;
    }
    if (!state.provider.signMessage) throw new Error(`${state.name || 'This wallet'} does not support message signing.`);
    const output = await state.provider.signMessage(bytes, 'utf8');
    return output?.signature || output;
  }

  async function buildTrade(payload) {
    const response = await fetch('https://pumpportal.fun/api/trade-local', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error((await response.text()) || `Transaction builder failed (${response.status})`);
    return window.solanaWeb3.VersionedTransaction.deserialize(new Uint8Array(await response.arrayBuffer()));
  }

  async function trade({ mint, action, amount, denominatedInSol = true, slippage = 10, priorityFee = 0.00005 }) {
    if (!mint || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) throw new Error('A valid token mint address is required.');
    if (!(Number(amount) > 0) && !String(amount).endsWith('%')) throw new Error('Enter an amount greater than zero.');
    await connect();
    const transaction = await buildTrade({ publicKey: state.address, action, mint, amount, denominatedInSol: String(denominatedInSol), slippage, priorityFee, pool: 'auto' });
    return signAndSend(transaction);
  }

  async function createCoin({ name, symbol, uri, initialBuy, slippage = 10, priorityFee = 0.00005 }) {
    if (!name?.trim() || !symbol?.trim()) throw new Error('Name and ticker are required.');
    if (!/^https:\/\//i.test(uri || '')) throw new Error('A public HTTPS metadata URI is required.');
    if (!(Number(initialBuy) > 0)) throw new Error('Initial buy must be greater than zero.');
    await connect();
    const mint = window.solanaWeb3.Keypair.generate();
    const transaction = await buildTrade({ publicKey: state.address, action: 'create', tokenMetadata: { name: name.trim(), symbol: symbol.trim().replace(/^\$/, '').toUpperCase(), uri }, mint: mint.publicKey.toBase58(), denominatedInSol: 'true', amount: Number(initialBuy), slippage, priorityFee, pool: 'pump' });
    transaction.sign([mint]);
    const signature = await signAndSend(transaction);
    return { signature, mint: mint.publicKey.toBase58() };
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.wchip-cta,.wtab,[data-wallet-connect]');
    if (!button) return; event.preventDefault();
    if (state.address) { accountModal(); return; }
    connect().catch(error => { if (!/cancelled/i.test(error.message)) toast(error.message, 'error'); });
  });
  window.OhMoonWallet = { state, connect, disconnect, signMessage, trade, createCoin, rpc, toast, short };
  window.addEventListener('DOMContentLoaded', async () => {
    const remembered = localStorage.getItem('ohmoon-wallet');
    const match = providers().find(entry => entry.name === remembered);
    if (match) { try { await useProvider(match, { onlyIfTrusted: true }); } catch {} }
    updateButtons();
  }, { once: true });
})();
