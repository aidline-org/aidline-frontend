'use client';

import { useState } from 'react';

import { useWallet } from '@/components/wallet/WalletProvider';
import { api, ApiError } from '@/lib/api';

export function VerifierApplicationForm() {
  const { address, state: wallet, connect } = useWallet();
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (wallet.status !== 'connected' || !address) {
    return (
      <div className="border-y border-rule py-6">
        <p>Applications are tied to the wallet you will verify with.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => void connect()}>
          Connect wallet to apply
        </button>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div role="status" className="border-l-2 border-ink pl-4">
        <p className="font-medium text-ink">Application received</p>
        <p className="mt-1">
          We will review {orgName} and register your wallet on chain once approved. Your profile
          appears in the list above as soon as that happens.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setStatus('sending');
        try {
          await api.applyAsVerifier({
            address,
            orgName: orgName.trim(),
            country: country.trim(),
            website: website.trim() || undefined,
            description: description.trim(),
          });
          setStatus('sent');
        } catch (err) {
          setStatus('idle');
          setError(
            err instanceof ApiError && err.issues.length
              ? err.issues.map((i) => `${i.path}: ${i.message}`).join('. ')
              : 'The application could not be sent. Try again in a moment.',
          );
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="org">
            Organisation
          </label>
          <input
            id="org"
            className="field"
            required
            minLength={2}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className="field"
            required
            minLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="website">
          Website <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="website"
          type="url"
          className="field"
          placeholder="https://"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="about">
          How you verify work on the ground
        </label>
        <textarea
          id="about"
          className="field min-h-32"
          required
          minLength={20}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending' : 'Send application'}
      </button>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
