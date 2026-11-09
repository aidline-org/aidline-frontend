# Architecture decision records

Short notes on decisions that shaped the frontend, written so a new contributor can see why things are the way they are before proposing a change.

To add one, copy the layout of an existing record, use the next number and open a pull request. Records are not edited once accepted. If a decision changes, write a new record that supersedes the old one.

| #                                    | Decision                                                   | Status   |
| ------------------------------------ | ---------------------------------------------------------- | -------- |
| [0001](0001-sign-in-the-wallet.md)   | Build transactions in the app, sign them in the wallet     | Accepted |
| [0002](0002-wait-for-the-indexer.md) | Wait for the indexer before refreshing after a transaction | Accepted |
| [0003](0003-amounts-are-bigint.md)   | Handle amounts as bigint from the API to the screen        | Accepted |
