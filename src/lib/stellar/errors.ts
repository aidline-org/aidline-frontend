// Mirrors contracts/aidline/src/errors.rs. Keep the codes in sync.
const CONTRACT_ERRORS: Record<number, string> = {
  1: 'This campaign does not exist.',
  2: 'This campaign is no longer active.',
  3: 'This campaign has passed its deadline.',
  4: 'Enter an amount greater than zero.',
  5: 'Milestones must be positive amounts, between 1 and 20 of them.',
  6: 'The deadline must be in the future.',
  7: 'That address is not a registered verifier.',
  8: 'That amount would take the campaign past its goal.',
  9: 'There is not enough in escrow to pay the next milestone yet.',
  10: 'Every milestone has already been released.',
  11: 'Refunds open once a campaign is cancelled or passes its deadline.',
  12: 'This wallet has nothing left to reclaim from this campaign.',
  13: 'This wallet is not allowed to do that.',
};

/** Turns RPC, contract and wallet failures into a sentence a donor can act on. */
export function describeError(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  const code = /Error\(Contract, #(\d+)\)/.exec(text)?.[1];
  if (code && CONTRACT_ERRORS[Number(code)]) return CONTRACT_ERRORS[Number(code)]!;
  if (/declined|rejected|denied/i.test(text)) return 'The request was declined in your wallet.';
  if (/account not found|Account not found/i.test(text))
    return 'This wallet has no funds on this network yet. Fund it first, then try again.';
  if (/balance|insufficient|underfunded/i.test(text))
    return 'This wallet does not have enough balance for that amount plus fees.';
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}
