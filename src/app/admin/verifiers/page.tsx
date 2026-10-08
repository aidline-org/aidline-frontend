'use client';

import { useEffect, useState } from 'react';

import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, type VerifierApplication } from '@/lib/api';
import { config, explorer } from '@/lib/config';
import { shortAddress } from '@/lib/format';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

export default function AdminVerifiersPage() {
  const { address, state: wallet, connect, sign } = useWallet();
  const { state: txState, run: runTx, busy, reset: resetTx } = useTx();
  const [applications, setApplications] = useState<VerifierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .verifierApplications()
      .then((data) => {
        if (!cancelled) setApplications(data.items ?? []);
      })
      // The pending list endpoint may not exist yet. Show an empty queue instead.
      .catch(() => {
        if (!cancelled) setApplications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRegister = async (verifierAddr: string) => {
    if (!address) return;
    setActiveAddress(verifierAddr);
    resetTx();

    const result = await runTx(
      (onStatus) => aidline.addVerifier(address, verifierAddr, sign, onStatus),
      async () => {
        // Refresh verifier list after confirmation
        const verifiers = await api.verifiers().catch(() => null);
        return Boolean(verifiers?.items.some((v) => v.address === verifierAddr));
      },
    );

    if (result) {
      // Remove approved application from pending list
      setApplications((prev) => prev.filter((app) => app.address !== verifierAddr));
      setCustomAddress('');
    }
    setActiveAddress(null);
  };

  // Determine admin authorization status
  const configuredAdmin = config.adminAddress;
  const isConnected = wallet.status === 'connected' && Boolean(address);
  const isAdmin =
    isConnected &&
    (!configuredAdmin || (address && address.toLowerCase() === configuredAdmin.toLowerCase()));

  return (
    <Container className="pt-12 pb-20">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="kicker">Admin Control</p>
          <h1 className="mt-3 text-[2.75rem]">Register Verifiers</h1>
        </div>
        {isConnected && address && (
          <p className="text-sm text-ink-muted figure">
            Connected: <span className="text-ink">{shortAddress(address, 6)}</span>
          </p>
        )}
      </div>

      <p className="mt-4 max-w-2xl text-[1.0625rem] text-ink-soft">
        Verifiers are independent entities authorized on-chain to verify milestones and release
        escrowed campaign funds. Only the authorized Aidline admin wallet can execute on-chain
        verifier registrations.
      </p>

      {!isConnected && (
        <div className="mt-8 border-y border-rule py-10">
          <Notice title="Wallet disconnected">
            Connect the Aidline admin wallet to review pending verifier applications and register
            verifiers on chain.
          </Notice>
          <button type="button" className="btn btn-primary mt-6" onClick={() => void connect()}>
            Connect wallet
          </button>
        </div>
      )}

      {isConnected && !isAdmin && (
        <div className="mt-8">
          <Notice title="Unauthorized wallet" tone="danger">
            The connected wallet (
            <span className="font-mono">{shortAddress(address ?? '', 6)}</span>) is not configured
            as the Aidline admin. Please switch to the authorized admin wallet to manage verifier
            registrations.
          </Notice>
        </div>
      )}

      {isConnected && isAdmin && (
        <div className="mt-10 space-y-12">
          <section className="border-t border-rule pt-8">
            <h2 className="text-[1.75rem]">Pending Verifier Applications</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Organizations that have submitted a verification request. Registering grants on-chain
              verification privileges.
            </p>

            {loading ? (
              <p className="mt-6 py-6 text-ink-muted">Loading pending applications...</p>
            ) : applications.length === 0 ? (
              <div className="mt-6 border-y border-rule py-8">
                <p className="text-ink-muted">No pending verifier applications found.</p>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-rule border-y border-rule">
                {applications.map((app) => {
                  const isProcessing = busy && activeAddress === app.address;
                  return (
                    <li key={app.address} className="py-6 grid gap-4 lg:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-baseline gap-3">
                          <h3 className="font-serif text-xl text-ink">{app.orgName}</h3>
                          <span className="text-sm text-ink-muted">{app.country}</span>
                        </div>
                        <p className="text-[0.9375rem] text-ink-soft max-w-3xl">
                          {app.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs figure text-ink-muted">
                          <span>
                            Address:{' '}
                            <a
                              href={explorer.account(app.address)}
                              target="_blank"
                              rel="noreferrer"
                              className="link font-mono text-ink"
                            >
                              {app.address}
                            </a>
                          </span>
                          {app.website && (
                            <a href={app.website} target="_blank" rel="noreferrer" className="link">
                              Website
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start lg:justify-end">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy}
                          onClick={() => void handleRegister(app.address)}
                        >
                          {isProcessing ? 'Registering...' : 'Register as Verifier'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="border-t border-rule pt-8 max-w-xl">
            <h2 className="text-[1.5rem]">Manual Verifier Registration</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Register a verifier directly by specifying their Stellar account address.
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (customAddress.trim()) {
                  void handleRegister(customAddress.trim());
                }
              }}
            >
              <div>
                <label className="label" htmlFor="verifier-address">
                  Verifier Wallet Address
                </label>
                <input
                  id="verifier-address"
                  className="field font-mono"
                  placeholder="G..."
                  required
                  pattern="^G[A-Z2-7]{55}$"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  disabled={busy}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || !customAddress.trim()}
              >
                {busy && activeAddress === customAddress.trim()
                  ? 'Registering...'
                  : 'Register Verifier Address'}
              </button>
            </form>
          </section>

          {txState.phase !== 'idle' && (
            <div className="mt-6">
              <TxStatus state={txState} success="Verifier registered on chain." />
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
