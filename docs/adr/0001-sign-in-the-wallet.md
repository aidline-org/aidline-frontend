# 0001: Build transactions in the app, sign them in the wallet

Status: Accepted

## Context

Donors, creators and verifiers all act by sending Soroban transactions. The app must never hold keys, and users should be able to use the wallet they already have.

## Decision

The app builds and simulates each transaction with `@stellar/stellar-sdk`, then asks the user's wallet to sign it through Stellar Wallets Kit. The signed transaction is submitted to Soroban RPC and polled until confirmed. See `src/lib/stellar/tx.ts`.

The app has no server side signing and no custody. The backend is never in the signing path.

## Consequences

- Any wallet supported by Stellar Wallets Kit works, including Freighter, xBull, Albedo, Lobstr and Hana.
- There are no secrets to protect in the frontend, and a compromised site cannot sign for users without their approval in the wallet.
- Simulation errors from the contract are translated into readable messages in `src/lib/`.
- The user's wallet network must match `NEXT_PUBLIC_STELLAR_NETWORK`. A mismatch is a common cause of failed transactions.
