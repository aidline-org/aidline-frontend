import type { CampaignKind } from '@/lib/api';

export const CAMPAIGN_DRAFT_KEY = 'aidline:create-campaign:draft';

export interface CampaignDraft {
  kind: CampaignKind;
  title: string;
  summary: string;
  description: string;
  location: string;
  organizer: string;
  imageUrl: string;
  beneficiaryInput: string | null;
  verifier: string;
  deadline: string;
  milestones: string[];
  milestoneDueDates: string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseCampaignDraft(raw: string | null): CampaignDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CampaignDraft>;
    if (
      (value.kind !== 'emergency' && value.kind !== 'climate') ||
      typeof value.title !== 'string' ||
      typeof value.summary !== 'string' ||
      typeof value.description !== 'string' ||
      typeof value.location !== 'string' ||
      typeof value.organizer !== 'string' ||
      typeof value.imageUrl !== 'string' ||
      (value.beneficiaryInput !== null && typeof value.beneficiaryInput !== 'string') ||
      typeof value.verifier !== 'string' ||
      typeof value.deadline !== 'string' ||
      !isStringArray(value.milestones) ||
      !isStringArray(value.milestoneDueDates)
    ) {
      return null;
    }
    return value as CampaignDraft;
  } catch {
    return null;
  }
}

export function readCampaignDraft(): CampaignDraft | null {
  try {
    return parseCampaignDraft(window.localStorage.getItem(CAMPAIGN_DRAFT_KEY));
  } catch {
    return null;
  }
}

export function saveCampaignDraft(draft: CampaignDraft): boolean {
  try {
    window.localStorage.setItem(CAMPAIGN_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearCampaignDraft(): void {
  try {
    window.localStorage.removeItem(CAMPAIGN_DRAFT_KEY);
  } catch {
    // Ignore storage quota or private-mode errors.
  }
}

export function isCampaignDraftEmpty(draft: CampaignDraft): boolean {
  return (
    draft.kind === 'emergency' &&
    draft.title === '' &&
    draft.summary === '' &&
    draft.description === '' &&
    draft.location === '' &&
    draft.organizer === '' &&
    draft.imageUrl === '' &&
    draft.beneficiaryInput === null &&
    draft.milestones.every((amount) => amount === '') &&
    draft.milestoneDueDates.every((date) => date === '')
  );
}
