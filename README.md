# OhMoon

OhMoon is a survival launch layer for Pump.fun coins. Creator rewards follow a public time-based unlock schedule instead of becoming immediately claimable.

## Local development

```bash
npm install
npm start
```

Open `http://127.0.0.1:4184/`. The static site is published under `/OHMOON/` on GitHub Pages.

## Product model

- Coins are created and traded on Pump.fun.
- Creator rewards are intended to route through an OhMoon Survival Vault.
- The default unlock curve is 0% at launch, 20% on day 7, 50% on day 30 and 100% on day 90.
- The current public frontend is a beta and sends users to Pump.fun to authorize coin creation.

OhMoon is independent and is not affiliated with or endorsed by Pump.fun.

