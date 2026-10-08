'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Networks } from '@creit.tech/stellar-wallets-kit/types';

import { config } from '@/lib/config';
import { tokenBalance } from '@/lib/stellar/balance';
import type { Signer } from '@/lib/stellar/tx';

type Kit = (typeof import('@creit.tech/stellar-wallets-kit/sdk'))['StellarWalletsKit'];

type WalletState =
  | { status: 'loading' }
  | { status: 'disconnected' }
  | { status: 'connected'; address: string; walletName: string | null };

interface WalletContextValue {
  state: WalletState;
  address: string | null;
  /** Balance of the campaign token in its smallest unit. Null while unknown or unfunded. */
  balance: bigint | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => void;
  sign: Signer;
  error: string | null;
  isWrongNetwork: boolean;
  networkPassphrase: string | null;
  checkNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const BALANCE_REFRESH_MS = 20_000;

// The kit's modal is themed with our own tokens, so it follows light and dark mode.
const KIT_THEME = {
  background: 'var(--paper-raised)',
  'background-secondary': 'var(--paper-sunk)',
  'foreground-strong': 'var(--ink)',
  foreground: 'var(--ink-soft)',
  'foreground-secondary': 'var(--ink-muted)',
  primary: 'var(--ink)',
  'primary-foreground': 'var(--paper)',
  transparent: 'transparent',
  lighter: 'var(--paper-raised)',
  light: 'var(--paper-sunk)',
  'light-gray': 'var(--rule)',
  gray: 'var(--ink-muted)',
  danger: 'var(--danger)',
  border: 'var(--rule)',
  shadow: 'none',
  'border-radius': '2px',
  'font-family': 'var(--font-plex-sans), system-ui, sans-serif',
};

let kitPromise: Promise<Kit> | null = null;

/** Loads and initialises the wallet kit once, in the browser only. */
function loadKit(): Promise<Kit> {
  kitPromise ??= (async () => {
    const [{ StellarWalletsKit }, { defaultModules }] = await Promise.all([
      import('@creit.tech/stellar-wallets-kit/sdk'),
      import('@creit.tech/stellar-wallets-kit/modules/utils'),
    ]);
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: config.networkPassphrase as Networks,
      theme: KIT_THEME,
      authModal: { showInstallLabel: true },
    });
    return StellarWalletsKit;
  })();
  return kitPromise;
}

function walletName(kit: Kit): string | null {
  try {
    return kit.selectedModule?.productName ?? null;
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({ status: 'loading' });
  const [balance, setBalance] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const kitRef = useRef<Kit | null>(null);

  // Restore the previous session, if the kit remembers one.
  useEffect(() => {
    let cancelled = false;
    loadKit()
      .then(async (kit) => {
        kitRef.current = kit;
        const { address } = await kit.getAddress();
        if (!cancelled) setState({ status: 'connected', address, walletName: walletName(kit) });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'disconnected' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const address = state.status === 'connected' ? state.address : null;

  const checkNetwork = useCallback(async () => {
    const kit = kitRef.current;
    if (!kit || !address) {
      setNetworkPassphrase(null);
      return;
    }
    try {
      const net = await kit.getNetwork();
      setNetworkPassphrase(net?.networkPassphrase ?? null);
    } catch {
      setNetworkPassphrase(null);
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setNetworkPassphrase(null);
      return;
    }
    void checkNetwork();
    const timer = setInterval(checkNetwork, 5_000);
    window.addEventListener('focus', checkNetwork);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', checkNetwork);
    };
  }, [address, checkNetwork]);

  const isWrongNetwork = Boolean(
    address && networkPassphrase && networkPassphrase !== config.networkPassphrase,
  );

  const refreshBalance = useCallback(() => {
    if (!address) return;
    tokenBalance(address)
      .then(setBalance)
      .catch(() => setBalance(null));
  }, [address]);

  useEffect(() => {
    if (!address) return;
    refreshBalance();
    const timer = setInterval(refreshBalance, BALANCE_REFRESH_MS);
    window.addEventListener('focus', refreshBalance);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshBalance);
      setBalance(null);
    };
  }, [address, refreshBalance]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const kit = await loadKit();
      kitRef.current = kit;
      const { address: next } = await kit.authModal();
      setState({ status: 'connected', address: next, walletName: walletName(kit) });
      void checkNetwork();
    } catch (err) {
      const message = (err as { message?: string })?.message ?? '';
      // Closing the picker is a choice, not an error.
      if (!/closed the modal/i.test(message)) setError(message || 'The wallet did not connect.');
    }
  }, [checkNetwork]);

  const disconnect = useCallback(async () => {
    await kitRef.current?.disconnect();
    setState({ status: 'disconnected' });
    setNetworkPassphrase(null);
  }, []);

  const sign = useCallback<Signer>(
    async (txXdr) => {
      const kit = kitRef.current;
      if (!kit || !address) throw new Error('Connect a wallet first.');
      const network = await kit.getNetwork().catch(() => null);
      if (network && network.networkPassphrase !== config.networkPassphrase) {
        throw new Error(
          `Your wallet is on another network. Switch it to ${config.network} and try again.`,
        );
      }
      try {
        const { signedTxXdr } = await kit.signTransaction(txXdr, {
          networkPassphrase: config.networkPassphrase,
          address,
        });
        return signedTxXdr;
      } catch (err) {
        throw new Error((err as { message?: string })?.message ?? 'Signing was declined.');
      }
    },
    [address],
  );

  const value = useMemo(
    () => ({
      state,
      address,
      balance,
      connect,
      disconnect,
      refreshBalance,
      sign,
      error,
      isWrongNetwork,
      networkPassphrase,
      checkNetwork,
    }),
    [
      state,
      address,
      balance,
      connect,
      disconnect,
      refreshBalance,
      sign,
      error,
      isWrongNetwork,
      networkPassphrase,
      checkNetwork,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
