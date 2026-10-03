'use client';

import { useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, type CampaignDetail } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { describeError } from '@/lib/stellar/errors';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

/** Lets the campaign's verifier publish evidence and release the next milestone. */
export function VerifierPanel({ campaign }: { campaign: CampaignDetail }) {
  const { address, sign } = useWallet();
  const { state, run, busy } = useTx();
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (address !== campaign.verifier || campaign.status !== 'active') return null;

  const next = campaign.milestones[campaign.milestonesReleased];
  if (!next) return null;
  const escrow = BigInt(campaign.raised) - BigInt(campaign.released);
  const funded = escrow >= BigInt(next.amount);

  const submit = async () => {
    setUploadError(null);
    const form = new FormData();
    form.set('campaignId', campaign.id);
    form.set('milestoneIndex', String(next.index));
    form.set('note', note);
    for (const f of Array.from(files ?? [])) form.append('files', f);

    let proofUri: string;
    try {
      proofUri = (await api.uploadProof(form)).uri;
    } catch (err) {
      setUploadError(describeError(err));
      return;
    }
    const before = campaign.milestonesReleased;
    const ok = await run(
      (on) => aidline.approveMilestone(address, campaign.id, proofUri, sign, on),
      async () => (await api.campaign(campaign.id)).milestonesReleased > before,
    );
    if (ok) {
      setNote('');
      setFiles(null);
    }
  };

  return (
    <section className="border border-ink p-5">
      <p className="kicker text-ink">You verify this campaign</p>
      <h3 className="mt-2 text-xl">Release milestone {next.index + 1}</h3>
      <p className="mt-2 text-[0.9375rem]">
        Approving pays <span className="figure text-ink">{formatAmount(next.amount)}</span> to the
        beneficiary. Your evidence is published with the payout.
      </p>
      {!funded ? (
        <p className="mt-4 text-[0.9375rem] text-ink-muted">
          Escrow holds {formatAmount(escrow)}, which is not enough for this milestone yet.
        </p>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div>
            <label className="label" htmlFor="proof-note">
              What did you verify?
            </label>
            <textarea
              id="proof-note"
              className="field min-h-24"
              placeholder="Delivered 40 water tanks to three camps on the east bank. Receipts attached."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
              disabled={busy}
            />
          </div>
          <div>
            <label className="label" htmlFor="proof-files">
              Photos or documents
            </label>
            <input
              id="proof-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm file:mr-3 file:border file:border-ink file:bg-transparent file:px-3 file:py-1.5 file:text-ink"
              disabled={busy}
            />
            <p className="hint">Up to 5 files, 5 MB each. JPEG, PNG, WebP or PDF.</p>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={busy || note.trim().length < 10}
          >
            Publish evidence and release {formatAmount(next.amount)}
          </button>
          {uploadError && (
            <p role="alert" className="text-[0.9375rem] text-danger">
              {uploadError}
            </p>
          )}
        </form>
      )}
      <TxStatus
        state={state}
        success="Milestone released. The evidence is now public on this page."
      />
    </section>
  );
}
