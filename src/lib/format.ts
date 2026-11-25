import { config } from './config';

/** Shown in place of an amount that is missing or not a whole number of base units. */
export const UNKNOWN_AMOUNT = 'unknown';

/**
 * Formats a token amount given in the smallest unit (a string or bigint, as
 * the API returns it) without ever converting through a JS number.
 *
 * Never throws: an amount that is empty, `null`, `undefined`, has a decimal
 * point or is not numeric returns the placeholder `unknown` (UNKNOWN_AMOUNT),
 * with no symbol, so one bad value cannot take a whole page down.
 */
export function formatAmount(
  raw: string | bigint | null | undefined,
  opts: { decimals?: number; maxFraction?: number; symbol?: boolean } = {},
): string {
  const decimals = opts.decimals ?? config.tokenDecimals;
  const maxFraction = opts.maxFraction ?? 2;
  let value: bigint;
  try {
    if (raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')) {
      return UNKNOWN_AMOUNT;
    }
    value = BigInt(raw);
  } catch {
    return UNKNOWN_AMOUNT;
  }
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);

  const whole = (abs / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let fraction = (abs % base).toString().padStart(decimals, '0').slice(0, maxFraction);
  fraction = fraction.replace(/0+$/, '');

  const text = `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
  return opts.symbol === false ? text : `${text} ${config.tokenSymbol}`;
}

/**
 * Parses a user typed amount like "12.5" into the smallest unit. Returns null if invalid.
 *
 * Accepts:
 * - Plain digits: `50`, `0`
 * - A decimal point with digits on either side (or both): `12.5`, `.5`, `5.`
 * - Thousands separators in the right places: `1,000`, `12,500.5`
 *
 * Rejects empty input, `.` on its own, European decimals like `12,5`, and malformed
 * groups like `1,2,3`, `,5`, or `12,,000`.
 */
export function parseAmount(input: string, decimals = config.tokenDecimals): bigint | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  // Either `whole` (plain or grouped) with an optional `.fraction`, or a leading `.fraction`.
  // Group 1 is the whole part; group 2 is the fraction after a whole; group 3 is the
  // fraction when the number has no whole part (".5").
  const match = /^(?:(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d*))?|\.(\d+))$/.exec(trimmed);
  if (!match) return null;
  const whole = match[3] !== undefined ? '0' : match[1]!.replace(/,/g, '');
  const fraction = match[3] ?? match[2] ?? '';
  if (fraction.length > decimals) return null;
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
}

export function capAmount(amount: bigint, limit: bigint | null): bigint {
  return limit !== null && limit < amount ? limit : amount;
}

export function amountInput(amount: bigint): string {
  return formatAmount(amount, { symbol: false, maxFraction: config.tokenDecimals }).replace(
    /,/g,
    '',
  );
}

/** Share of `part` in `total` as a 0 to 100 number, safe for bigint strings. */
export function percent(part: string | bigint, total: string | bigint): number {
  const t = BigInt(total);
  if (t === 0n) return 0;
  return Number((BigInt(part) * 10_000n) / t) / 100;
}

export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Returns `null` for empty strings, invalid Date values, or inputs that `new Date` cannot parse. */
function safeDate(iso: string | Date): Date | null {
  if (typeof iso === 'string' && iso.trim() === '') return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date as "03 Oct 2026". Pass an Intl locale tag to use another language's month names.
 * Returns an empty string for invalid input so one bad API date cannot take a whole page down.
 */
export function formatDate(iso: string | Date, intlLocale?: string): string {
  const date = safeDate(iso);
  if (!date) return '';
  if (!intlLocale) return dateFmt.format(date);
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats a timestamp into a relative human-readable description (e.g., "3 hours ago", "just now").
 * Accepts a reference `now` date for deterministic testing.
 *
 * Time complexity: O(1)
 * Space complexity: O(1)
 */
export function formatRelativeTime(iso: string | Date, now = new Date()): string {
  const target = typeof iso === 'string' ? new Date(iso) : iso;
  const elapsedMs = now.getTime() - target.getTime();

  if (Number.isNaN(elapsedMs)) {
    return '';
  }

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  if (elapsedSeconds < 60) {
    return 'just now';
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) {
    return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
  }

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return `${elapsedMonths} month${elapsedMonths === 1 ? '' : 's'} ago`;
  }

  const elapsedYears = Math.floor(elapsedDays / 365);
  return `${elapsedYears} year${elapsedYears === 1 ? '' : 's'} ago`;
}

export type DeadlineParts =
  | { kind: 'ended' }
  | { kind: 'withinHour' }
  | { kind: 'hours'; hours: number }
  | { kind: 'days'; days: number };

/**
 * The deadline as data, so each language can word it: ended, ends within the hour,
 * N hours left (under a day), or N whole days left.
  | { kind: 'today' }
  | { kind: 'days'; days: number }
  | { kind: 'unknown' };

/**
 * The deadline as data, so each language can word it: ended, ends today, N whole days left,
 * or `unknown` when the input is not a valid date.
 */
export function deadlineParts(iso: string, now = new Date()): DeadlineParts {
  const date = safeDate(iso);
  if (!date) return { kind: 'unknown' };
  const ms = date.getTime() - now.getTime();
  if (ms < 0) return { kind: 'ended' };
  if (ms < 3_600_000) return { kind: 'withinHour' };
  if (ms < 86_400_000) return { kind: 'hours', hours: Math.floor(ms / 3_600_000) };
  return { kind: 'days', days: Math.floor(ms / 86_400_000) };
}

/** "12 days left", "9 hours left", "Ends within the hour", "Ended 3 Oct 2026" */
/** "12 days left", "Ends today", "Ended 3 Oct 2026", or "" for an invalid input. */
export function deadlineLabel(iso: string, now = new Date()): string {
  const parts = deadlineParts(iso, now);
  if (parts.kind === 'unknown') return '';
  if (parts.kind === 'ended') return `Ended ${formatDate(iso)}`;
  if (parts.kind === 'withinHour') return 'Ends within the hour';
  if (parts.kind === 'hours') return `${parts.hours} hour${parts.hours === 1 ? '' : 's'} left`;
  return `${parts.days} day${parts.days === 1 ? '' : 's'} left`;
}

/**
 * Splits campaign description text into paragraphs on blank lines.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
