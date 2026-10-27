# 0003: Handle amounts as bigint from the API to the screen

Status: Accepted

## Context

Soroban token amounts are `i128`. A JavaScript number is a 64 bit float and silently loses precision above 2^53. A rounding error in a money app erodes trust.

## Decision

The backend returns amounts as strings. The frontend parses them into `bigint` and keeps them as `bigint` until the moment they are formatted for display, using `NEXT_PUBLIC_TOKEN_DECIMALS`. No amount passes through `Number()`.

## Consequences

- No precision loss between the chain, the API and the screen.
- Contributors must use the formatting helpers in `src/lib/` and must not do arithmetic on amounts with plain numbers.
- Sums, percentages and progress bars need `bigint` friendly math. Convert only the final ratio for display.
