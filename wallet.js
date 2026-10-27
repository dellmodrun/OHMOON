(() => {
  const RPC = 'https://api.mainnet-beta.solana.com';
  const state = { provider: null, address: '', name: '', balance: null };
  const short = (value) => value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '';
  const providers = () => [
    ['Phantom', window.phantom?.solana],
    ['Solflare', window.solflare],
    ['Backpack', window.backpack],
    ['Solana wallet', window.solana]
  ].filter((entry, index, all) => entry[1]?.connect && all.findIndex(x => x[1] === entry[1]) === index);

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
      if (state.address && !button.classList.contains('pd-wallet')) button.textContent = `${short(state.address)}${state.balance == null ? '' : ` · ${state.balance.toFixed(2)} SOL`}`;
    });
    window.dispatchEvent(new CustomEvent('onemod:wallet', { detail: { ...state } }));
  }

  async function rpc(method, params) {
    const response = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || `RPC request failed (${response.status})`);
    return data.result;
  }

  async function readBalance() {
    if (!state.address) return;
    try { const result = await rpc('getBalance', [state.address, { commitment: 'confirmed' }]); state.balance = result.value / 1e9; updateButtons(); } catch {}
  }

  async function useProvider(name, provider, options = {}) {
    const result = await provider.connect(options);
    const publicKey = result?.publicKey || provider.publicKey;
    if (!publicKey) throw new Error('The wallet did not return a public key.');
    state.provider = provider; state.address = publicKey.toString(); state.name = name;
    localStorage.setItem('onemod-wallet', name);
    provider.on?.('accountChanged', (key) => { state.address = key?.toString?.() || ''; state.balance = null; updateButtons(); readBalance(); });
    provider.on?.('disconnect', () => { state.provider = null; state.address = ''; state.balance = null; updateButtons(); });
    updateButtons(); readBalance();
    return state;
  }

  function walletModal() {
    return new Promise((resolve, reject) => {
      document.querySelector('.om-wallet-modal')?.remove();
      const found = providers();
      const wrap = document.createElement('div'); wrap.className = 'om-wallet-modal';
      wrap.innerHTML = `<button class="om-wallet-backdrop" aria-label="Close wallet selector"></button><section class="om-wallet-sheet" role="dialog" aria-modal="true" aria-label="Choose a Solana wallet"><header><div><small>SOLANA WALLET</small><h2>Connect to Onemod</h2></div><button class="om-wallet-close" aria-label="Close">×</button></header><p>Your wallet keeps custody. Onemod only requests transactions for you to review and sign.</p><div class="om-wallet-list">${found.map(([name], i) => `<button data-provider="${i}"><span>${name.slice(0, 1)}</span><b>${name}</b><em>detected</em></button>`).join('') || '<div class="om-wallet-empty">No compatible wallet was detected.</div>'}</div><div class="om-wallet-install"><a href="https://phantom.com/download" target="_blank" rel="noreferrer">Phantom</a><a href="https://www.solflare.com/download" target="_blank" rel="noreferrer">Solflare</a><a href="https://backpack.app/download" target="_blank" rel="noreferrer">Backpack</a></div></section>`;
      document.body.appendChild(wrap);
      const close = () => { wrap.remove(); reject(new Error('Wallet selection cancelled.')); };
      wrap.querySelector('.om-wallet-backdrop').onclick = close; wrap.querySelector('.om-wallet-close').onclick = close;
      wrap.querySelectorAll('[data-provider]').forEach(button => button.onclick = async () => {
        const [name, provider] = found[Number(button.dataset.provider)];
        button.disabled = true; button.querySelector('em').textContent = 'opening…';
        try { const result = await useProvider(name, provider); wrap.remove(); resolve(result); }
        catch (error) { button.disabled = false; button.querySelector('em').textContent = 'try again'; toast(error.message || 'Wallet connection was rejected.', 'error'); }
      });
    });
  }

  async function connect() {
    if (state.address && state.provider) return state;
    return walletModal();
  }

  async function signAndSend(transaction) {
    if (!state.provider || !state.address) await connect();
    if (!state.provider.signTransaction) throw new Error(`${state.name || 'This wallet'} does not support transaction signing.`);
    const signed = await state.provider.signTransaction(transaction);
    const bytes = signed.serialize();
    let binary = ''; for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    const signature = await rpc('sendTransaction', [btoa(binary), { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 }]);
    toast('Transaction submitted. Waiting for confirmation…');
    return signature;
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
    if (!button) return; event.preventDefault(); connect().catch(error => { if (!/cancelled/i.test(error.message)) toast(error.message, 'error'); });
  });
  window.OnemodWallet = { state, connect, trade, createCoin, rpc, toast, short };
  window.addEventListener('DOMContentLoaded', async () => {
    const remembered = localStorage.getItem('onemod-wallet');
    const match = providers().find(([name]) => name === remembered);
    if (match) { try { await useProvider(match[0], match[1], { onlyIfTrusted: true }); } catch {} }
    updateButtons();
  }, { once: true });
})();
