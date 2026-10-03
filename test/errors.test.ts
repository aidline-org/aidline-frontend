import { describe, expect, it } from 'vitest';

import { describeError } from '@/lib/stellar/errors';

describe('describeError', () => {
  it('maps contract error codes to plain sentences', () => {
    expect(describeError(new Error('HostError: Error(Contract, #8)'))).toMatch(/past its goal/);
    expect(describeError(new Error('Error(Contract, #11)'))).toMatch(/Refunds open/);
  });

  it('explains wallet rejections', () => {
    expect(describeError(new Error('User declined access'))).toBe(
      'The request was declined in your wallet.',
    );
  });

  it('passes through unknown errors, trimmed', () => {
    expect(describeError('boom')).toBe('boom');
    expect(describeError(new Error('x'.repeat(300))).length).toBeLessThanOrEqual(201);
  });
});
