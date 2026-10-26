# Onemod

Onemod is a modular genesis layer for tokens launching into Pump.fun.

## Local development

```bash
npm install
npm run build:client
npm start
```

The local app is served at `http://127.0.0.1:4184/`.

## Launch flow

The launch form connects to Phantom or Solflare, generates the mint keypair in the browser, builds the official Pump `create_v2` instruction, and asks the connected wallet to sign and submit it. It never requests or transmits a wallet private key and it does not attach a creator buy.

The Node server provides metadata storage and a launch registry. Registry entries are accepted only after the server confirms that the transaction succeeded and references the official Pump program, the submitted mint, and the creator wallet.

GitHub Pages hosts the static client at `https://dellmodrun.github.io/onemod/`. On a static deployment, creators can use a permanent metadata URI; image upload and the shared Board require the Node server or an equivalent persistent backend.
