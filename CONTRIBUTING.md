# Contributing to Aidline Frontend

Thanks for helping donors see where their money goes. This guide gets you from clone to merged pull request.

## Finding something to work on

- Issues labelled `good first issue` are small and well scoped.
- Every issue lists acceptance criteria and the files you will likely touch. Ask in the issue if anything is unclear.
- Comment on an issue to get assigned before you start.

## Working on a Stellar Wave issue

Issues labelled `Stellar Wave` are part of the [Stellar Wave program on Drips](https://docs.drips.network/wave/). Contributors earn points for resolved issues and share the Wave reward pool in proportion to their points.

| Complexity | Label                 | Points |
| ---------- | --------------------- | ------ |
| Trivial    | `complexity: trivial` | 100    |
| Medium     | `complexity: medium`  | 150    |
| High       | `complexity: high`    | 200    |

How it works:

1. Pick an open issue and comment to ask for it. A maintainer assigns it to you. Please take one issue at a time and check nobody else is already assigned.
2. Read the acceptance criteria. Every box needs to be true for the issue to count as resolved.
3. Open a pull request that links the issue with `Closes #123`. Keep it focused on that one issue.
4. Respond to review comments. A maintainer merges the pull request and marks the issue resolved, which awards the points.

Quality matters more than speed. Pull requests are reviewed for understanding, not just for passing checks:

- Write and run the tests for your change. Do not submit code you have not run or cannot explain.
- Do not open pull requests that only fix typos or reformat files to collect points.
- If you use an AI assistant, you are still responsible for every line. Pull requests that look untested or not understood will be closed.
- Do not claim several issues at once or comment on assigned issues asking to be reassigned.

See the Drips [Terms and rules](https://docs.drips.network/wave/terms-and-rules/) for the full conduct rules.

## Local setup

```sh
git clone https://github.com/aidline-org/aidline-frontend
cd aidline-frontend
npm install
cp .env.example .env.local
npm run dev
```

The default `.env.local` uses the shared testnet contract. Point `NEXT_PUBLIC_API_URL` at your local [aidline-backend](https://github.com/aidline-org/aidline-backend) (default `http://localhost:4000`).

## Before you open a pull request

1. Read [DESIGN.md](DESIGN.md) if your change touches anything visual. Use the existing tokens and components.
2. Run the checks CI runs:
   ```sh
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
3. Check your change at 360px and 1280px wide, in light and dark mode.
4. Add a screenshot to the pull request for any visual change.
5. Link the issue with `Closes #123`.

## Code guidelines

- Server components fetch data. Client components (`'use client'`) only where you need state, effects or the wallet.
- Keep token amounts as strings or `bigint`. Use `formatAmount` and `parseAmount` from `src/lib/format.ts`.
- Every contract call goes through `aidline.*` in `src/lib/stellar/tx.ts` and is run with `useTx`, so users always see what is happening.
- Interface copy follows the voice rules in DESIGN.md: plain, specific, no exclamation marks, no emoji.
- Every interactive element must be reachable and visible with the keyboard.

## Commit messages

Use a short prefix: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `style:`. Example: `feat: add campaign map to the home page`.
