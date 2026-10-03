import { describe, expect, it } from 'vitest';

import { deadlineLabel, formatAmount, parseAmount, percent, shortAddress } from '@/lib/format';

describe('formatAmount', () => {
  it('formats stroops as XLM without losing precision', () => {
    expect(formatAmount('1200000000')).toBe('120 XLM');
    expect(formatAmount('12345678')).toBe('1.23 XLM');
    expect(formatAmount('0')).toBe('0 XLM');
  });

  it('groups thousands and handles amounts beyond Number.MAX_SAFE_INTEGER', () => {
    expect(formatAmount('123456789012345678901234567', { symbol: false })).toBe(
      '12,345,678,901,234,567,890.12',
    );
  });

  it('can show more fraction digits', () => {
    expect(formatAmount(1n, { maxFraction: 7 })).toBe('0.0000001 XLM');
  });
});

describe('parseAmount', () => {
  it('parses whole and decimal input into stroops', () => {
    expect(parseAmount('50')).toBe(500_000_000n);
    expect(parseAmount('12.5')).toBe(125_000_000n);
    expect(parseAmount('1,000')).toBe(10_000_000_000n);
    expect(parseAmount('0.0000001')).toBe(1n);
  });

  it('rejects invalid input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('1.00000001')).toBeNull();
  });

  it('round trips with formatAmount', () => {
    expect(formatAmount(parseAmount('42.25')!)).toBe('42.25 XLM');
  });
});

describe('percent', () => {
  it('computes shares of bigint strings', () => {
    expect(percent('250', '1000')).toBe(25);
    expect(percent('1', '3')).toBe(33.33);
    expect(percent('5', '0')).toBe(0);
  });
});

describe('shortAddress', () => {
  it('keeps both ends of an address', () => {
    expect(shortAddress('GABJQNRUN47I2HO2QF5HK6ZNZZ7Q7S3IZ2J5Y3Q2ZXSP7NVVBKAOFJBC')).toBe(
      'GABJ…FJBC',
    );
  });
});

describe('deadlineLabel', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  it('counts days left', () => {
    expect(deadlineLabel('2026-10-10T12:00:00Z', now)).toBe('7 days left');
    expect(deadlineLabel('2026-10-04T13:00:00Z', now)).toBe('1 day left');
    expect(deadlineLabel('2026-10-03T18:00:00Z', now)).toBe('Ends today');
  });
  it('shows the end date once passed', () => {
    expect(deadlineLabel('2026-10-01T00:00:00Z', now)).toBe('Ended 01 Oct 2026');
  });
});
