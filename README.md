# Onemod

Onemod is a live Pump.fun discovery, launch and trading interface for Solana.

## Local development

```bash
npm install
npm start
```

Open `http://127.0.0.1:4184/`. The static site is published under `/onemod/` on GitHub Pages.

## Runtime integrations

- Solana Wallet Standard for wallet discovery and signing
- PumpPortal local transaction builder for Pump.fun create, buy and sell transactions
- PumpPortal WebSocket for live Pump.fun creation events`r`n- Direct Solana bonding-curve account subscriptions for live price updates
- Solana JSON-RPC for balances, broadcast and confirmation

Private keys never enter the application. Every transaction is reviewed and signed by the connected wallet.

