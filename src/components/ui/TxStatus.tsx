'use client';

import { PHASE_LABEL, type TxState } from '@/lib/useTx';

import { TxLink } from './TxLink';

export function TxStatus({ state, success }: { state: TxState; success: React.ReactNode }) {
  if (state.phase === 'idle') return null;
  if (state.phase === 'error') {
    return (
      <p role="alert" className="mt-4 border-l-2 border-danger pl-3 text-[0.9375rem] text-danger">
        {state.message}
      </p>
    );
  }
  if (state.phase === 'done') {
    return (
      <div role="status" className="mt-4 border-l-2 border-ink pl-3 text-[0.9375rem]">
        <p className="text-ink">{success}</p>
        <TxLink hash={state.hash} />
      </div>
    );
  }
  return (
    <p role="status" className="mt-4 flex items-center gap-2.5 text-[0.9375rem] text-ink">
      <span className="inline-block h-2 w-2 animate-pulse bg-ink" aria-hidden="true" />
      {PHASE_LABEL[state.phase]}
    </p>
  );
}
