import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CampaignCover } from '@/components/campaign/CampaignCover';
import { CreatorPanel } from '@/components/campaign/CreatorPanel';
import { DonatePanel } from '@/components/campaign/DonatePanel';
import { FundingBar } from '@/components/campaign/FundingBar';
import { KIND, STATUS_LABEL } from '@/components/campaign/kind';
import { MilestoneLedger } from '@/components/campaign/MilestoneLedger';
import { RefundPanel } from '@/components/campaign/RefundPanel';
import { VerifierPanel } from '@/components/campaign/VerifierPanel';
import { Container } from '@/components/ui/Container';
import { api, ApiError } from '@/lib/api';
import { explorer } from '@/lib/config';
import { deadlineLabel, formatAmount, formatDate, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';

async function load(id: string) {
  if (!/^\d+$/.test(id)) notFound();
  try {
    return await api.campaign(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata(props: PageProps<'/campaigns/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const c = await safe(() => api.campaign(id));
  return {
    title: c?.metadata?.title ?? `Campaign #${id}`,
    description: c?.metadata?.summary,
  };
}

export default async function CampaignPage(props: PageProps<'/campaigns/[id]'>) {
  const { id } = await props.params;
  const [campaign, donations] = await Promise.all([load(id), safe(() => api.donations(id, 10))]);
  const verifier = await safe(() => api.verifier(campaign.verifier));
  const k = KIND[campaign.kind];
  const m = campaign.metadata;
  const refundable = campaign.status === 'cancelled' || campaign.status === 'expired';

  return (
    <article>
      <Container className="pt-10">
        <Link href="/campaigns" className="link text-sm">
          All campaigns
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <header className="lg:col-span-8">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em]">
              <span className={k.text}>{k.label}</span>
              <span className="text-rule"> / </span>
              <span className="text-ink-muted">{m?.location ?? 'Unknown location'}</span>
              <span className="text-rule"> / </span>
              <span className="text-ink-muted">{STATUS_LABEL[campaign.status]}</span>
            </p>
            <h1 className="mt-4 text-[2.5rem] sm:text-[3.25rem]">
              {m?.title ?? `Campaign #${campaign.id}`}
            </h1>
            {m?.summary && (
              <p className="mt-5 max-w-[40rem] text-[1.1875rem] text-ink-soft">{m.summary}</p>
            )}
            {m?.organizer && (
              <p className="mt-4 text-[0.9375rem] text-ink-muted">
                Raised by <span className="text-ink">{m.organizer}</span>
              </p>
            )}
          </header>
        </div>
      </Container>

      <Container className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CampaignCover campaign={campaign} className="aspect-video w-full" />

          {m?.description && (
            <section className="mt-12">
              <p className="kicker">The situation</p>
              <div className="mt-4 max-w-[68ch] space-y-4 text-[1.0625rem]">
                {m.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
              <div>
                <p className="kicker">Milestone ledger</p>
                <h2 className="mt-2 text-[1.75rem]">How the money is released</h2>
              </div>
              <p className="figure text-sm text-ink-muted">
                {campaign.milestonesReleased} / {campaign.milestones.length} verified
              </p>
            </div>
            <div className="mt-8">
              <MilestoneLedger campaign={campaign} verifierName={verifier?.orgName ?? null} />
            </div>
          </section>

          <section className="mt-14">
            <p className="kicker">Recent donations</p>
            {donations && donations.items.length > 0 ? (
              <ul className="mt-4 border-t border-rule">
                {donations.items.map((d) => (
                  <li
                    key={d.txHash}
                    className="figure flex justify-between gap-4 border-b border-rule py-3 text-sm"
                  >
                    <Link href={`/donors/${d.donor}`} className="link">
                      {shortAddress(d.donor, 6)}
                    </Link>
                    <span className="text-ink-muted">{formatDate(d.createdAt)}</span>
                    <span className="text-ink">{formatAmount(d.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-ink-muted">No donations yet. Yours could be the first.</p>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-8 lg:sticky lg:top-24">
            <section className="border-t-2 border-ink pt-5">
              <FundingBar
                kind={campaign.kind}
                goal={campaign.goal}
                raised={campaign.raised}
                released={campaign.released}
                size="lg"
              />
              <p className="mt-4 flex justify-between text-sm text-ink-muted">
                <span>
                  {campaign.donorCount} donor{campaign.donorCount === 1 ? '' : 's'}
                </span>
                <span>
                  {campaign.status === 'active'
                    ? deadlineLabel(campaign.deadline)
                    : STATUS_LABEL[campaign.status]}
                </span>
              </p>
            </section>

            <section>
              {campaign.status === 'active' && <DonatePanel campaign={campaign} />}
              {refundable && <RefundPanel campaign={campaign} />}
              {campaign.status === 'completed' && (
                <p className="text-[0.9375rem]">
                  Every milestone has been verified and released. Thank you to everyone who gave.
                </p>
              )}
            </section>

            <VerifierPanel campaign={campaign} />
            <CreatorPanel campaign={campaign} />

            <section>
              <p className="kicker">On the record</p>
              <dl className="mt-3 border-t border-rule text-sm">
                <Fact label="Verified by">
                  <Link href={`/verifiers/${campaign.verifier}`} className="link">
                    {verifier?.orgName ?? shortAddress(campaign.verifier, 5)}
                  </Link>
                </Fact>

                <Fact label="Paid to">
                  <AddressLink address={campaign.beneficiary} />
                </Fact>
                <Fact label="Created by">
                  <AddressLink address={campaign.creator} />
                </Fact>
                <Fact label="Deadline">{formatDate(campaign.deadline)}</Fact>
                <Fact label="Campaign id">
                  <span className="figure">#{campaign.id}</span>
                </Fact>
              </dl>
            </section>
          </div>
        </aside>
      </Container>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-rule py-2.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

function AddressLink({ address }: { address: string }) {
  return (
    <a href={explorer.account(address)} target="_blank" rel="noreferrer" className="link figure">
      {shortAddress(address, 5)}
    </a>
  );
}
