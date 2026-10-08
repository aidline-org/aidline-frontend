'use client';

import { useId, useState } from 'react';

import type { StatsHistoryPoint } from '@/lib/api';
import { formatAmount } from '@/lib/format';

interface DonationReleaseChartProps {
  history?: StatsHistoryPoint[] | null;
  totalDonated?: string;
  totalReleased?: string;
}

interface ChartPoint {
  date: string;
  donated: string;
  released: string;
}

const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

/** Missing values count as zero so one bad row cannot crash the page. */
const toXlm = (stroops: string | undefined) => Number(BigInt(stroops ?? '0') / 10000000n);

export function DonationReleaseChart({
  history,
  totalDonated,
  totalReleased,
}: DonationReleaseChartProps) {
  const [showTable, setShowTable] = useState(false);
  const chartId = useId();
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;

  // Real snapshots only. With fewer than two, the line starts from zero, which
  // is where the platform began. Without any data the chart is not shown.
  let points: ChartPoint[] = (history ?? []).map((h) => ({
    date: shortDate.format(new Date(`${h.snapshotDate}T00:00:00Z`)),
    donated: h.totalDonated,
    released: h.totalReleased,
  }));
  if (points.length < 2 && totalDonated && totalReleased) {
    const latest = points[0] ?? { date: 'Now', donated: totalDonated, released: totalReleased };
    points = [{ date: 'Start', donated: '0', released: '0' }, latest];
  }

  // Compute SVG dimensions and path coordinates
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...points.flatMap((p) => [toXlm(p.donated), toXlm(p.released)]), 100);

  const getX = (index: number) => paddingLeft + (index / (points.length - 1 || 1)) * chartW;

  const getY = (valStr: string) => {
    const val = toXlm(valStr);
    return paddingTop + chartH - (val / maxVal) * chartH;
  };

  const donatedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.donated)}`)
    .join(' ');

  const releasedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.released)}`)
    .join(' ');

  if (points.length === 0) return null;

  return (
    <div className="border border-rule bg-paper-raised p-6 rounded-[2px] shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
        <div>
          <p className="kicker">Cumulative Momentum</p>
          <h3 className="mt-1 text-xl font-serif text-ink" id={titleId}>
            Donations & Releases Over Time
          </h3>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-relief" />
              <span className="inline-block w-2 h-2 rounded-full bg-relief" />
              <span className="text-ink">Donated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-ink border-dashed" />
              <span className="inline-block w-2 h-2 border border-ink bg-paper" />
              <span className="text-ink font-medium">Released</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary text-xs py-1 px-2.5"
            onClick={() => setShowTable((prev) => !prev)}
            aria-expanded={showTable}
          >
            {showTable ? 'View Visual Chart' : 'View Data Table'}
          </button>
        </div>
      </div>

      <p id={descId} className="sr-only">
        Chart comparing total donated funds against released funds over time.
      </p>

      {!showTable ? (
        <div className="mt-6 w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[320px] max-w-full"
            role="img"
            aria-labelledby={`${titleId} ${descId}`}
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + chartH * (1 - ratio);
              const val = Math.round(maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="var(--rule)"
                    strokeWidth="1"
                    strokeDasharray={ratio === 0 ? undefined : '2 2'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--ink-muted)"
                    className="font-mono text-[10px]"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-axis date labels */}
            {points.map((p, i) => (
              <text
                key={p.date + i}
                x={getX(i)}
                y={height - 12}
                textAnchor="middle"
                fill="var(--ink-muted)"
                className="font-mono text-[11px]"
              >
                {p.date}
              </text>
            ))}

            {/* Donated Line (Relief color, solid line with circle dots) */}
            <path
              d={donatedPath}
              fill="none"
              stroke="var(--relief)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <circle
                key={`donated-pt-${i}`}
                cx={getX(i)}
                cy={getY(p.donated)}
                r="3.5"
                fill="var(--relief)"
              />
            ))}

            {/* Released Line (Ink color, dashed line with open square dots) */}
            <path
              d={releasedPath}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <rect
                key={`released-pt-${i}`}
                x={getX(i) - 3}
                y={getY(p.released) - 3}
                width="6"
                height="6"
                fill="var(--paper)"
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <caption className="sr-only">Donations and releases over time</caption>
            <thead>
              <tr className="border-b border-rule font-mono text-xs uppercase tracking-wider text-ink-muted">
                <th scope="col" className="py-2 pr-4">
                  Time Period
                </th>
                <th scope="col" className="py-2 px-4 text-right">
                  Donated
                </th>
                <th scope="col" className="py-2 pl-4 text-right">
                  Released
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {points.map((p) => (
                <tr key={p.date}>
                  <th scope="row" className="py-2.5 pr-4 font-normal text-ink">
                    {p.date}
                  </th>
                  <td className="py-2.5 px-4 text-right text-relief">{formatAmount(p.donated)}</td>
                  <td className="py-2.5 pl-4 text-right text-ink font-medium">
                    {formatAmount(p.released)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
