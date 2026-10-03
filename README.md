# Aidline Frontend

Web app for **Aidline**, transparent funding for disaster relief and climate action on Stellar.

Donors give into an on chain escrow. Funds reach the people doing the work one milestone at a time, only after an independent verifier publishes evidence and approves the release. If a campaign stalls, donors reclaim what was never spent. This app is where all of that happens and where anyone can check it.

## What you can do

- **Donors:** browse campaigns, donate with [Freighter](https://www.freighter.app/), follow every payout to its proof, and reclaim unspent funds from cancelled or expired campaigns.
- **Campaign creators:** publish a campaign with milestones, a beneficiary wallet and a verifier, all in one signature. Cancel it if plans change.
- **Verifiers:** upload photos and documents for a milestone and release it in one step.
- **Anyone:** see live totals, a feed of verified releases, every campaign's milestone ledger and any wallet's giving history.

## Quick start

Requires Node.js 20 or newer and a running [aidline-backend](https://github.com/aidline-org/aidline-backend).

```sh
git clone https://github.com/aidline-org/aidline-frontend
cd aidline-frontend
npm install
cp .env.example .env.local   # defaults point at the shared testnet contract
npm run dev
```

Open http://localhost:3000.

To donate on testnet, install Freighter, switch it to **Testnet**, and fund your account with [Friendbot](https://laboratory.stellar.org/#account-creator?network=test).

## Configuration

All values are public and read at build time. See [`.env.example`](.env.example).

| Variable                                                 | Purpose                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                                    | Aidline backend URL                                        |
| `NEXT_PUBLIC_STELLAR_NETWORK`                            | `testnet`, `mainnet` or `futurenet`                        |
| `NEXT_PUBLIC_STELLAR_RPC_URL`                            | Soroban RPC endpoint used to build and submit transactions |
| `NEXT_PUBLIC_AIDLINE_CONTRACT_ID`                        | Deployed Aidline contract                                  |
| `NEXT_PUBLIC_AIDLINE_TOKEN_ID`                           | Token campaigns raise in                                   |
| `NEXT_PUBLIC_TOKEN_SYMBOL`, `NEXT_PUBLIC_TOKEN_DECIMALS` | How amounts are displayed                                  |

Never put secrets in `NEXT_PUBLIC_*` variables. They are shipped to every browser.

## Scripts

| Command                       | What it does                              |
| ----------------------------- | ----------------------------------------- |
| `npm run dev`                 | Development server                        |
| `npm run build` / `npm start` | Production build and server               |
| `npm test`                    | Unit tests (vitest)                       |
| `npm run lint`                | ESLint                                    |
| `npm run typecheck`           | Generates route types and runs TypeScript |
| `npm run format`              | Prettier                                  |

## How it is built

- **Next.js 16** with the App Router. Pages are server rendered from the backend API, so campaign data is always fresh.
- **Transactions** are built and simulated with `@stellar/stellar-sdk`, signed in Freighter, then polled until confirmed. See [`src/lib/stellar/tx.ts`](src/lib/stellar/tx.ts).
- **After a transaction** the UI waits for the indexer to catch up before refreshing, so donors see their gift reflected immediately. See [`src/lib/useTx.ts`](src/lib/useTx.ts).
- **Amounts** are handled as `bigint` from the API to the screen and never pass through a JavaScript number.
- **Fonts** are self hosted, so builds never depend on a network call.

```
src/
  app/                 routes: home, campaigns, campaign detail, start, verifiers, donors, how it works
  components/campaign  funding bar, milestone ledger, donate, refund, verifier and creator panels
  components/forms     create campaign, verifier application
  components/wallet    Freighter connection
  lib/                 API client, formatting, Stellar transactions, contract error messages
test/                  unit tests
```

## Design

Aidline has a deliberate visual identity: an editorial, field report look with paper and ink tones and exactly two signal colors. **Read [DESIGN.md](DESIGN.md) before changing anything visual.** Pull requests that drift toward generic UI patterns will be asked to follow it.

## Related repos

| Repo                                                                  |                         |
| --------------------------------------------------------------------- | ----------------------- |
| [aidline-contracts](https://github.com/aidline-org/aidline-contracts) | Soroban escrow contract |
| [aidline-backend](https://github.com/aidline-org/aidline-backend)     | Indexer and API         |
| [aidline-frontend](https://github.com/aidline-org/aidline-frontend)   | This repo               |

## License

Code is [MIT](LICENSE). Bundled fonts are licensed under the SIL Open Font License, see `src/app/fonts/`.
