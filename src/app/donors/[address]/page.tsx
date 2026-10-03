import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { KIND } from '@/components/campaign/kind';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { TxLink } from '@/components/ui/TxLink';
import { api } from '@/lib/api';
import { explorer } from '@/lib/config';
import { formatAmount, formatDate, percent, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';

export const metadata: Metadata = { title: 'Giving history' };

export default async function DonorPage(props: PageProps<'/donors/[address]'>) {
  const { address } = await props.params;
  if (!/^G[A-Z2-7]{55}$/.test(address)) notFound();
  const history = await safe(() => api.donor(address));

  return (
    <Container className="pt-12">
      <p className="kicker">Giving history</p>
      <h1 className="figure mt-3 break-all text-[1.75rem] font-normal sm:text-[2.25rem]">
        {shortAddress(address, 8)}
      </h1>
      <a
        href={explorer.account(address)}
        target="_blank"
        rel="noreferrer"
        className="link mt-2 inline-block text-sm"
      >
        View wallet on explorer
      </a>

      {!history ? (
        <div className="mt-10">
          <Notice title="History could not be loaded" tone="danger">
            The Aidline API is not responding.
          </Notice>
        </div>
      ) : (
        <>
          <dl className="mt-10 grid grid-cols-2 border-y border-rule md:grid-cols-3">
            <div className="py-5 pr-4">
              <dt className="kicker">Given</dt>
              <dd className="figure mt-2 text-2xl text-ink">
                {formatAmount(history.totalDonated)}
              </dd>
            </div>
            <div className="py-5 pr-4">
              <dt className="kicker">Campaigns supported</dt>
              <dd className="figure mt-2 text-2xl text-ink">{history.campaignsSupported}</dd>
            </div>
            <div className="py-5">
              <dt className="kicker">Reclaimed</dt>
              <dd className="figure mt-2 text-2xl text-ink">
                {formatAmount(history.refunds.reduce((s, r) => s + BigInt(r.amount), 0n))}
              </dd>
            </div>
          </dl>

          <section className="mt-12">
            <h2 className="text-[1.75rem]">Where it went</h2>
            {history.donations.length === 0 ? (
              <p className="mt-4 text-ink-muted">
                No donations from this wallet yet.{' '}
                <Link href="/campaigns" className="link">
                  Find a campaign
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-6 border-t border-rule">
                {history.donations.map((d) => (
                  <li
                    key={d.txHash}
                    className="grid gap-2 border-b border-rule py-5 md:grid-cols-[1fr_auto] md:gap-8"
                  >
                    <div>
                      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
                        <span className={KIND[d.kind].text}>{KIND[d.kind].short}</span>
                        <span className="text-ink-muted"> / {formatDate(d.createdAt)}</span>
                      </p>
                      <Link
                        href={`/campaigns/${d.campaignId}`}
                        className="mt-1 block font-serif text-lg text-ink hover:underline"
                      >
                        {d.campaignTitle ?? `Campaign #${d.campaignId}`}
                      </Link>
                      <p className="mt-1 text-sm text-ink-muted">
                        This campaign has released {percent(d.released, d.goal).toFixed(0)}% of its
                        goal after verification.
                      </p>
                    </div>
                    <div className="md:text-right">
                      <p className="figure text-ink">{formatAmount(d.amount)}</p>
                      <TxLink hash={d.txHash} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Container>
  );
}
