'use client';

import { useI18n } from '@/components/i18n/I18nProvider';
import { INTL_TAG } from '@/i18n';
import { deadlineParts, formatDate } from '@/lib/format';

/** "12 days left", "9 hours left", "Ends within the hour" or "Ended 03 Oct 2026". */
export function DeadlineLabel({ deadline }: { deadline: string }) {
  const { locale, t, tn } = useI18n();
  const parts = deadlineParts(deadline);

  // The server and the browser can disagree by a few seconds about "now". That only matters at
  // a day boundary, and the browser's value is the right one, so the mismatch is allowed.
  return (
    <span suppressHydrationWarning>
      {parts.kind === 'ended'
        ? t('deadline.ended', { date: formatDate(deadline, INTL_TAG[locale]) })
        : parts.kind === 'withinHour'
          ? t('deadline.withinHour')
          : parts.kind === 'hours'
            ? tn('deadline.hours', parts.hours)
      {parts.kind === 'unknown'
        ? ''
        : parts.kind === 'ended'
          ? t('deadline.ended', { date: formatDate(deadline, INTL_TAG[locale]) })
          : parts.kind === 'today'
            ? t('deadline.today')
            : tn('deadline.days', parts.days)}
    </span>
  );
}
