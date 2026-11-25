import { describe, expect, it } from 'vitest';

import {
  amountInput,
  capAmount,
  deadlineLabel,
  formatDate,
  UNKNOWN_AMOUNT,
  formatAmount,
  formatRelativeTime,
  parseAmount,
  percent,
  shortAddress,
  splitParagraphs,
} from '@/lib/format';

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

  it('returns the placeholder instead of throwing for malformed amounts', () => {
    expect(UNKNOWN_AMOUNT).toBe('unknown');
    expect(formatAmount('')).toBe('unknown');
    expect(formatAmount('   ')).toBe('unknown');
    expect(formatAmount(null)).toBe('unknown');
    expect(formatAmount(undefined)).toBe('unknown');
    expect(formatAmount('12.5')).toBe('unknown');
    expect(formatAmount('abc')).toBe('unknown');
    expect(formatAmount('1e9')).toBe('unknown');
  });

  it('uses the same placeholder with or without the symbol', () => {
    expect(formatAmount('abc', { symbol: false })).toBe('unknown');
  });

  it('still formats valid amounts after a bad one', () => {
    expect(formatAmount('nope')).toBe('unknown');
    expect(formatAmount('1200000000')).toBe('120 XLM');
  });

  it('accepts negative amounts and surrounding whitespace that BigInt accepts', () => {
    expect(formatAmount('-12345678', { symbol: false })).toBe('-1.23');
    expect(formatAmount(' 1200000000 ', { symbol: false })).toBe('120');
  });
});

describe('parseAmount', () => {
  it('parses whole and decimal input into stroops', () => {
    expect(parseAmount('50')).toBe(500_000_000n);
    expect(parseAmount('12.5')).toBe(125_000_000n);
    expect(parseAmount('1,000')).toBe(10_000_000_000n);
    expect(parseAmount('0.0000001')).toBe(1n);
  });

  it('accepts a leading or trailing decimal point', () => {
    expect(parseAmount('.5')).toBe(5_000_000n);
    expect(parseAmount('5.')).toBe(50_000_000n);
    expect(parseAmount('.0000001')).toBe(1n);
  });

  it('accepts commas only in well formed thousands groups', () => {
    expect(parseAmount('1,000')).toBe(10_000_000_000n);
    expect(parseAmount('12,500.5')).toBe(125_005_000_000n);
    expect(parseAmount('1,000,000')).toBe(10_000_000_000_000n);
  });

  it('rejects invalid input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('1.00000001')).toBeNull();
    // #59: a lone decimal point is not an amount.
    expect(parseAmount('.')).toBeNull();
    // #58: commas have to sit on thousands boundaries.
    expect(parseAmount('12,5')).toBeNull();
    expect(parseAmount('1,2,3')).toBeNull();
    expect(parseAmount(',5')).toBeNull();
    expect(parseAmount('12,,000')).toBeNull();
    expect(parseAmount('1,00')).toBeNull();
    expect(parseAmount('1,0000')).toBeNull();
  });

  it('round trips with formatAmount', () => {
    expect(formatAmount(parseAmount('42.25')!)).toBe('42.25 XLM');
  });
});

describe('capAmount', () => {
  it('uses the amount when the limit is unknown or higher', () => {
    expect(capAmount(100n, null)).toBe(100n);
    expect(capAmount(100n, 200n)).toBe(100n);
  });

  it('caps the amount at a lower wallet balance', () => {
    expect(capAmount(100n, 40n)).toBe(40n);
  });
});

describe('amountInput', () => {
  it('keeps every decimal without a symbol or grouping', () => {
    expect(amountInput(123_450_000_000n)).toBe('12345');
    expect(amountInput(1n)).toBe('0.0000001');
    expect(parseAmount(amountInput(123_456_789n))).toBe(123_456_789n);
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
  });
  it('counts hours left under a day', () => {
    expect(deadlineLabel('2026-10-03T18:00:00Z', now)).toBe('6 hours left');
    expect(deadlineLabel('2026-10-03T13:00:00Z', now)).toBe('1 hour left');
  });
  it('says Ends within the hour under one hour away', () => {
    expect(deadlineLabel('2026-10-03T12:30:00Z', now)).toBe('Ends within the hour');
    expect(deadlineLabel('2026-10-03T12:00:01Z', now)).toBe('Ends within the hour');
  });
  it('shows the end date once passed', () => {
    expect(deadlineLabel('2026-10-01T00:00:00Z', now)).toBe('Ended 01 Oct 2026');
  });
  it('returns an empty string for invalid or empty dates', () => {
    expect(deadlineLabel('', now)).toBe('');
    expect(deadlineLabel('not-a-date', now)).toBe('');
    expect(deadlineLabel('2026-13-99', now)).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO string', () => {
    expect(formatDate('2026-10-01T00:00:00Z')).toBe('01 Oct 2026');
  });
  it('returns an empty string for invalid or empty input instead of throwing', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate(new Date('invalid'))).toBe('');
  });
});

describe('splitParagraphs', () => {
  it('splits on double newlines and trims whitespace', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    expect(splitParagraphs(text)).toEqual([
      'First paragraph.',
      'Second paragraph.',
      'Third paragraph.',
    ]);
  });

  it('handles multiple consecutive newlines and filters empty lines', () => {
    const text = 'First paragraph.\n\n\n\nSecond paragraph.\n\n';
    expect(splitParagraphs(text)).toEqual(['First paragraph.', 'Second paragraph.']);
  });

  it('returns empty array for empty string or only whitespace', () => {
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs('   \n\n   ')).toEqual([]);
  });
});

describe('formatRelativeTime', () => {
  const baseTime = new Date('2026-10-03T12:00:00Z');

  it('formats recent releases as "just now"', () => {
    expect(formatRelativeTime('2026-10-03T11:59:30Z', baseTime)).toBe('just now');
    expect(formatRelativeTime(baseTime, baseTime)).toBe('just now');
  });

  it('formats minutes ago with proper pluralization', () => {
    expect(formatRelativeTime('2026-10-03T11:59:00Z', baseTime)).toBe('1 minute ago');
    expect(formatRelativeTime('2026-10-03T11:15:00Z', baseTime)).toBe('45 minutes ago');
  });

  it('formats hours ago with proper pluralization', () => {
    expect(formatRelativeTime('2026-10-03T11:00:00Z', baseTime)).toBe('1 hour ago');
    expect(formatRelativeTime('2026-10-03T09:00:00Z', baseTime)).toBe('3 hours ago');
  });

  it('formats days ago with proper pluralization', () => {
    expect(formatRelativeTime('2026-10-02T12:00:00Z', baseTime)).toBe('1 day ago');
    expect(formatRelativeTime('2026-09-28T12:00:00Z', baseTime)).toBe('5 days ago');
  });

  it('formats months and years ago', () => {
    expect(formatRelativeTime('2026-08-03T12:00:00Z', baseTime)).toBe('2 months ago');
    expect(formatRelativeTime('2025-10-03T12:00:00Z', baseTime)).toBe('1 year ago');
  });

  it('returns empty string for invalid date values', () => {
    expect(formatRelativeTime('invalid-date')).toBe('');
  });
});
