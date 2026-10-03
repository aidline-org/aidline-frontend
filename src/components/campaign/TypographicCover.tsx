import type { CampaignKind } from '@/lib/api';

import { KIND } from './kind';

/** Cover drawn from campaign data when there is no photo. Never a stock image. */
export function TypographicCover({
  kind,
  location,
  className = '',
}: {
  kind: CampaignKind;
  location: string;
  className?: string;
}) {
  const k = KIND[kind];
  const [place, ...rest] = location.split(',');
  return (
    <div
      role="img"
      aria-label={`${k.label} in ${location}`}
      className={`relative flex flex-col justify-end overflow-hidden p-5 ${k.wash} ${className}`}
    >
      <svg
        className={`absolute right-0 top-0 h-full w-1/2 ${k.text} opacity-[0.18]`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1="0"
            x2="100"
            y1={10 + i * 10}
            y2={10 + i * 10}
            stroke="currentColor"
            strokeWidth="0.6"
          />
        ))}
      </svg>
      <p className="relative font-serif text-[2rem] leading-none text-ink">{place}</p>
      {rest.length > 0 && (
        <p className="relative mt-1.5 text-sm text-ink-soft">{rest.join(',').trim()}</p>
      )}
    </div>
  );
}
