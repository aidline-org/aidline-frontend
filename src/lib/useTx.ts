'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { describeError } from './stellar/errors';
import type { Status, TxResult } from './stellar/tx';

export type TxState =
  | { phase: 'idle' }
  | { phase: 'preparing' | Status | 'syncing' }
  | { phase: 'done'; hash: string }
  | { phase: 'error'; message: string };

export const PHASE_LABEL: Record<string, string> = {
  preparing: 'Preparing transaction',
  signing: 'Waiting for your signature in Freighter',
  submitting: 'Submitting to the network',
  confirming: 'Confirming on the ledger',
  syncing: 'Updating the page',
};

/**
 * Runs a contract call and walks the UI through each phase. Once confirmed,
 * waits for the indexer to catch up (via `synced`) before refreshing the page.
 */
export function useTx() {
  const router = useRouter();
  const [state, setState] = useState<TxState>({ phase: 'idle' });

  const run = useCallback(
    async <T>(
      send: (onStatus: (s: Status) => void) => Promise<TxResult<T>>,
      synced?: () => Promise<boolean>,
    ): Promise<TxResult<T> | null> => {
      setState({ phase: 'preparing' });
      try {
        const result = await send((s) => setState({ phase: s }));
        setState({ phase: 'syncing' });
        if (synced) {
          for (let i = 0; i < 12; i++) {
            if (await synced().catch(() => false)) break;
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
        router.refresh();
        setState({ phase: 'done', hash: result.hash });
        return result;
      } catch (err) {
        setState({ phase: 'error', message: describeError(err) });
        return null;
      }
    },
    [router],
  );

  const reset = useCallback(() => setState({ phase: 'idle' }), []);
  const busy = !['idle', 'done', 'error'].includes(state.phase);

  return { state, run, reset, busy };
}
