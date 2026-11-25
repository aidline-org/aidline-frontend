import type { Metadata } from 'next';
import Link from 'next/link';

import { VerifierApplicationForm } from '@/components/forms/VerifierApplicationForm';
import { VerifierBondPanel } from '@/components/forms/VerifierBondPanel';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { api } from '@/lib/api';
import { explorer } from '@/lib/config';
import { formatAmount, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';
import {
  getBondRequirement,
  getBondWithdrawDelay,
  getVerifierBond,
  type VerifierBond,
} from '@/lib/stellar/balance';
import { safeExternalUrl } from '@/lib/url';

export const metadata: Metadata = { title: 'Verifiers' };

function formatVerifierBond(bond: VerifierBond | null): string {
  if (!bond || bond.amount <= 0n || bond.status === 'Withdrawn') {
    return 'No bond';
  }
  if (bond.status === 'Slashed') {
    return bond.remaining > 0n
      ? `Bond: ${formatAmount(bond.remaining)} (slashed)`
      : 'Bond: slashed';
  }
  if (bond.status === 'PendingWithdrawal') {
    return `Bond: ${formatAmount(bond.remaining)} (withdrawing)`;
  }
  return `Bond: ${formatAmount(bond.remaining)}`;
}

export default async function VerifiersPage() {
  const [verifiers, bondRequirement, bondWithdrawDelay] = await Promise.all([
    safe(api.verifiers),
    safe(getBondRequirement),
    safe(getBondWithdrawDelay),
  ]);
  const bonds = verifiers
    ? await Promise.all(
        verifiers.items.map((v) => safe(() => getVerifierBond(v.address))),
      )
    : [];
  return (
    <Container className="pt-12">
      <p className="kicker">Verifiers</p>
      <h1 className="mt-3 max-w-3xl text-[2.75rem]">
        The people who confirm the work before money moves
      </h1>
      <p className="mt-5 max-w-2xl text-[1.0625rem]">
        Verifiers are independent organisations close to the ground: NGOs, auditors, community
        groups. Only a verifier can release a milestone, and every release carries their name and
        evidence.
      </p>
      <p className="mt-3 max-w-2xl text-[0.9375rem] text-ink-soft">
        Verifiers can lock a token bond on chain as a public stake in their honesty. If a verifier
        approves false or bad work, that bond can be slashed to hold them accountable.
      </p>

      <section className="mt-12">
        {!verifiers ? (
          <Notice title="Verifiers could not be loaded" tone="danger">
            The Aidline API is not responding.
          </Notice>
        ) : verifiers.items.length === 0 ? (
          <p className="border-y border-rule py-8 text-ink-muted">
            No verifiers are registered yet. If your organisation can confirm work on the ground,{' '}
            <a href="#apply" className="link">
              apply below
            </a>
            .
          </p>
        ) : (
          <ul className="border-t border-rule">
            {verifiers.items.map((v, index) => {
              const website = safeExternalUrl(v.website);
              const bond = bonds[index] ?? null;
              return (
                <li
                  key={v.address}
                  className="grid gap-2 border-b border-rule py-6 md:grid-cols-[1fr_2fr_auto] md:gap-8"
                >
                  <div>
                    <Link
                      href={`/verifiers/${v.address}`}
                      className="font-serif text-xl text-ink hover:underline"
                    >
                      {v.orgName ?? 'Unnamed verifier'}
                    </Link>
                    {v.country && <p className="text-sm text-ink-muted">{v.country}</p>}
                  </div>
                  <p className="text-[0.9375rem]">
                    {v.description ?? 'This verifier has not published a profile yet.'}
                  </p>
                  <div className="flex flex-col gap-1 text-sm md:items-end">
                    <a
                      href={explorer.account(v.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="link figure"
                    >
                      {shortAddress(v.address, 6)}
                    </a>
                    {website && (
                      <a href={website} target="_blank" rel="noopener noreferrer" className="link">
                        Website
                      </a>
                    )}
                    <p className="figure text-xs text-ink-muted">{formatVerifierBond(bond)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        id="bond"
        className="mt-20 grid scroll-mt-24 gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <p className="kicker">Bonded registration</p>
          <h2 className="mt-3 text-[2rem]">Register with a bond</h2>
          <p className="mt-4 text-[0.9375rem]">
            When a bond requirement is set, you can post the required bond to register immediately
            without waiting for admin approval, or manage and withdraw an existing bond.
          </p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <VerifierBondPanel
            initialRequirement={(bondRequirement ?? 0n).toString()}
            initialWithdrawDelay={bondWithdrawDelay ?? 0}
          />
        </div>
      </section>

      <section
        id="apply"
        className="mt-20 grid scroll-mt-24 gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <p className="kicker">Apply</p>
          <h2 className="mt-3 text-[2rem]">Verify campaigns in your region</h2>
          <p className="mt-4 text-[0.9375rem]">
            Tell us about your organisation. After review, the Aidline admin registers your wallet
            on chain, and campaigns can name you as their verifier.
          </p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <VerifierApplicationForm
            registeredAddresses={verifiers ? verifiers.items.map((v) => v.address) : null}
          />
        </div>
      </section>
    </Container>
  );
}
