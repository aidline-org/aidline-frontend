import type { CampaignDetail } from '@/lib/api';
import { formatAmount, formatDate } from '@/lib/format';
import { TxLink } from '@/components/ui/TxLink';

import { KIND } from './kind';
import { VerificationStamp } from './VerificationStamp';

export function MilestoneLedger({
  campaign,
  verifierName,
}: {
  campaign: CampaignDetail;
  verifierName: string | null;
}) {
  const k = KIND[campaign.kind];
  const nextIndex = campaign.status === 'active' ? campaign.milestonesReleased : -1;
  const cumulative = campaign.milestones.reduce<bigint[]>(
    (acc, m) => [...acc, (acc.at(-1) ?? 0n) + BigInt(m.amount)],
    [],
  );

  return (
    <ol className="relative">
      {campaign.milestones.map((m) => {
        const isNext = m.index === nextIndex;
        const image = m.proof?.files.filter((f) => f.type.startsWith('image/')) ?? [];
        const docs = m.proof?.files.filter((f) => !f.type.startsWith('image/')) ?? [];
        return (
          <li key={m.index} className="grid grid-cols-[2.5rem_1fr] gap-x-4 pb-10 last:pb-0">
            <div className="relative flex flex-col items-center">
              <span
                className={`figure z-10 flex h-8 w-8 items-center justify-center border text-[0.8125rem] ${
                  m.released
                    ? `${k.bg} border-transparent text-paper`
                    : isNext
                      ? 'border-ink bg-paper text-ink'
                      : 'border-rule bg-paper text-ink-muted'
                }`}
              >
                {m.index + 1}
              </span>
              <span className="absolute top-8 bottom-[-0.25rem] w-px bg-rule" aria-hidden="true" />
            </div>
            <div className="pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-medium text-ink">
                  Milestone {m.index + 1}
                  {isNext && <span className="kicker ml-3 text-ink">Next to verify</span>}
                </p>
                <p className="figure text-ink">
                  {formatAmount(m.amount)}
                  <span className="ml-2 text-[0.75rem] text-ink-muted">
                    cumulative {formatAmount(cumulative[m.index]!, { symbol: false })}
                  </span>
                </p>
              </div>

              {m.released && m.releasedAt ? (
                <div className="mt-3 space-y-3">
                  <VerificationStamp
                    verifier={campaign.verifier}
                    verifierName={verifierName}
                    date={m.releasedAt}
                  />
                  {m.proof ? (
                    <>
                      <p className="max-w-prose">{m.proof.note}</p>
                      {image.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {image.map((f) => (
                            <a key={f.url} href={f.url} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={f.url}
                                alt={m.proof?.note ?? f.name}
                                className="h-24 w-36 border border-rule object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      {docs.map((f) => (
                        <a
                          key={f.url}
                          href={f.url}
                          className="link block text-[0.875rem]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {f.name}
                        </a>
                      ))}
                    </>
                  ) : (
                    m.proofUri && (
                      <a
                        href={m.proofUri}
                        className="link text-[0.875rem]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Evidence published by the verifier
                      </a>
                    )
                  )}
                  <p className="text-[0.8125rem] text-ink-muted">
                    Released {formatDate(m.releasedAt)} · {m.txHash && <TxLink hash={m.txHash} />}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-[0.9375rem] text-ink-muted">
                  {campaign.status === 'active'
                    ? 'Awaiting verification. Funds for this milestone stay in escrow until then.'
                    : 'Not released. Unspent funds can be reclaimed by donors.'}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
