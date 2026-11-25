import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CampaignCard } from '@/components/campaign/CampaignCard';
import { ReleaseFeed } from '@/components/campaign/ReleaseFeed';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { api, ApiError } from '@/lib/api';
import { explorer } from '@/lib/config';
import { formatAmount, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';
import { getVerifierBond } from '@/lib/stellar/balance';
import { campaignsForVerifier, releasesForVerifier } from '@/lib/verifierProfile';
import { safeExternalUrl } from '@/lib/url';

async function loadVerifier(address: string) {
  return api.verifier(address);
}

export async function generateMetadata(
  props: PageProps<'/verifiers/[address]'>,
): Promise<Metadata> {
  const { address } = await props.params;
  const verifier = await safe(() => api.verifier(address));
  return {
    title: verifier?.orgName ? `${verifier.orgName} — Verifier` : `Verifier ${shortAddress(address, 6)}`,
    description: verifier?.description ?? 'Aidline verifier profile and verification record.',
    alternates: { canonical: `/verifiers/${address}` },
    robots: verifier ? undefined : { index: false },
  };
}

export default async function VerifierProfilePage(
  props: PageProps<'/verifiers/[address]'>,
) {
  const { address } = await props.params;
  if (!/^G[A-Z2-7]{55}$/.test(address)) notFound();

  let verifier;
  try {
    verifier = await loadVerifier(address);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <Container className="pt-12">
        <p className="kicker">Verifier profile</p>
        <h1 className="mt-3 text-[2.75rem]">{shortAddress(address, 8)}</h1>
        <div className="mt-8">
          <Notice title="Verifier profile could not be loaded" tone="danger">
            The Aidline API is not responding.
          </Notice>
        </div>
      </Container>
    );
  }

  const [campaigns, releases, bond] = await Promise.all([
    safe(() => api.campaigns({ limit: 100 })),
    safe(() => api.releases(100)),
    safe(() => getVerifierBond(address)),
  ]);
  const overseen = campaigns ? campaignsForVerifier(campaigns.items, address) : null;
  const verified = releases ? releasesForVerifier(releases.items, address) : null;
  const website = safeExternalUrl(verifier.website);

  return (
    <Container className="pt-12">
      <Link href="/verifiers" className="link text-sm">
        All verifiers
      </Link>

      <header className="mt-8 max-w-3xl">
        <p className="kicker">Independent verifier</p>
        <h1 className="mt-3 text-[2.75rem] sm:text-[3.25rem]">
          {verifier.orgName ?? 'Unnamed verifier'}
        </h1>
        {verifier.description && (
          <p className="mt-5 text-[1.0625rem] text-ink-soft">{verifier.description}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {verifier.country && <span className="text-ink-muted">{verifier.country}</span>}
          <a
            href={explorer.account(address)}
            target="_blank"
            rel="noreferrer"
            className="link figure"
          >
            {shortAddress(address, 8)}
          </a>
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="link">
              Website
            </a>
          )}
        </div>
      </header>

      <dl className="mt-10 grid grid-cols-2 border-y border-rule md:grid-cols-3">
        <div className="py-5 pr-4">
          <dt className="kicker">Campaigns overseen</dt>
          <dd className="figure mt-2 text-2xl">{overseen?.length ?? '—'}</dd>
        </div>
        <div className="py-5 pr-4">
          <dt className="kicker">Verified releases</dt>
          <dd className="figure mt-2 text-2xl">{verified?.length ?? '—'}</dd>
        </div>
        <div className="py-5">
          <dt className="kicker">Public bond</dt>
          <dd className="figure mt-2 text-lg">
            {bond ? formatAmount(bond.remaining) : 'Unavailable'}
          </dd>
        </div>
      </dl>

      <section className="mt-14">
        <div className="border-b border-rule pb-4">
          <p className="kicker">Campaign record</p>
          <h2 className="mt-2 text-[1.75rem]">Campaigns overseen</h2>
        </div>
        {overseen === null ? (
          <div className="mt-6">
            <Notice title="Campaign record could not be loaded" tone="danger">
              The Aidline API is not responding.
            </Notice>
          </div>
        ) : overseen.length === 0 ? (
          <p className="mt-6 text-ink-muted">This verifier has not overseen a campaign yet.</p>
        ) : (
          <div className="mt-8 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {overseen.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <div className="border-b border-rule pb-4">
          <p className="kicker">Release record</p>
          <h2 className="mt-2 text-[1.75rem]">Recent releases</h2>
        </div>
        {verified === null ? (
          <div className="mt-6">
            <Notice title="Release record could not be loaded" tone="danger">
              The Aidline API is not responding.
            </Notice>
          </div>
        ) : (
          <div className="mt-6">
            <ReleaseFeed releases={verified} />
          </div>
        )}
      </section>
    </Container>
  );
}
