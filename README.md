# OhMoon

OhMoon is the survival layer for Pump.fun launches: a Solana launch, discovery and trading interface built around a transparent long-term reward curve.

## Local development

```bash
npm install
npm start
```

Open `http://127.0.0.1:4184/`. The static site is published under `/OHMOON/` on GitHub Pages.

## Runtime integrations

- Solana Wallet Standard for wallet discovery and signing
- PumpPortal local transaction builder for Pump.fun create, buy and sell transactions
- PumpPortal WebSocket for live Pump.fun creation events
- Direct Solana bonding-curve account subscriptions for live price updates
- Solana JSON-RPC for balances, broadcast and confirmation
- AR.IO Turbo for permanent token image and metadata storage
- GitHub Actions for a shared rolling feed of public Pump.fun launches

Private keys never enter the application. Upload ownership and every transaction are reviewed and signed by the connected wallet.

