'use client';

import { useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, type CampaignDetail } from '@/lib/api';
import { config } from '@/lib/config';
import { useFiat } from '@/lib/fiat';
import { formatAmount, parseAmount } from '@/lib/format';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

const PRESETS = ['10', '50', '100'];

export function DonatePanel({ campaign }: { campaign: CampaignDetail }) {
  const { address, state: wallet, balance, connect, sign, refreshBalance } = useWallet();
  const { state, run, busy } = useTx();
  const { formatFiat } = useFiat();
  const [input, setInput] = useState('50');
  const [lastAmount, setLastAmount] = useState<bigint>(0n);

  const remaining = BigInt(campaign.goal) - BigInt(campaign.raised);
  const amount = parseAmount(input);
  const fiatEstimate = amount ? formatFiat(amount) : null;

  const invalid =
    amount === null
      ? 'Enter an amount like 25 or 12.5'
      : amount <= 0n
        ? 'Enter an amount greater than zero'
        : amount > remaining
          ? `Only ${formatAmount(remaining)} is still needed`
          : balance !== null && amount > balance
            ? `Your wallet holds ${formatAmount(balance)}`
            : null;

  if (remaining <= 0n) {
    return (
      <p className="text-[0.9375rem]">
        This campaign is fully funded. The rest of its funds are released as milestones are
        verified.
      </p>
    );
  }

  const donate = async () => {
    if (!address || amount === null || invalid) return;
    setLastAmount(amount);
    const before = BigInt(campaign.raised);
    await run(
      (on) => aidline.donate(address, campaign.id, amount, sign, on),
      async () => BigInt((await api.campaign(campaign.id)).raised) > before,
    );
    refreshBalance();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void donate();
      }}
    >
      <div className="flex items-center justify-between">
        <label htmlFor="amount" className="label">
          Amount
        </label>
        {fiatEstimate && (
          <span className="figure font-mono text-xs text-ink-muted">{fiatEstimate}</span>
        )}
      </div>
      <div className="flex">
        <input
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          className="field figure rounded-r-none text-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-invalid={Boolean(invalid)}
          aria-describedby="amount-hint"
          disabled={busy}
        />
        <span className="figure flex items-center border border-l-0 border-rule bg-paper-sunk px-3 text-ink-muted">
          {config.tokenSymbol}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`figure border px-3 py-1 text-[0.8125rem] ${input === p ? 'border-ink text-ink' : 'border-rule text-ink-soft hover:border-ink'}`}
            onClick={() => setInput(p)}
            disabled={busy}
          >
            {p}
          </button>
        ))}
      </div>
      <p id="amount-hint" className={`hint ${invalid && input ? 'text-danger' : ''}`}>
        {invalid && input
          ? invalid
          : `Held in escrow until a verifier confirms each milestone. Up to ${formatAmount(remaining)} still needed.`}
      </p>

      {wallet.status === 'connected' ? (
        <button
          type="submit"
          className="btn btn-primary mt-5 w-full"
          disabled={busy || Boolean(invalid)}
        >
          {amount && !invalid
            ? `Donate ${formatAmount(amount)}${fiatEstimate ? ` (${fiatEstimate})` : ''}`
            : 'Donate'}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary mt-5 w-full"
          onClick={() => void connect()}
        >
          Connect wallet to donate
        </button>
      )}

      <TxStatus
        state={state}
        success={`Thank you. ${formatAmount(lastAmount)} is now in escrow for this campaign.`}
      />
    </form>
  );
}
