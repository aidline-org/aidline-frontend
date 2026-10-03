import Link from 'next/link';

import { CampaignCard } from '@/components/campaign/CampaignCard';
import { ReleaseFeed } from '@/components/campaign/ReleaseFeed';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { api, type Stats } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { safe } from '@/lib/safe';

export default async function HomePage() {
  const [stats, releases, campaigns] = await Promise.all([
    safe(api.stats),
    safe(() => api.releases(5)),
    safe(() => api.campaigns({ status: 'active', limit: 3 })),
  ]);
  const offline = !stats;

  return (
    <>
      <Container className="grid gap-12 pt-14 pb-16 md:grid-cols-12 md:pt-20">
        <div className="md:col-span-7">
          <p className="kicker">Diaspora giving for relief and climate, on Stellar</p>
          <h1 className="mt-5 text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem]">
            Give back home. See exactly where it lands.
          </h1>
          <p className="mt-6 max-w-[34rem] text-[1.125rem]">
            Communities abroad already send billions home every year. Aidline lets them fund floods,
            droughts and climate projects with proof: gifts wait in escrow and are released one
            milestone at a time, only after an independent verifier confirms the work. If a campaign
            stalls, donors take back what was never spent.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/campaigns" className="btn btn-primary">
              Browse campaigns
            </Link>
            <Link href="/how-it-works" className="btn btn-secondary">
              How verification works
            </Link>
          </div>
        </div>
        <aside className="md:col-span-5 md:border-l md:border-rule md:pl-10">
          <p className="kicker">The ledger so far</p>
          {offline ? (
            <div className="mt-5">
              <Notice title="Live figures are unavailable">
                The Aidline API could not be reached. Figures will return once it is back.
              </Notice>
            </div>
          ) : (
            <LedgerFigures stats={stats} />
          )}
        </aside>
      </Container>

      <section className="border-t border-rule bg-paper-raised py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Latest verified releases</p>
              <h2 className="mt-3 text-[2rem]">Money moves only when the work is proven</h2>
            </div>
            <p className="max-w-sm text-[0.9375rem] text-ink-muted">
              Each payout below was approved by a verifier who attached evidence. Every line links
              to its transaction.
            </p>
          </div>
          <div className="mt-10">
            {releases ? <ReleaseFeed releases={releases.items} /> : <ReleaseFeed releases={[]} />}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Open campaigns</p>
            <h2 className="mt-3 text-[2rem]">Raised by communities abroad, for home</h2>
          </div>
          <Link href="/campaigns" className="link">
            All campaigns
          </Link>
        </div>
        {campaigns && campaigns.items.length > 0 ? (
          <div className="mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.items.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border-y border-rule py-8 text-ink-muted">
            No campaigns are open right now.{' '}
            <Link href="/start" className="link">
              Start one
            </Link>
            .
          </p>
        )}
      </Container>

      <section className="border-t border-rule">
        <Container className="grid gap-10 py-16 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p className="figure text-sm text-ink-muted">{s.n}</p>
              <h3 className="mt-3 text-[1.5rem]">{s.title}</h3>
              <p className="mt-3">{s.body}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'You give into escrow',
    body: 'From Montreal, London or Houston, your gift goes to a smart contract, not a bank account or a middleman. Nobody can spend it yet, including us.',
  },
  {
    n: '02',
    title: 'The work is verified',
    body: 'An independent verifier checks each milestone on the ground and publishes photos, receipts or reports.',
  },
  {
    n: '03',
    title: 'Funds are released, or returned',
    body: 'Approval pays that milestone to the people doing the work. If a campaign stalls, you reclaim your unspent share.',
  },
];

function LedgerFigures({ stats }: { stats: Stats }) {
  const escrow = (
    BigInt(stats.totalDonated) -
    BigInt(stats.totalReleased) -
    BigInt(stats.totalRefunded)
  ).toString();
  const rows: [string, string][] = [
    ['Donated', formatAmount(stats.totalDonated)],
    ['Released after verification', formatAmount(stats.totalReleased)],
    ['Held in escrow', formatAmount(escrow)],
    ['Milestones verified', String(stats.milestonesVerified)],
    ['Open campaigns', String(stats.activeCampaigns)],
    ['Donors', String(stats.donors)],
  ];
  return (
    <dl className="mt-5">
      {rows.map(([label, value], i) => (
        <div
          key={label}
          className={`flex items-baseline justify-between gap-4 border-b border-rule py-3.5 ${i === 0 ? 'border-t' : ''}`}
        >
          <dt className="text-[0.9375rem]">{label}</dt>
          <dd className={`figure text-ink ${i < 3 ? 'text-[1.25rem]' : 'text-[1.0625rem]'}`}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
