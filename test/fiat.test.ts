import { describe, expect, it } from 'vitest';

import { stroopsToFiat } from '@/lib/fiat';

describe('stroopsToFiat', () => {
  it('treats API amount strings as stroops, not whole XLM', () => {
    // 300 XLM at 0.20 USD is 60 USD.
    expect(stroopsToFiat('3000000000', 0.2, 'USD')).toBe('~ $60.00');
  });

  it('accepts bigint amounts from the donate form', () => {
    expect(stroopsToFiat(500_000_000n, 0.2, 'USD')).toBe('~ $10.00');
  });

  it('shows small values with more precision', () => {
    expect(stroopsToFiat('10000000', 0.123456, 'USD')).toBe('~ $0.1235');
  });

  it('returns null for zero, negative or invalid amounts', () => {
    expect(stroopsToFiat('0', 0.2, 'USD')).toBeNull();
    expect(stroopsToFiat('-5', 0.2, 'USD')).toBeNull();
    expect(stroopsToFiat('abc', 0.2, 'USD')).toBeNull();
  });
});
