# Environment variables

Copy [`.env.example`](../.env.example) to `.env.local` for local development.

Every variable here is public. `NEXT_PUBLIC_*` values are inlined into the JavaScript bundle at build time and sent to every browser, so **never put a secret in one**. Changing a value needs a rebuild.

## Site

| Variable               | Example                               | Purpose                                                    |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://aidline-frontend.vercel.app` | Public URL of the site. Used in the sitemap and robots.txt |

## Backend

| Variable              | Example                 | Purpose                                                              |
| --------------------- | ----------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL of aidline-backend. It must be reachable from the user's browser |

## Stellar network

| Variable                      | Example                               | Purpose                                                     |
| ----------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet`                             | `testnet`, `mainnet` or `futurenet`                         |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC used to build, simulate and submit transactions |

## Contract and token

| Variable                          | Example | Purpose                                     |
| --------------------------------- | ------- | ------------------------------------------- |
| `NEXT_PUBLIC_AIDLINE_CONTRACT_ID` | `C...`  | Deployed Aidline contract                   |
| `NEXT_PUBLIC_AIDLINE_TOKEN_ID`    | `C...`  | Token campaigns raise in. Match the backend |
| `NEXT_PUBLIC_TOKEN_SYMBOL`        | `XLM`   | Symbol shown next to amounts                |
| `NEXT_PUBLIC_TOKEN_DECIMALS`      | `7`     | Decimals used to display amounts            |

The defaults in `.env.example` point at the shared testnet deployment, so the app works out of the box.

## Keeping the pieces in sync

The frontend, [backend](https://github.com/aidline-org/aidline-backend) and [contract](https://github.com/aidline-org/aidline-contracts) must agree on three things: the **contract id**, the **token id** and the **network**. If the site looks empty or a donation fails, check these first.

## In CI

The build step sets `NEXT_PUBLIC_AIDLINE_CONTRACT_ID` so the production build passes. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
