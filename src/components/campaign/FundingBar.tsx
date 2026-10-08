'use client';

import type { CampaignKind } from '@/lib/api';
import { useFiat } from '@/lib/fiat';
import { formatAmount, percent } from '@/lib/format';

import { KIND } from './kind';

interface Props {
  kind: CampaignKind;
  goal: string;
  raised: string;
  released: string;
  size?: 'sm' | 'lg';
  showFigures?: boolean;
}

/**
 * Three segments: released (solid), held in escrow (hatched), still needed
 * (empty). See DESIGN.md, "Funding bar".
 */
export function FundingBar({
  kind,
  goal,
  raised,
  released,
  size = 'sm',
  showFigures = true,
}: Props) {
  const { formatFiat } = useFiat();
  const k = KIND[kind];
  const escrow = (BigInt(raised) - BigInt(released)).toString();
  const needed = (BigInt(goal) - BigInt(raised)).toString();
  const releasedPct = percent(released, goal);
  const escrowPct = percent(escrow, goal);

  const releasedFiat = formatFiat(released);
  const escrowFiat = formatFiat(escrow);
  const goalFiat = formatFiat(goal);

  const label = `${formatAmount(released)} released, ${formatAmount(escrow)} in escrow, ${formatAmount(needed)} still needed of ${formatAmount(goal)}`;

  return (
    <div>
      <div
        role="img"
        aria-label={label}
        className={`flex w-full overflow-hidden border border-rule ${size === 'lg' ? 'h-4' : 'h-2.5'}`}
      >
        <div
          className={`${k.bg} transition-[width] duration-200`}
          style={{ width: `${releasedPct}%` }}
        />
        <div
          className={`hatch ${k.text} transition-[width] duration-200`}
          style={{ width: `${escrowPct}%` }}
        />
      </div>
      {showFigures && (
        <dl
          className={`figure mt-2.5 grid grid-cols-3 gap-2 ${size === 'lg' ? 'text-sm' : 'text-[0.8125rem]'}`}
        >
          <div>
            <dt className="flex items-center gap-1.5 font-sans text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              <span className={`inline-block h-2 w-2 ${k.bg}`} aria-hidden="true" />
              Released
            </dt>
            <dd className="mt-0.5 text-ink">
              {formatAmount(released)}
              {releasedFiat && (
                <span className="block font-mono text-[0.75rem] text-ink-muted">
                  {releasedFiat}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-sans text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              <span className={`hatch inline-block h-2 w-2 ${k.text}`} aria-hidden="true" />
              In escrow
            </dt>
            <dd className="mt-0.5 text-ink">
              {formatAmount(escrow)}
              {escrowFiat && (
                <span className="block font-mono text-[0.75rem] text-ink-muted">{escrowFiat}</span>
              )}
            </dd>
          </div>
          <div className="text-right">
            <dt className="font-sans text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              Goal
            </dt>
            <dd className="mt-0.5 text-ink">
              {formatAmount(goal)}
              {goalFiat && (
                <span className="block font-mono text-[0.75rem] text-ink-muted">{goalFiat}</span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
