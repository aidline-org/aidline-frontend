'use client';

import { useEffect, useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, type CampaignDetail } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

/** Shown on cancelled or expired campaigns so donors can reclaim unspent funds. */
export function RefundPanel({ campaign }: { campaign: CampaignDetail }) {
  const { address, sign } = useWallet();
  const { state, run, busy } = useTx();
  const [position, setPosition] = useState<{ given: bigint; refunded: bigint } | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    api
      .donor(address)
      .then((h) => {
        if (cancelled) return;
        const given = h.donations
          .filter((d) => d.campaignId === campaign.id)
          .reduce((sum, d) => sum + BigInt(d.amount), 0n);
        const refunded = h.refunds
          .filter((r) => r.campaignId === campaign.id)
          .reduce((sum, r) => sum + BigInt(r.amount), 0n);
        setPosition({ given, refunded });
      })
      .catch(() => setPosition(null));
    return () => {
      cancelled = true;
    };
  }, [address, campaign.id, state.phase]);

  const reason =
    campaign.status === 'cancelled'
      ? 'This campaign was cancelled.'
      : 'This campaign ended before every milestone was verified.';

  if (!address || !position || position.given === 0n) {
    return (
      <p className="text-[0.9375rem]">
        {reason} Donors can reclaim their share of the funds that were never released.
        {!address && ' Connect the wallet you donated with to check yours.'}
      </p>
    );
  }

  const raised = BigInt(campaign.raised);
  const unreleased = raised - BigInt(campaign.released);
  const estimate = raised > 0n ? (position.given * unreleased) / raised : 0n;

  if (position.refunded > 0n) {
    return (
      <p className="text-[0.9375rem]">
        {reason} You reclaimed{' '}
        <span className="figure text-ink">{formatAmount(position.refunded)}</span>.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[0.9375rem]">
        {reason} You gave <span className="figure text-ink">{formatAmount(position.given)}</span>.
        Your share of what was never released is{' '}
        <span className="figure text-ink">{formatAmount(estimate)}</span>.
      </p>
      <button
        type="button"
        className="btn btn-primary mt-5 w-full"
        disabled={busy || estimate === 0n}
        onClick={() =>
          void run(
            (on) => aidline.refund(address, campaign.id, sign, on),
            async () => {
              const h = await api.donor(address);
              return h.refunds.some((r) => r.campaignId === campaign.id);
            },
          )
        }
      >
        Reclaim {formatAmount(estimate)}
      </button>
      <TxStatus state={state} success="Your unspent share has been returned to your wallet." />
    </div>
  );
}
