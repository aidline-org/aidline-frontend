# Deployment

The frontend is a Next.js app with server rendered pages. It reads campaign data from [aidline-backend](https://github.com/aidline-org/aidline-backend) and builds and submits Soroban transactions straight from the user's wallet. It holds no secrets and no signing keys.

The live demo runs on [Vercel](https://vercel.com) at [aidline-frontend.vercel.app](https://aidline-frontend.vercel.app).

## What you need

- Node.js 24 or newer (see [`.nvmrc`](../.nvmrc))
- A running backend that the browser can reach
- A deployed [Aidline contract](https://github.com/aidline-org/aidline-contracts) and its token id

## Deploy on Vercel

1. Import the repo into Vercel. The framework is detected as Next.js.
2. Add the environment variables from [ENVIRONMENT.md](ENVIRONMENT.md). At minimum set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AIDLINE_CONTRACT_ID`, `NEXT_PUBLIC_AIDLINE_TOKEN_ID` and `NEXT_PUBLIC_SITE_URL`.
3. Deploy. Vercel runs `npm run build`.
4. Open the site and check that the campaigns page lists campaigns.

All `NEXT_PUBLIC_*` values are read at **build time**. After you change one, redeploy.

## Deploy anywhere else

```sh
npm ci
npm run build
npm start        # serves on port 3000
```

Any host that can run a Node.js 24 process works, for example a container on Fly.io or Railway. Put it behind HTTPS.

## Connect it to the backend

1. Set `NEXT_PUBLIC_API_URL` to the public backend URL.
2. Add this site's origin to the backend's `CORS_ORIGINS`. Without it the browser blocks API calls.
3. Make sure the contract id and token id match the ones the backend indexes. A mismatch shows an empty site or failed donations.

## After a transaction

The app waits for the backend indexer to catch up before it refreshes the page, so donors see their gift appear. If the backend is slow or down, transactions still succeed on chain, but the page may not update until the indexer recovers.

## Embeddable widget

The `/embed/campaigns/{id}` route is meant to be shown inside an iframe on partner sites. It needs no extra setup. See the README for the snippet.

## Checks before you go live

- [ ] `npm run lint`, `npm run typecheck` and `npm test` pass
- [ ] `NEXT_PUBLIC_STELLAR_NETWORK` matches the contract's network
- [ ] `NEXT_PUBLIC_SITE_URL` is the real public URL, so the sitemap and robots.txt are correct
- [ ] The backend allows this origin in `CORS_ORIGINS`
- [ ] A test donation works with a wallet on the right network
- [ ] No secrets in any `NEXT_PUBLIC_*` variable. They are shipped to every browser

## Mainnet

Do not switch to mainnet until the contract has had an external audit. Then point the contract id, token id, RPC URL and network at the mainnet values, and use a fresh backend database.

## Troubleshooting

| Symptom                              | Likely cause                                                            |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Pages are empty or show an API error | `NEXT_PUBLIC_API_URL` is wrong, or the backend is down                  |
| Browser console shows a CORS error   | This origin is missing from the backend's `CORS_ORIGINS`                |
| A change to an env var has no effect | `NEXT_PUBLIC_*` is baked in at build time. Redeploy                     |
| Wallet transaction fails             | The wallet is on a different network than `NEXT_PUBLIC_STELLAR_NETWORK` |
| Donation does not show up            | The indexer is behind. Check the backend `/health` for lag              |
