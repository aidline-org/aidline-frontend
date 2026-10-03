'use client';

import {
  getAddress,
  getNetworkDetails,
  isAllowed,
  isConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { config } from '@/lib/config';
import type { Signer } from '@/lib/stellar/tx';

type WalletState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'disconnected' }
  | { status: 'connected'; address: string; wrongNetwork: boolean };

interface WalletContextValue {
  state: WalletState;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sign: Signer;
  error: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// Freighter has no programmatic disconnect, so we remember the choice locally.
const DISCONNECTED_KEY = 'aidline:wallet-disconnected';

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(DISCONNECTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) window.localStorage.setItem(DISCONNECTED_KEY, '1');
    else window.localStorage.removeItem(DISCONNECTED_KEY);
  } catch {
    // Storage can be blocked. The session still works without it.
  }
}

// Without the extension, Freighter API calls can wait forever for a reply.
function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function onExpectedNetwork(): Promise<boolean> {
  const details = await getNetworkDetails();
  return !details.error && details.networkPassphrase === config.networkPassphrase;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({ status: 'loading' });
  const [error, setError] = useState<string | null>(null);

  // Restore an existing connection without prompting.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const installed = await withTimeout(isConnected(), { isConnected: false });
      if (cancelled) return;
      if (installed.error || !installed.isConnected) return setState({ status: 'missing' });

      const allowed = await isAllowed();
      if (allowed.isAllowed && !readFlag()) {
        const { address, error: err } = await getAddress();
        if (!cancelled && address && !err) {
          const ok = await onExpectedNetwork();
          return setState({ status: 'connected', address, wrongNetwork: !ok });
        }
      }
      if (!cancelled) setState({ status: 'disconnected' });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const installed = await withTimeout(isConnected(), { isConnected: false });
    if (!installed.isConnected) {
      setState({ status: 'missing' });
      return;
    }
    const res = await requestAccess();
    if (res.error || !res.address) {
      setError(res.error?.message ?? 'The wallet did not share an address.');
      return;
    }
    writeFlag(false);
    const ok = await onExpectedNetwork();
    setState({ status: 'connected', address: res.address, wrongNetwork: !ok });
  }, []);

  const disconnect = useCallback(() => {
    writeFlag(true);
    setState({ status: 'disconnected' });
  }, []);

  const address = state.status === 'connected' ? state.address : null;

  const sign = useCallback<Signer>(
    async (txXdr) => {
      if (!address) throw new Error('Connect a wallet first.');
      if (!(await onExpectedNetwork())) {
        throw new Error(`Switch Freighter to ${config.network} and try again.`);
      }
      const res = await signTransaction(txXdr, {
        networkPassphrase: config.networkPassphrase,
        address,
      });
      if (res.error) throw new Error(res.error.message ?? 'Signing was declined.');
      return res.signedTxXdr;
    },
    [address],
  );

  const value = useMemo(
    () => ({ state, address, connect, disconnect, sign, error }),
    [state, address, connect, disconnect, sign, error],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
