'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { KIND } from '@/components/campaign/kind';
import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, ApiError, type CampaignKind, type Verifier } from '@/lib/api';
import { config } from '@/lib/config';
import { formatAmount, parseAmount, shortAddress } from '@/lib/format';
import { describeError } from '@/lib/stellar/errors';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

const DAY = 86_400_000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function CreateCampaignForm({ verifiers }: { verifiers: Verifier[] }) {
  const router = useRouter();
  const { address, state: wallet, connect, sign } = useWallet();
  const { state, run, busy } = useTx();

  const [kind, setKind] = useState<CampaignKind>('emergency');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // null until edited, so it follows the connected wallet by default.
  const [beneficiaryInput, setBeneficiary] = useState<string | null>(null);
  const [verifier, setVerifier] = useState(verifiers[0]?.address ?? '');
  const [minDate] = useState(() => isoDate(new Date(Date.now() + DAY)));
  const [deadline, setDeadline] = useState(() => isoDate(new Date(Date.now() + 30 * DAY)));
  const [milestones, setMilestones] = useState(['', '']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const beneficiary = beneficiaryInput ?? address ?? '';

  const amounts = milestones.map((m) => parseAmount(m));
  const goal = amounts.every((a) => a !== null && a > 0n)
    ? amounts.reduce<bigint>((sum, a) => sum + (a ?? 0n), 0n)
    : null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 5) e.title = 'Use at least 5 characters.';
    if (summary.trim().length < 10) e.summary = 'Use at least 10 characters.';
    if (description.trim().length < 20)
      e.description = 'Tell donors a little more, at least 20 characters.';
    if (location.trim().length < 2) e.location = 'Where is the work happening?';
    if (!/^G[A-Z2-7]{55}$/.test(beneficiary.trim()))
      e.beneficiary = 'Enter a Stellar address starting with G.';
    if (!verifier) e.verifier = 'Choose a verifier.';
    if (!deadline || deadline < minDate) e.deadline = 'Pick a date in the future.';
    amounts.forEach((a, i) => {
      if (a === null || a <= 0n) e[`m${i}`] = 'Enter an amount greater than zero.';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setFormError(null);
    if (!address || !validate()) return;

    let metadataUri: string;
    try {
      metadataUri = (
        await api.createMetadata({
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim(),
          location: location.trim(),
          organizer: organizer.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        })
      ).uri;
    } catch (err) {
      if (err instanceof ApiError && err.issues.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])));
      } else {
        setFormError(describeError(err));
      }
      return;
    }

    let createdId: string | null = null;
    const result = await run(
      async (on) => {
        const r = await aidline.createCampaign(
          {
            creator: address,
            beneficiary: beneficiary.trim(),
            verifier,
            kind,
            metadataUri,
            // End of the chosen day in UTC.
            deadline: new Date(`${deadline}T23:59:59Z`),
            milestones: amounts as bigint[],
          },
          sign,
          on,
        );
        createdId = String(r.value);
        return r;
      },
      async () => {
        if (!createdId) return false;
        await api.campaign(createdId);
        return true;
      },
    );
    if (result) router.push(`/campaigns/${String(result.value)}`);
  };

  if (verifiers.length === 0) {
    return (
      <p className="border-y border-rule py-6">
        No verifiers are registered yet, and every campaign needs one.{' '}
        <Link href="/verifiers" className="link">
          Apply to become a verifier
        </Link>
        .
      </p>
    );
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1.5 text-[0.8125rem] text-danger" id={`${key}-error`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <form
      noValidate
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset>
        <legend className="kicker mb-4">1. What kind of campaign</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['emergency', 'climate'] as const).map((k) => (
            <label
              key={k}
              className={`cursor-pointer border p-4 ${kind === k ? `${KIND[k].border} ${KIND[k].wash}` : 'border-rule'}`}
            >
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="sr-only"
              />
              <span className={`font-medium ${KIND[k].text}`}>{KIND[k].label}</span>
              <span className="mt-1 block text-[0.875rem]">
                {k === 'emergency'
                  ? 'Floods, earthquakes, fires. Short deadlines, fast first milestones.'
                  : 'Reforestation, clean water, renewable energy. Longer, staged work.'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="kicker mb-4">2. The story donors will read</legend>
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Clean water after flooding in Les Cayes"
          />
          {err('title')}
        </div>
        <div>
          <label className="label" htmlFor="summary">
            One line summary
          </label>
          <input
            id="summary"
            className="field"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={280}
          />
          {err('summary')}
        </div>
        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            className="field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Les Cayes, Haiti"
            maxLength={120}
          />
          {err('location')}
        </div>
        <div>
          <label className="label" htmlFor="organizer">
            Raised by <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id="organizer"
            className="field"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="Haitian community association, Montreal"
            maxLength={120}
          />
          <p className="hint">
            Your group or community abroad. Donors trust campaigns they can place.
          </p>
          {err('organizer')}
        </div>
        <div>
          <label className="label" htmlFor="description">
            What is happening and what the money will do
          </label>
          <textarea
            id="description"
            className="field min-h-40"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
          />
          <p className="hint">Leave a blank line between paragraphs.</p>
          {err('description')}
        </div>
        <div>
          <label className="label" htmlFor="image">
            Cover photo URL <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id="image"
            type="url"
            className="field"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://"
          />
          <p className="hint">
            A real photo of the place or the work. Without one, a cover is drawn from the location.
          </p>
          {err('imageUrl')}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="kicker mb-4">3. Milestones and money</legend>
        <ol className="space-y-3">
          {milestones.map((m, i) => (
            <li key={i}>
              <div className="flex items-center gap-3">
                <span className="figure w-6 text-sm text-ink-muted">{i + 1}</span>
                <div className="flex flex-1">
                  <input
                    aria-label={`Milestone ${i + 1} amount`}
                    inputMode="decimal"
                    className="field figure rounded-r-none"
                    value={m}
                    placeholder="0"
                    onChange={(e) =>
                      setMilestones((ms) => ms.map((x, j) => (j === i ? e.target.value : x)))
                    }
                  />
                  <span className="figure flex items-center border border-l-0 border-rule bg-paper-sunk px-3 text-ink-muted">
                    {config.tokenSymbol}
                  </span>
                </div>
                {milestones.length > 1 && (
                  <button
                    type="button"
                    className="link text-sm"
                    onClick={() => setMilestones((ms) => ms.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
              {errors[`m${i}`] && (
                <p className="mt-1.5 pl-9 text-[0.8125rem] text-danger">{errors[`m${i}`]}</p>
              )}
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between border-t border-rule pt-4">
          {milestones.length < 20 ? (
            <button
              type="button"
              className="link text-sm"
              onClick={() => setMilestones((ms) => [...ms, ''])}
            >
              Add a milestone
            </button>
          ) : (
            <span />
          )}
          <p className="text-sm">
            Goal{' '}
            <span className="figure ml-2 text-ink">
              {goal !== null ? formatAmount(goal) : '...'}
            </span>
          </p>
        </div>
        <div>
          <label className="label" htmlFor="deadline">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            className="field figure"
            value={deadline}
            min={minDate}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="hint">
            If milestones are not all verified by then, donors can reclaim unreleased funds.
          </p>
          {err('deadline')}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="kicker mb-4">4. Who gets paid and who checks</legend>
        <div>
          <label className="label" htmlFor="beneficiary">
            Beneficiary wallet
          </label>
          <input
            id="beneficiary"
            className="field figure text-sm"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder="G..."
          />
          <p className="hint">
            Receives each milestone payout. Often the local organisation doing the work.
          </p>
          {err('beneficiary')}
        </div>
        <div>
          <label className="label" htmlFor="verifier">
            Verifier
          </label>
          <select
            id="verifier"
            className="field"
            value={verifier}
            onChange={(e) => setVerifier(e.target.value)}
          >
            {verifiers.map((v) => (
              <option key={v.address} value={v.address}>
                {v.orgName
                  ? `${v.orgName}${v.country ? `, ${v.country}` : ''}`
                  : shortAddress(v.address, 6)}
              </option>
            ))}
          </select>
          <p className="hint">
            An independent organisation that confirms each milestone before money moves.
          </p>
          {err('verifier')}
        </div>
      </fieldset>

      <div className="border-t-2 border-ink pt-6">
        {wallet.status === 'connected' ? (
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy}>
            Create campaign{goal !== null ? ` for ${formatAmount(goal)}` : ''}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => void connect()}>
            Connect wallet to continue
          </button>
        )}
        {formError && (
          <p role="alert" className="mt-4 text-danger">
            {formError}
          </p>
        )}
        <TxStatus state={state} success="Campaign created. Taking you to its page." />
      </div>
    </form>
  );
}
