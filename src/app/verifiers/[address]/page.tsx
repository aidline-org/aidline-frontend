import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CampaignCard } from '@/components/campaign/CampaignCard';
import { KIND } from '@/components/campaign/kind';
import { Container } from '@/components/ui/Container';
import { TxLink } from '@/components/ui/TxLink';
import { api } from '@/lib/api';
import { explorer } from '@/lib/config';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';

export async function generateMetadata(props: PageProps<'/verifiers/[address]'>): Promise<Metadata> {
  const { address } = await props.params;
  const v = await safe(() => api.verifier(address));
  return {
    title: v?.orgName ? `${v.orgName} · Verifier Profile` : 'Verifier Profile',
    description: v?.description ?? `Verifier profile for ${address}`,
  };
}

export default async function VerifierProfilePage(props: PageProps<'/verifiers/[address]'>) {
  const { address } = await props.params;
  if (!/^G[A-Z2-7]{55}$/.test(address)) notFound();

  const [verifier, campaigns, releases] = await Promise.all([
    safe(() => api.verifier(address)),
    safe(() => api.campaigns({ limit: 100 })),
    safe(() => api.releases(50)),
  ]);

  if (!verifier) {
    notFound();
  }

  const v = verifier;
  const verifierCampaigns = campaigns?.items.filter((c) => c.verifier === address) ?? [];
  const verifierReleases = releases?.items.filter((r) => r.verifier === address) ?? [];

  return (
    <Container className="pt-12">
      <Link href="/verifiers" className="link text-sm">
        All verifiers
      </Link>

      <div className="mt-8">
        <p className="kicker">Verifier profile</p>
        <h1 className="mt-3 font-serif text-[2.5rem] text-ink sm:text-[3rem]">
          {v.orgName ?? 'Unnamed verifier'}
        </h1>
        {v.country && <p className="mt-1 text-lg text-ink-muted">{v.country}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a
            href={explorer.account(address)}
            target="_blank"
            rel="noreferrer"
            className="link figure"
          >
            {shortAddress(address, 8)}
          </a>
          {v.website && (
            <a href={v.website} target="_blank" rel="noreferrer" className="link">
              Website
            </a>
          )}
        </div>

        {v.description && (
          <p className="mt-6 max-w-3xl text-[1.0625rem] text-ink-soft">{v.description}</p>
        )}
      </div>

      <dl className="mt-10 grid grid-cols-2 border-y border-rule py-5 md:grid-cols-3">
        <div>
          <dt className="kicker">Campaigns overseen</dt>
          <dd className="figure mt-2 text-2xl text-ink">{verifierCampaigns.length}</dd>
        </div>
        <div>
          <dt className="kicker">Releases verified</dt>
          <dd className="figure mt-2 text-2xl text-ink">{verifierReleases.length}</dd>
        </div>
        <div>
          <dt className="kicker">Status</dt>
          <dd className="figure mt-2 text-2xl text-ink">
            {v.active ? 'Active' : 'Registered'}
          </dd>
        </div>
      </dl>

      <section className="mt-14">
        <p className="kicker">Campaigns overseen</p>
        <h2 className="mt-2 text-[1.75rem]">Campaigns verified on Aidline</h2>
        {verifierCampaigns.length === 0 ? (
          <p className="mt-4 text-ink-muted">
            This verifier has not been assigned to any campaigns yet.
          </p>
        ) : (
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {verifierCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-rule pt-10">
        <p className="kicker">Recent releases</p>
        <h2 className="mt-2 text-[1.75rem]">Verified milestone releases</h2>
        {verifierReleases.length === 0 ? (
          <p className="mt-4 text-ink-muted">No milestone releases by this verifier yet.</p>
        ) : (
          <ul className="mt-6 border-t border-rule">
            {verifierReleases.map((r) => (
              <li
                key={`${r.campaignId}-${r.index}-${r.txHash}`}
                className="grid gap-2 border-b border-rule py-5 md:grid-cols-[1fr_auto] md:gap-8"
              >
                <div>
                  <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
                    <span className={KIND[r.kind].text}>{KIND[r.kind].short}</span>
                    <span className="text-ink-muted"> / Milestone {r.index + 1}</span>
                    <span className="text-ink-muted"> / {formatDate(r.releasedAt)}</span>
                  </p>
                  <Link
                    href={`/campaigns/${r.campaignId}`}
                    className="mt-1 block font-serif text-lg text-ink hover:underline"
                  >
                    {r.campaignTitle ?? `Campaign #${r.campaignId}`}
                  </Link>
                  {r.proof?.note && <p className="mt-2 text-sm text-ink-soft">{r.proof.note}</p>}
                </div>
                <div className="md:text-right">
                  <p className="figure text-ink">{formatAmount(r.amount)}</p>
                  {r.txHash && <TxLink hash={r.txHash} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
