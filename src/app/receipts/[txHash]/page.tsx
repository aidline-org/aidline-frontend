import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { KIND } from '@/components/campaign/kind';
import { Container } from '@/components/ui/Container';
import { ShareButton } from '@/components/ui/ShareButton';
import { TxLink } from '@/components/ui/TxLink';
import { api, type ReceiptDetail } from '@/lib/api';
import { explorer } from '@/lib/config';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';

async function getReceipt(txHash: string): Promise<ReceiptDetail | null> {
  if (!/^[a-fA-F0-9]{64}$/i.test(txHash)) return null;

  // Primary API call
  const receipt = await safe(() => api.receipt(txHash));
  if (receipt) return receipt;

  // Fallback: Attempt to locate donation transaction hash across recent campaigns
  const campaigns = await safe(() => api.campaigns({ limit: 50 }));
  if (campaigns) {
    for (const c of campaigns.items) {
      const dons = await safe(() => api.donations(c.id, 50));
      const match = dons?.items.find((d) => d.txHash.toLowerCase() === txHash.toLowerCase());
      if (match) {
        return {
          txHash: match.txHash,
          donor: match.donor,
          amount: match.amount,
          campaignId: c.id,
          campaignTitle: c.metadata?.title ?? `Campaign #${c.id}`,
          kind: c.kind,
          location: c.metadata?.location ?? null,
          createdAt: match.createdAt,
        };
      }
    }
  }

  return null;
}

export async function generateMetadata(
  props: PageProps<'/receipts/[txHash]'>,
): Promise<Metadata> {
  const { txHash } = await props.params;
  const receipt = await getReceipt(txHash);
  if (!receipt) {
    return { title: 'Donation Receipt · Aidline' };
  }
  const title = `Donation of ${formatAmount(receipt.amount)} to ${receipt.campaignTitle ?? 'Aidline Campaign'}`;
  const description = `Verified donation receipt on Stellar. Given on ${formatDate(receipt.createdAt)} for ${receipt.campaignTitle ?? 'Aidline'}.`;

  return {
    title: `${title} · Aidline Receipt`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ReceiptPage(props: PageProps<'/receipts/[txHash]'>) {
  const { txHash } = await props.params;
  if (!/^[a-fA-F0-9]{64}$/i.test(txHash)) notFound();

  const receipt = await getReceipt(txHash);
  if (!receipt) {
    notFound();
  }

  const r = receipt;

  return (
    <Container className="pt-12">
      <div className="mx-auto max-w-2xl">
        <Link href={`/campaigns/${r.campaignId}`} className="link text-sm">
          ← Back to campaign
        </Link>

        <div className="mt-8 border border-ink bg-paper-raised p-8 sm:p-12">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-6">
            <div>
              <p className="kicker">Aidline verified donation</p>
              <h1 className="mt-2 font-serif text-3xl text-ink">Donation Receipt</h1>
            </div>
            <span className="figure inline-flex items-center gap-2 border border-ink px-3 py-1 text-xs uppercase tracking-widest text-ink">
              <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 5.5L4 8.5L9 1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              On-chain record
            </span>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-muted">Amount Donated</p>
              <p className="figure mt-1 text-4xl text-ink font-semibold">{formatAmount(r.amount)}</p>
            </div>

            <div className="border-t border-rule pt-6">
              <p className="text-xs uppercase tracking-wider text-ink-muted">Campaign</p>
              <Link
                href={`/campaigns/${r.campaignId}`}
                className="mt-1 block font-serif text-xl text-ink hover:underline"
              >
                {r.campaignTitle ?? `Campaign #${r.campaignId}`}
              </Link>
              {r.location && <p className="mt-0.5 text-sm text-ink-soft">{r.location}</p>}
            </div>

            <div className="grid gap-6 border-t border-rule pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Donor Wallet</p>
                <a
                  href={explorer.account(r.donor)}
                  target="_blank"
                  rel="noreferrer"
                  className="figure mt-1 block text-sm text-ink hover:underline"
                >
                  {shortAddress(r.donor, 8)}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Date & Time</p>
                <p className="figure mt-1 text-sm text-ink">{formatDate(r.createdAt)}</p>
              </div>
            </div>

            <div className="border-t border-rule pt-6">
              <p className="text-xs uppercase tracking-wider text-ink-muted">Transaction Hash</p>
              <div className="mt-1">
                <TxLink hash={r.txHash} label={r.txHash} />
              </div>
            </div>

            <div className="border-t border-rule pt-6 text-sm text-ink-soft">
              <p>
                This donation is locked in the Aidline smart contract on Stellar. Funds are only
                released to project organizers as independent verifiers confirm each milestone.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-6">
            <ShareButton
              title={`Donation Receipt: ${formatAmount(r.amount)} for ${r.campaignTitle ?? 'Aidline'}`}
              text={`I donated ${formatAmount(r.amount)} on Aidline for ${r.campaignTitle ?? 'this cause'}. Tracked on Stellar.`}
            />
            <Link href={`/campaigns/${r.campaignId}`} className="btn btn-secondary">
              View campaign
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
