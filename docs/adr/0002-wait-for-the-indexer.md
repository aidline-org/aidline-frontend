# 0002: Wait for the indexer before refreshing after a transaction

Status: Accepted

## Context

Pages show data from the backend, which learns about on chain changes by polling Soroban RPC. A transaction can be confirmed on chain a few seconds before the backend has indexed it. Refreshing immediately would show the donor stale numbers and make a successful gift look like it did nothing.

## Decision

After a transaction confirms, the app waits for the backend indexer to catch up before it refreshes the page. See `src/lib/useTx.ts`.

## Consequences

- Donors see their donation reflected as soon as the page updates.
- If the backend is slow or down, the transaction still succeeded on chain. The page may update late, and the UI must not present that as a failure.
- The behavior depends on the backend reporting its indexed ledger, which `/health` does.
