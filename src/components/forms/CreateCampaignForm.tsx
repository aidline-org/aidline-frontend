'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { CampaignCover } from '@/components/campaign/CampaignCover';
import { KIND } from '@/components/campaign/kind';
import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import {
  api,
  ApiError,
  reuseUpload,
  type Campaign,
  type CampaignKind,
  type CachedUpload,
  type Verifier,
} from '@/lib/api';
import { config } from '@/lib/config';
import {
  clearCampaignDraft,
  isCampaignDraftEmpty,
  readCampaignDraft,
  saveCampaignDraft,
  type CampaignDraft,
} from '@/lib/campaignDraft';
import { defaultDeadline, minimumDeadline } from '@/lib/deadline';
import { errorFieldId, errorSummary, fieldA11y } from '@/lib/formA11y';
import { formatAmount, parseAmount, shortAddress, splitParagraphs } from '@/lib/format';
import { formatFileSize, PROOF_UPLOAD_LIMITS } from '@/lib/proofUpload';
import { describeError } from '@/lib/stellar/errors';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

const COVER_ACCEPT = 'image/jpeg,image/png,image/webp';
const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const COVER_MAX_BYTES = PROOF_UPLOAD_LIMITS.maxFileSizeBytes;

function coverFileError(file: File): string | null {
  if (!COVER_TYPES.includes(file.type)) return 'Use a JPEG, PNG or WebP image.';
  if (file.size === 0) return 'That file is empty.';
  if (file.size > COVER_MAX_BYTES) {
    return `Images must be ${formatFileSize(COVER_MAX_BYTES)} or smaller.`;
  }
  return null;
}

function CharacterCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const [count, setCount] = useState(value.length);

  useEffect(() => {
    const timer = setTimeout(() => setCount(value.length), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <p className="hint figure" aria-live="polite" aria-atomic="true">
      {count} / {max}
      {min === undefined ? null : ` · at least ${min} characters`}
    </p>
  );
}

export function CreateCampaignForm({
  verifiers,
  verifiersUnavailable = false,
}: {
  verifiers: Verifier[];
  verifiersUnavailable?: boolean;
}) {
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverPreviewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState(false);
  // null until edited, so it follows the connected wallet by default.
  const [beneficiaryInput, setBeneficiary] = useState<string | null>(null);
  const [verifier, setVerifier] = useState(verifiers[0]?.address ?? '');
  const [minDate] = useState(() => minimumDeadline());
  const [deadline, setDeadline] = useState(() => defaultDeadline());
  const [milestones, setMilestones] = useState(['', '']);
  const [milestoneDueDates, setMilestoneDueDates] = useState(['', '']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<CampaignDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'unavailable' | 'restored'>(
    'idle',
  );
  const uploadedMetadata = useRef<CachedUpload<string, null> | null>(null);

  useEffect(() => {
    setDraftToRestore(readCampaignDraft());
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || draftToRestore) return;
    const draft: CampaignDraft = {
      kind,
      title,
      summary,
      description,
      location,
      organizer,
      imageUrl,
      beneficiaryInput,
      verifier,
      deadline,
      milestones,
      milestoneDueDates,
    };
    if (isCampaignDraftEmpty(draft)) {
      clearCampaignDraft();
      setDraftStatus('idle');
      return;
    }
    const timer = window.setTimeout(() => {
      setDraftStatus(saveCampaignDraft(draft) ? 'saved' : 'unavailable');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    draftToRestore,
    kind,
    title,
    summary,
    description,
    location,
    organizer,
    imageUrl,
    beneficiaryInput,
    verifier,
    deadline,
    milestones,
    milestoneDueDates,
  ]);

  useEffect(
    () => () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    },
    [],
  );

  const beneficiary = beneficiaryInput ?? address ?? '';
  const metadata = {
    title: title.trim(),
    summary: summary.trim(),
    description: description.trim(),
    location: location.trim(),
    organizer: organizer.trim() || undefined,
    imageUrl: imageUrl.trim() || undefined,
  };
  const metadataKey = JSON.stringify(metadata);
  const clearMetadata = () => {
    uploadedMetadata.current = null;
  };

  const amounts = milestones.map((m) => parseAmount(m));
  const goal = amounts.every((a) => a !== null && a > 0n)
    ? amounts.reduce<bigint>((sum, a) => sum + (a ?? 0n), 0n)
    : null;

  /**
   * Error keys are collected in visual order so the first entry is also the
   * first field a keyboard user meets on the page.
   */
  const collectErrors = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 5) e.title = 'Use at least 5 characters.';
    if (summary.trim().length < 10) e.summary = 'Use at least 10 characters.';
    if (description.trim().length < 20)
      e.description = 'Tell donors a little more, at least 20 characters.';
    if (location.trim().length < 2) e.location = 'Where is the work happening?';
    const fileError = coverFile ? coverFileError(coverFile) : null;
    if (fileError) e.cover = fileError;
    if (!/^G[A-Z2-7]{55}$/.test(beneficiary.trim()))
      e.beneficiary = 'Enter a Stellar address starting with G.';
    if (!verifier) e.verifier = 'Choose a verifier.';
    amounts.forEach((a, i) => {
      if (a === null || a <= 0n) e[`m${i}`] = 'Enter an amount greater than zero.';
    });
    const hasAnyDueDate = milestoneDueDates.some((d) => d.trim() !== '');
    if (hasAnyDueDate) {
      let prevDue = '';
      milestoneDueDates.forEach((d, i) => {
        if (!d) {
          e[`md${i}`] = 'Set a due date for every milestone, or leave all blank.';
          return;
        }
        if (d < minDate) {
          e[`md${i}`] = 'Pick a date in the future.';
        } else if (prevDue && d <= prevDue) {
          e[`md${i}`] = 'Due date must be after the previous milestone.';
        } else if (deadline && d > deadline) {
          e[`md${i}`] = 'Due date must be on or before the campaign deadline.';
        }
        prevDue = d;
      });
    }
    if (!deadline || deadline < minDate) e.deadline = 'Pick a date in the future.';
    return e;
  };

  const clearCoverPreview = () => {
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    coverPreviewRef.current = null;
    setCoverPreview(null);
  };

  const chooseCover = async (file: File | null) => {
    setUploadError(null);
    clearCoverPreview();
    if (!file) return;
    setCoverFile(file);

    const fileError = coverFileError(file);
    if (fileError) {
      setErrors((current) => ({ ...current, cover: fileError }));
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next.cover;
      return next;
    });

    const previewUrl = URL.createObjectURL(file);
    coverPreviewRef.current = previewUrl;
    setCoverPreview(previewUrl);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.uploadCover(form);
      const url = result.url ?? result.files?.[0]?.url;
      if (!url) throw new Error('The upload did not return an image URL.');
      setImageUrl(url);
      clearMetadata();
    } catch (err) {
      setUploadError(describeError(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setFormError(null);
    if (!address || uploading || uploadError) return;

    const validationErrors = collectErrors();
    setErrors(validationErrors);

    const invalidKeys = Object.keys(validationErrors);
    if (invalidKeys.length > 0) {
      setAnnouncement(errorSummary(invalidKeys.length));
      const firstInvalidId = errorFieldId(invalidKeys[0]!);
      requestAnimationFrame(() => document.getElementById(firstInvalidId)?.focus());
      return;
    }

    let metadataUri = reuseUpload(uploadedMetadata.current, metadataKey, null);
    if (!metadataUri) {
      try {
        metadataUri = (await api.createMetadata(metadata)).uri;
        uploadedMetadata.current = { key: metadataKey, input: null, uri: metadataUri };
      } catch (err) {
        if (err instanceof ApiError && err.issues.length) {
          setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])));
        } else {
          setFormError(describeError(err));
        }
        return;
      }
    }

    const hasDueDates = milestoneDueDates.some((d) => d.trim() !== '');
    let createdId: string | null = null;
    const result = await run(
      async (on) => {
        const baseParams = {
          creator: address,
          beneficiary: beneficiary.trim(),
          verifier,
          kind,
          metadataUri,
          // End of the chosen day in UTC.
          deadline: new Date(`${deadline}T23:59:59Z`),
          milestones: amounts as bigint[],
        };
        const r = hasDueDates
          ? await aidline.createCampaignWithDueDates(
              {
                ...baseParams,
                milestoneDueDates: milestoneDueDates.map((d) => new Date(`${d}T23:59:59Z`)),
              },
              sign,
              on,
            )
          : await aidline.createCampaign(baseParams, sign, on);
        createdId = String(r.value);
        return r;
      },
      async () => {
        if (!createdId) return false;
        await api.campaign(createdId);
        return true;
      },
    );
    if (result) {
      clearCampaignDraft();
      router.push(`/campaigns/${String(result.value)}`);
    }
  };

  if (verifiersUnavailable) {
    return (
      <div role="alert" className="border-y border-rule py-6">
        <p className="font-medium">We could not load the list of verifiers.</p>
        <p className="mt-1.5 text-[0.9375rem] text-ink-muted">
          The campaign service is not answering right now, so this form cannot show who is able to
          verify a campaign. Refresh the page to try again.
        </p>
      </div>
    );
  }

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

  const coverUrl = imageUrl.trim();
  const coverImageUrl = coverPreview ?? coverUrl;
  const coverCampaign: Pick<Campaign, 'kind' | 'metadata'> = {
    kind,
    metadata: {
      title: '',
      summary: '',
      location: location.trim() || 'Location pending',
      organizer: null,
      category: null,
      imageUrl: coverImageUrl || null,
    },
  };
  const verifierAddress = verifier.trim().toLowerCase();
  const selfVerification =
    verifierAddress.length > 0 &&
    (verifierAddress === beneficiary.trim().toLowerCase() ||
      verifierAddress === (address ?? '').trim().toLowerCase());

  return (
    <form
      noValidate
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {draftToRestore && (
        <div role="status" className="border-l-2 border-ink bg-paper-raised py-3 pl-4 pr-3">
          <p className="font-medium">A saved campaign draft is available.</p>
          <p className="mt-1 text-[0.9375rem] text-ink-muted">
            Restore where you left off, or discard the saved draft.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary text-xs"
              onClick={() => {
                const draft = draftToRestore;
                setKind(draft.kind);
                setTitle(draft.title);
                setSummary(draft.summary);
                setDescription(draft.description);
                setLocation(draft.location);
                setOrganizer(draft.organizer);
                setImageUrl(draft.imageUrl);
                setBeneficiary(draft.beneficiaryInput);
                setVerifier(
                  verifiers.some((item) => item.address === draft.verifier)
                    ? draft.verifier
                    : verifiers[0]?.address ?? '',
                );
                setDeadline(draft.deadline);
                setMilestones(draft.milestones);
                setMilestoneDueDates(draft.milestoneDueDates);
                clearMetadata();
                setDraftToRestore(null);
                setDraftStatus('restored');
                setAnnouncement('Campaign draft restored.');
              }}
            >
              Restore draft
            </button>
            <button
              type="button"
              className="link text-sm"
              onClick={() => {
                clearCampaignDraft();
                setDraftToRestore(null);
                setDraftStatus('idle');
                setAnnouncement('Saved campaign draft discarded.');
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {draftStatus === 'saved' && (
        <p role="status" className="text-xs text-ink-muted">
          Draft saved on this device.
        </p>
      )}
      {draftStatus === 'restored' && (
        <p role="status" className="text-xs text-ink-muted">
          Draft restored.
        </p>
      )}
      {draftStatus === 'unavailable' && (
        <p role="status" className="text-xs text-ink-muted">
          This browser blocked draft storage. You can keep editing, but the draft may not survive
          a reload.
        </p>
      )}

      <fieldset>
        <legend className="kicker mb-4">1. What kind of campaign</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['emergency', 'climate'] as const).map((k) => (
            <label
              key={k}
              className={`cursor-pointer border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink has-[:focus-visible]:outline-offset-2 ${kind === k ? `${KIND[k].border} ${KIND[k].wash}` : 'border-rule'}`}
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
        <legend className="kicker">2. The story donors will read</legend>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? 'Edit story' : 'Preview'}
          </button>
        </div>
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="field"
            {...fieldA11y('title', errors)}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearMetadata();
            }}
            maxLength={120}
            placeholder="Clean water after flooding in Les Cayes"
          />
          <CharacterCount value={title} max={120} min={5} />
          {err('title')}
        </div>
        <div>
          <label className="label" htmlFor="summary">
            One line summary
          </label>
          <input
            id="summary"
            className="field"
            {...fieldA11y('summary', errors)}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              clearMetadata();
            }}
            maxLength={280}
          />
          <CharacterCount value={summary} max={280} min={10} />
          {err('summary')}
        </div>
        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            className="field"
            {...fieldA11y('location', errors)}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              clearMetadata();
            }}
            placeholder="Les Cayes, Haiti"
            maxLength={120}
          />
          <CharacterCount value={location} max={120} min={2} />
          {err('location')}
        </div>
        <div>
          <label className="label" htmlFor="organizer">
            Raised by <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id="organizer"
            className="field"
            {...fieldA11y('organizer', errors, 'organizer-hint')}
            value={organizer}
            onChange={(e) => {
              setOrganizer(e.target.value);
              clearMetadata();
            }}
            placeholder="Haitian community association, Montreal"
            maxLength={120}
          />
          <p className="hint" id="organizer-hint">
            Your group or community abroad. Donors trust campaigns they can place.
          </p>
          <CharacterCount value={organizer} max={120} />
          {err('organizer')}
        </div>
        <div>
          <label className="label" htmlFor="description">
            What is happening and what the money will do
          </label>
          <textarea
            id="description"
            className="field min-h-40"
            {...fieldA11y('description', errors, 'description-hint')}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearMetadata();
            }}
            maxLength={10000}
          />
          <p className="hint" id="description-hint">
            Leave a blank line between paragraphs.
          </p>
          {err('description')}
        </div>
        <div>
          <label className="label" htmlFor="cover">
            Cover photo <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id="cover"
            type="file"
            accept={COVER_ACCEPT}
            className="block w-full text-sm file:mr-3 file:border file:border-ink file:bg-transparent file:px-3 file:py-1.5 file:text-ink"
            {...fieldA11y('cover', errors, 'cover-hint')}
            onChange={(e) => void chooseCover(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          <p className="hint" id="cover-hint">
            JPEG, PNG or WebP, up to {formatFileSize(COVER_MAX_BYTES)}. Without a photo, a cover is
            drawn from the location.
          </p>
          {uploading && (
            <p role="status" className="hint">
              Uploading cover image.
            </p>
          )}
          {uploadError && (
            <p role="alert" className="hint text-danger">
              {uploadError}
            </p>
          )}
          {err('cover')}
          <div className="mt-3">
            <CampaignCover
              campaign={coverCampaign}
              alt="Cover photo preview"
              className="h-20 w-32 border border-rule"
            />
          </div>
          <details className="mt-3">
            <summary className="link text-sm">Use an image URL instead</summary>
            <div className="mt-2">
              <label className="sr-only" htmlFor="imageUrl">
                Cover photo URL
              </label>
              <input
                id="imageUrl"
                type="url"
                className="field"
                {...fieldA11y('imageUrl', errors, 'image-hint')}
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setCoverFile(null);
                  clearCoverPreview();
                  setUploadError(null);
                  clearMetadata();
                }}
                placeholder="https://"
              />
              <p className="hint" id="image-hint">
                Use a direct link to an image on https://.
              </p>
              {/^http:/i.test(coverUrl) && (
                <p className="hint text-danger">
                  http: links are blocked on secure sites. Use https:// so the image loads for
                  donors.
                </p>
              )}
              {err('imageUrl')}
            </div>
          </details>
        </div>

        {preview ? (
          <div className="rounded border border-rule p-6 space-y-6">
            <div>
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em]">
                <span className={KIND[kind].text}>{KIND[kind].label}</span>
                <span className="text-rule"> / </span>
                <span className="text-ink-muted">{location.trim() || 'Unknown location'}</span>
              </p>
              <h1 className="mt-4 text-[2.5rem] sm:text-[3.25rem]">
                {title.trim() || 'Campaign title'}
              </h1>
              {summary.trim() && (
                <p className="mt-5 max-w-[40rem] text-[1.1875rem] text-ink-soft">
                  {summary.trim()}
                </p>
              )}
              {organizer.trim() && (
                <p className="mt-4 text-[0.9375rem] text-ink-muted">
                  Raised by <span className="text-ink">{organizer.trim()}</span>
                </p>
              )}
            </div>

            <CampaignCover
              campaign={{
                kind,
                metadata: {
                  title: title.trim(),
                  summary: summary.trim(),
                  location: location.trim(),
                  organizer: organizer.trim() || null,
                  category: null,
                  imageUrl: imageUrl.trim() || null,
                  description: description.trim(),
                },
              }}
              className="aspect-video w-full"
            />

            {description.trim() ? (
              <section className="mt-12">
                <p className="kicker">The situation</p>
                <div className="mt-4 max-w-[68ch] space-y-4 text-[1.0625rem]">
                  {splitParagraphs(description).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="kicker mb-4">3. Milestones and money</legend>
        <ol className="space-y-3">
          {milestones.map((m, i) => (
            <li key={i}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="figure w-6 text-sm text-ink-muted">{i + 1}</span>
                <div className="flex min-w-[10rem] flex-1">
                  <input
                    id={`milestone-${i}`}
                    aria-label={`Milestone ${i + 1} amount`}
                    inputMode="decimal"
                    className="field figure rounded-r-none"
                    {...fieldA11y(`m${i}`, errors)}
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
                <input
                  id={`milestone-due-${i}`}
                  type="date"
                  aria-label={`Milestone ${i + 1} due date (optional)`}
                  className="field figure w-auto"
                  {...fieldA11y(`md${i}`, errors)}
                  value={milestoneDueDates[i] ?? ''}
                  min={minDate}
                  max={deadline || undefined}
                  onChange={(e) =>
                    setMilestoneDueDates((ds) => ds.map((x, j) => (j === i ? e.target.value : x)))
                  }
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    className="link text-sm"
                    onClick={() => {
                      setMilestones((ms) => ms.filter((_, j) => j !== i));
                      setMilestoneDueDates((ds) => ds.filter((_, j) => j !== i));
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {errors[`m${i}`] && (
                <p id={`m${i}-error`} className="mt-1.5 pl-9 text-[0.8125rem] text-danger">
                  {errors[`m${i}`]}
                </p>
              )}
              {errors[`md${i}`] && (
                <p id={`md${i}-error`} className="mt-1.5 pl-9 text-[0.8125rem] text-danger">
                  {errors[`md${i}`]}
                </p>
              )}
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between border-t border-rule pt-4">
          {milestones.length < 20 ? (
            <button
              type="button"
              className="link text-sm"
              onClick={() => {
                setMilestones((ms) => [...ms, '']);
                setMilestoneDueDates((ds) => [...ds, '']);
              }}
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
            {...fieldA11y('deadline', errors, 'deadline-hint')}
            value={deadline}
            min={minDate}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="hint" id="deadline-hint">
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
            {...fieldA11y('beneficiary', errors, 'beneficiary-hint')}
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder="G..."
          />
          <p className="hint" id="beneficiary-hint">
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
            {...fieldA11y('verifier', errors, 'verifier-hint')}
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
          <p className="hint" id="verifier-hint">
            An independent organisation that confirms each milestone before money moves.
          </p>
          {selfVerification && (
            <p role="status" className="hint text-danger">
              This verifier is also a party to the campaign, so donors may see it as checking its
              own work.
            </p>
          )}
          {err('verifier')}
        </div>
      </fieldset>

      <div className="border-t-2 border-ink pt-6">
        {wallet.status === 'connected' ? (
          <button
            type="submit"
            className="btn btn-primary w-full sm:w-auto"
            disabled={busy || uploading || Boolean(uploadError)}
          >
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
