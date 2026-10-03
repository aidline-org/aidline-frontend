'use client';

import { useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, type CampaignDetail } from '@/lib/api';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

/** Lets the campaign creator stop a campaign, which opens refunds for donors. */
export function CreatorPanel({ campaign }: { campaign: CampaignDetail }) {
  const { address, sign } = useWallet();
  const { state, run, busy } = useTx();
  const [confirming, setConfirming] = useState(false);

  if (address !== campaign.creator || campaign.status !== 'active') return null;

  return (
    <section className="border-t border-rule pt-5">
      <p className="kicker">You created this campaign</p>
      {!confirming ? (
        <button
          type="button"
          className="link mt-3 text-[0.9375rem]"
          onClick={() => setConfirming(true)}
        >
          Cancel campaign
        </button>
      ) : (
        <div className="mt-3">
          <p className="text-[0.9375rem]">
            Cancelling stops donations and approvals for good. Donors can then reclaim everything
            that has not been released. This cannot be undone.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() =>
                void run(
                  (on) => aidline.cancelCampaign(address, campaign.id, sign, on),
                  async () => (await api.campaign(campaign.id)).status === 'cancelled',
                )
              }
            >
              Yes, cancel it
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Keep it open
            </button>
          </div>
        </div>
      )}
      <TxStatus
        state={state}
        success="Campaign cancelled. Donors can now reclaim their unspent share."
      />
    </section>
  );
}
