import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ShareReceipt } from '@/components/receipt/ShareReceipt';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { TxLink } from '@/components/ui/TxLink';
import { api, ApiError, type DonationReceipt } from '@/lib/api';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import { safe } from '@/lib/safe';

async function loadReceipt(txHash: string): Promise<DonationReceipt> {
  try {
    return await api.receipt(txHash);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return api.donation(txHash);
    }
    throw err;
  }
}

export async function generateMetadata(
  props: PageProps<'/receipts/[txHash]'>,
): Promise<Metadata> {
  const { txHash } = await props.params;
  return {
    title: `Donation receipt ${shortAddress(txHash, 8)}`,
    description: 'A shareable record of a donation made through Aidline.',
    alternates: { canonical: `/receipts/${txHash}` },
  };
}

export default async function ReceiptPage(props: PageProps<'/receipts/[txHash]'>) {
  const { txHash } = await props.params;
  if (!txHash || txHash.length > 128 || /[/?#]/.test(txHash)) notFound();

  let receipt: DonationReceipt | null;
  try {
    receipt = await loadReceipt(txHash);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    receipt = null;
  }

  if (!receipt) {
    return (
      <Container className="pt-12">
        <Notice title="Receipt could not be loaded" tone="danger">
          The Aidline API is not responding. This transaction can still be viewed on the Stellar
          explorer.
        </Notice>
        <div className="mt-6">
          <TxLink hash={txHash}>View transaction on explorer</TxLink>
        </div>
      </Container>
    );
  }

  const donation = receipt.donation ?? receipt;
  const campaignId = receipt.campaignId ?? donation.campaignId;
  const campaign = receipt.campaign ??
    (campaignId ? await safe(() => api.campaign(campaignId)) : null);
  const status =
    receipt.campaignStatus ?? campaign?.status ?? ('campaignStatus' in receipt
      ? String(receipt.campaignStatus ?? '')
      : '');
  const raised = receipt.raised ?? campaign?.goal ?? receipt.campaign?.goal;
  const released = receipt.released ?? campaign?.released ?? receipt.campaign?.released;
  const refunded = receipt.refunded ?? campaign?.refunded ?? receipt.campaign?.refunded ?? '0';
  const resolvedCampaignId = campaignId ?? campaign?.id;
  const campaignTitle =
    receipt.campaignTitle ?? campaign?.metadata?.title ??
    (resolvedCampaignId ? `Campaign #${resolvedCampaignId}` : 'Campaign');
  const beneficiary = receipt.beneficiary ?? campaign?.beneficiary;

  let fundsNow = 'Held in campaign escrow';
  if (status === 'cancelled' || status === 'expired') {
    fundsNow = 'Available to reclaim through the campaign refund';
  } else if (status === 'completed') {
    fundsNow = 'Released to the campaign beneficiary';
  } else if (raised && released) {
    try {
      if (BigInt(released) > 0n) fundsNow = 'Held in escrow and/or released after verification';
      if (BigInt(released) >= BigInt(raised)) {
        fundsNow = 'Released to the campaign beneficiary';
      }
    } catch {
      // Keep the safe escrow description when malformed API amounts are received.
    }
  }

  const escrowAmount = (() => {
    try {
      if (!raised) return null;
      return BigInt(raised) - BigInt(released ?? '0') - BigInt(refunded);
    } catch {
      return null;
    }
  })();

  return (
    <Container className="pt-12">
      <div className="max-w-3xl">
        <p className="kicker">Donation receipt</p>
        <h1 className="mt-3 text-[2.25rem] sm:text-[3rem]">Thank you for giving.</h1>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-y border-rule py-5">
          <div>
            <p className="kicker">Donation</p>
            <p className="figure mt-2 text-3xl">{formatAmount(donation.amount)}</p>
          </div>
          <ShareReceipt title={`Donation receipt: ${campaignTitle}`} />
        </div>

        <dl className="mt-8 border-t border-rule text-sm">
          <ReceiptFact label="Campaign">
            {resolvedCampaignId ? (
              <Link href={`/campaigns/${resolvedCampaignId}`} className="link">
                {campaignTitle}
              </Link>
            ) : (
              campaignTitle
            )}
          </ReceiptFact>
          <ReceiptFact label="Donor">
            {donation.donor ? (
              <Link href={`/donors/${donation.donor}`} className="link figure">
                {shortAddress(donation.donor, 8)}
              </Link>
            ) : (
              'Unknown'
            )}
          </ReceiptFact>
          <ReceiptFact label="Date">
            <time dateTime={donation.createdAt}>{formatDate(donation.createdAt)}</time>
          </ReceiptFact>
          <ReceiptFact label="Funds now">
            <span>{fundsNow}</span>
          </ReceiptFact>
          {escrowAmount !== null && escrowAmount > 0n && (
            <ReceiptFact label="Current campaign escrow">
              {formatAmount(escrowAmount)}
            </ReceiptFact>
          )}
          {beneficiary && (
            <ReceiptFact label="Beneficiary">
              <span className="figure">{shortAddress(beneficiary, 8)}</span>
            </ReceiptFact>
          )}
          <ReceiptFact label="Transaction">
            <TxLink hash={donation.txHash ?? txHash} />
          </ReceiptFact>
        </dl>

        <p className="mt-8 text-sm text-ink-muted">
          This receipt is a public Aidline record. It can be shared with anyone using this page&apos;s
          link.
        </p>
      </div>
    </Container>
  );
}

function ReceiptFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-rule py-3 sm:grid-cols-[10rem_1fr]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink sm:text-right">{children}</dd>
    </div>
  );
}
