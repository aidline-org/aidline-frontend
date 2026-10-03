import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/ui/Container';
import { config, explorer } from '@/lib/config';

export const metadata: Metadata = { title: 'How it works' };

const SECTIONS = [
  {
    kicker: 'The problem',
    title: 'Diaspora communities give generously, and mostly in the dark',
    body: [
      'When a flood or drought hits home, people abroad are often the first to give. Money travels through group chats, cousins and informal collections. It arrives, but nobody can show what it paid for, and the local groups doing the work struggle to prove it.',
      'Aidline replaces trust in a middleman with a public record anyone can check, from anywhere. Stellar was built for moving money across borders cheaply, which makes it a natural home for this.',
    ],
  },
  {
    kicker: 'Escrow',
    title: 'Your donation waits in a smart contract',
    body: [
      'Every campaign splits its goal into milestones. Donations go to the Aidline contract on Stellar, not to a person or a bank account. Nobody, including the Aidline team, can move that money outside the rules below.',
    ],
  },
  {
    kicker: 'Verification',
    title: 'An independent verifier confirms each milestone',
    body: [
      'Each campaign names a verifier: an NGO, auditor or community group registered on the platform. When a milestone is done, the verifier publishes evidence (photos, receipts, reports) and signs the release.',
      'Only then does the contract pay that milestone to the beneficiary. The payout and the evidence are linked forever.',
    ],
  },
  {
    kicker: 'Refunds',
    title: 'If a campaign stalls, you take back what was never spent',
    body: [
      'If a campaign is cancelled, or reaches its deadline before every milestone is verified, donors can reclaim their share of the funds still in escrow. Money that was already released for verified work stays with the work.',
    ],
  },
  {
    kicker: 'Limits',
    title: 'What Aidline does not do',
    body: [
      'A verifier can be wrong or dishonest. Aidline makes their decisions public and attributable, but it cannot make them infallible. Read who verifies a campaign before you give.',
      `Aidline currently runs on Stellar ${config.network}. The contracts have not been audited. Please do not send real funds.`,
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <Container className="pt-12">
      <p className="kicker">How it works</p>
      <h1 className="mt-3 max-w-3xl text-[2.75rem] sm:text-[3.25rem]">
        Escrow, verification, release. Nothing moves on trust alone.
      </h1>

      <div className="mt-14 space-y-14">
        {SECTIONS.map((s, i) => (
          <section key={s.title} className="grid gap-4 border-t border-rule pt-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="figure text-sm text-ink-muted">{String(i + 1).padStart(2, '0')}</p>
              <p className="kicker mt-2">{s.kicker}</p>
            </div>
            <div className="md:col-span-7">
              <h2 className="text-[1.75rem]">{s.title}</h2>
              <div className="mt-4 space-y-4 text-[1.0625rem]">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap gap-3 border-t-2 border-ink pt-8">
        <Link href="/campaigns" className="btn btn-primary">
          Browse campaigns
        </Link>
        {config.contractId && (
          <a
            href={explorer.contract(config.contractId)}
            className="btn btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Read the contract on chain
          </a>
        )}
      </div>
    </Container>
  );
}
