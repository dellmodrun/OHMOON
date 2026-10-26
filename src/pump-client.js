import { PumpSdk } from '@pump-fun/pump-sdk';
import { Connection, Keypair, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { Buffer } from 'buffer';
import process from 'process';

globalThis.Buffer ||= Buffer;
globalThis.process ||= process;

const BASE = location.pathname === '/onemod' || location.pathname.startsWith('/onemod/') ? '/onemod' : '';
const STATIC_PAGES = location.hostname.endsWith('.github.io');
const RPC = localStorage.getItem('onemod_rpc') || 'https://rpc.solanatracker.io/public';
const connection = new Connection(RPC, 'confirmed');
const pump = new PumpSdk();
let provider = null;
let publicKey = null;

const short = value => `${value.slice(0, 4)}…${value.slice(-4)}`;
const providers = () => [window.phantom?.solana, window.solflare, window.solana].filter((p, i, all) => p && all.indexOf(p) === i);
const status = (message, type = 'info') => {
  const el = document.querySelector('#om-status');
  if (!el) return;
  el.className = 'om-status show';
  el.dataset.type = type;
  el.textContent = message;
};
const setWalletLabels = () => {
  document.querySelectorAll('.wchip-cta').forEach(button => {
    button.textContent = publicKey ? short(publicKey.toBase58()) : 'Connect wallet';
  });
  const submit = document.querySelector('.om-submit');
  if (submit) submit.textContent = publicKey ? 'Create token on Pump.fun' : 'Connect wallet to continue';
};

async function connect() {
  const list = providers();
  if (!list.length) {
    window.open('https://phantom.app/', '_blank', 'noopener');
    throw new Error('Install Phantom or Solflare to continue.');
  }
  provider = list[0];
  const result = await provider.connect();
  publicKey = result.publicKey || provider.publicKey;
  if (!publicKey) throw new Error('The wallet did not return a public key.');
  setWalletLabels();
  return publicKey;
}

const readDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

async function metadataUri(form) {
  const existing = form.uri.value.trim();
  if (existing) return existing;
  if (STATIC_PAGES) throw new Error('Add a permanent metadata URI. Image hosting is available when the Onemod server is deployed.');
  const file = form.image.files[0];
  if (!file) throw new Error('Add a token image or provide an existing metadata URI.');
  if (file.size > 2_000_000) throw new Error('Token image must be 2 MB or smaller.');
  status('Uploading token metadata…');
  const response = await fetch(`${BASE}/api/onemod/metadata`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: form.name.value.trim(),
      symbol: form.symbol.value.trim().toUpperCase(),
      description: form.description.value.trim(),
      imageData: await readDataUrl(file),
      twitter: form.twitter.value.trim(),
      website: form.website.value.trim()
    })
  });
  if (!response.ok) {
    throw new Error(response.status === 404
      ? 'Metadata hosting is unavailable on this deployment. Provide a permanent metadata URI to continue.'
      : `Metadata upload failed (${response.status}).`);
  }
  return (await response.json()).uri;
}

async function createToken(form) {
  if (!publicKey) await connect();
  const name = form.name.value.trim();
  const symbol = form.symbol.value.trim().toUpperCase();
  if (name.length < 2 || name.length > 32) throw new Error('Token name must be between 2 and 32 characters.');
  if (!/^[A-Z0-9]{2,10}$/.test(symbol)) throw new Error('Ticker must use 2–10 letters or numbers.');
  const uri = await metadataUri(form);
  status('Building the official Pump create_v2 transaction…');
  const mint = Keypair.generate();
  const createIx = await pump.createV2Instruction({
    mint: mint.publicKey,
    name,
    symbol,
    uri,
    creator: publicKey,
    user: publicKey,
    mayhemMode: false,
    cashback: false,
    holderReward: false
  });
  const latest = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({ feePayer: publicKey, recentBlockhash: latest.blockhash });
  transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 320000 }), createIx);
  transaction.partialSign(mint);
  status('Review and sign the transaction in your wallet.');
  const signed = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
  status(`Transaction sent: ${short(signature)}. Waiting for confirmation…`);
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight
  }, 'confirmed');
  if (confirmation.value.err) throw new Error(`Pump transaction failed: ${JSON.stringify(confirmation.value.err)}`);

  const record = {
    mint: mint.publicKey.toBase58(),
    signature,
    name,
    symbol,
    uri,
    creator: publicKey.toBase58(),
    createdAt: new Date().toISOString(),
    network: 'mainnet-beta'
  };
  const saved = JSON.parse(localStorage.getItem('onemod_launches') || '[]');
  saved.unshift(record);
  localStorage.setItem('onemod_launches', JSON.stringify(saved.slice(0, 50)));
  fetch(`${BASE}/api/onemod/launches`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(record)
  }).catch(() => {});
  window.Onemod?.renderLaunches?.(true);
  const explorer = `https://solscan.io/tx/${signature}`;
  const el = document.querySelector('#om-status');
  el.innerHTML = `Confirmed. Mint: <b>${record.mint}</b> · <a href="${explorer}" target="_blank" rel="noopener">view transaction ↗</a>`;
  el.dataset.type = 'success';
  return record;
}

function bind() {
  document.querySelectorAll('.wchip-cta').forEach(button => {
    if (button.dataset.omWallet === '1') return;
    button.dataset.omWallet = '1';
    button.addEventListener('click', () => connect().catch(error => status(error.message, 'error')));
  });
  const form = document.querySelector('#om-launch-form');
  if (!form || form.dataset.omBound === '1') return;
  form.dataset.omBound = '1';
  ['name', 'symbol', 'description'].forEach(key => form[key]?.addEventListener('input', () => {
    if (key === 'name') document.querySelector('#om-preview-name').textContent = form.name.value || 'Untitled token';
    if (key === 'symbol') document.querySelector('#om-preview-symbol').textContent = '$' + (form.symbol.value.toUpperCase() || 'TICKER');
    if (key === 'description') document.querySelector('#om-preview-description').textContent = form.description.value || 'Complete the manifest to prepare the Pump transaction.';
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('.om-submit');
    button.disabled = true;
    try {
      if (!publicKey) {
        await connect();
        status('Wallet connected. Review the manifest, then submit again.');
        return;
      }
      await createToken(form);
    } catch (error) {
      console.error(error);
      status(error.message || 'Unable to create the token.', 'error');
    } finally {
      button.disabled = false;
      setWalletLabels();
    }
  });
  const first = providers()[0];
  if (first?.isConnected && first.publicKey) {
    provider = first;
    publicKey = first.publicKey;
    setWalletLabels();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
