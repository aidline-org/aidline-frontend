import type { Metadata } from 'next';
import Link from 'next/link';

import { VerifierApplicationForm } from '@/components/forms/VerifierApplicationForm';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { api } from '@/lib/api';
import { explorer } from '@/lib/config';
import { shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';

export const metadata: Metadata = { title: 'Verifiers' };

export default async function VerifiersPage() {
  const verifiers = await safe(api.verifiers);
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

      <section className="mt-12">
        {!verifiers ? (
          <Notice title="Verifiers could not be loaded" tone="danger">
            The Aidline API is not responding.
          </Notice>
        ) : (
          <ul className="border-t border-rule">
            {verifiers.items.map((v) => (
              <li
                key={v.address}
                className="grid gap-2 border-b border-rule py-6 md:grid-cols-[1fr_2fr_auto] md:gap-8"
              >
                <div>
                  <Link href={`/verifiers/${v.address}`} className="font-serif text-xl text-ink hover:underline">
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
                  {v.website && (
                    <a href={v.website} target="_blank" rel="noreferrer" className="link">
                      Website
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-20 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="kicker">Apply</p>
          <h2 className="mt-3 text-[2rem]">Verify campaigns in your region</h2>
          <p className="mt-4 text-[0.9375rem]">
            Tell us about your organisation. After review, the Aidline admin registers your wallet
            on chain, and campaigns can name you as their verifier.
          </p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <VerifierApplicationForm />
        </div>
      </section>
    </Container>
  );
}
