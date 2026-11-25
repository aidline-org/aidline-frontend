import { describe, expect, it } from 'vitest';

import { deadlineLabel, deadlineParts, formatDate } from '@/lib/format';

const now = new Date('2026-10-03T12:00:00Z');

describe('deadlineParts', () => {
  it('reports whole days left', () => {
    expect(deadlineParts('2026-10-10T12:00:00Z', now)).toEqual({ kind: 'days', days: 7 });
    expect(deadlineParts('2026-10-04T13:00:00Z', now)).toEqual({ kind: 'days', days: 1 });
  });

  it('reports a deadline less than a day away in hours', () => {
    expect(deadlineParts('2026-10-03T18:00:00Z', now)).toEqual({ kind: 'hours', hours: 6 });
    expect(deadlineParts('2026-10-04T11:59:59Z', now)).toEqual({ kind: 'hours', hours: 23 });
  });

  it('reports a deadline less than an hour away as withinHour', () => {
    expect(deadlineParts('2026-10-03T12:30:00Z', now)).toEqual({ kind: 'withinHour' });
    expect(deadlineParts('2026-10-03T12:00:01Z', now)).toEqual({ kind: 'withinHour' });
  });

  it('reports a deadline in the past as ended', () => {
    expect(deadlineParts('2026-10-03T11:59:59Z', now)).toEqual({ kind: 'ended' });
    expect(deadlineParts('2026-01-01T00:00:00Z', now)).toEqual({ kind: 'ended' });
  });

  it('agrees with deadlineLabel in every case', () => {
    expect(deadlineLabel('2026-10-10T12:00:00Z', now)).toBe('7 days left');
    expect(deadlineLabel('2026-10-04T13:00:00Z', now)).toBe('1 day left');
    expect(deadlineLabel('2026-10-03T18:00:00Z', now)).toBe('6 hours left');
    expect(deadlineLabel('2026-10-03T13:00:00Z', now)).toBe('1 hour left');
    expect(deadlineLabel('2026-10-03T12:30:00Z', now)).toBe('Ends within the hour');
    expect(deadlineLabel('2026-10-01T00:00:00Z', now)).toBe('Ended 01 Oct 2026');
  });
});

describe('formatDate', () => {
  it('keeps the existing English style without a locale', () => {
    expect(formatDate('2026-10-03T00:00:00Z')).toBe('03 Oct 2026');
  });

  it('uses the month names of the language asked for', () => {
    expect(formatDate('2026-10-03T00:00:00Z', 'en-GB')).toBe('03 Oct 2026');
    expect(formatDate('2026-03-07T00:00:00Z', 'fr-FR')).toMatch(/^07 mars 2026$/);
    expect(formatDate('2026-03-07T00:00:00Z', 'es-ES')).toMatch(/^07 mar\.? 2026$/);
  });

  it('reads the date in UTC, so it does not slip a day with the reader\'s time zone', () => {
    expect(formatDate('2026-10-03T23:30:00Z', 'fr-FR')).toMatch(/^03 oct\.? 2026$/);
import {
  addDays,
  deadlineEndUtc,
  deadlineHint,
  defaultDeadline,
  localDate,
  minimumDeadline,
} from '@/lib/deadline';

describe('deadline dates', () => {
  const morningInSydney = new Date('2026-11-24T20:30:00Z');
  const utcPlusEleven = -660;

  it('uses the creator calendar day in a time zone ahead of UTC', () => {
    expect(localDate(morningInSydney, utcPlusEleven)).toBe('2026-11-25');
    expect(minimumDeadline(morningInSydney, utcPlusEleven)).toBe('2026-11-26');
    expect(defaultDeadline(morningInSydney, utcPlusEleven)).toBe('2026-12-25');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('stores the deadline at the end of the chosen UTC day', () => {
    expect(deadlineEndUtc('2026-11-26').toISOString()).toBe('2026-11-26T23:59:59.000Z');
  });

  it('explains the UTC end and shows the matching local time', () => {
    const hint = deadlineHint('2026-11-26', utcPlusEleven);
    expect(hint).toContain('23:59 UTC');
    expect(hint).toContain('Nov 27');
    expect(hint).toContain('10:59');
  });
});
