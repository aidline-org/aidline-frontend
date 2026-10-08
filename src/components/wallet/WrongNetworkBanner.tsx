'use client';

import { useWallet } from '@/components/wallet/WalletProvider';
import { config } from '@/lib/config';

export function WrongNetworkBanner() {
  const { isWrongNetwork, checkNetwork } = useWallet();

  if (!isWrongNetwork) return null;

  return (
    <div role="alert" className="border-b border-rule bg-paper-sunk px-4 py-3 text-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Wrong network
          </span>
          <p className="text-ink-soft">
            Your wallet is connected to another network. Aidline expects{' '}
            <span className="font-mono text-ink">{config.network}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-ink-muted">
            Switch your wallet network to {config.network} to continue.
          </span>
          <button
            type="button"
            onClick={() => void checkNetwork()}
            className="rounded-[2px] border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:bg-paper-raised"
          >
            Recheck network
          </button>
        </div>
      </div>
    </div>
  );
}
