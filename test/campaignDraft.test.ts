import { describe, expect, it } from 'vitest';

import {
  isCampaignDraftEmpty,
  parseCampaignDraft,
  type CampaignDraft,
} from '@/lib/campaignDraft';

const emptyDraft: CampaignDraft = {
  kind: 'emergency',
  title: '',
  summary: '',
  description: '',
  location: '',
  organizer: '',
  imageUrl: '',
  beneficiaryInput: null,
  verifier: '',
  deadline: '2026-12-25',
  milestones: ['', ''],
  milestoneDueDates: ['', ''],
};

describe('campaign drafts', () => {
  it('recognises the untouched form and avoids saving it', () => {
    expect(isCampaignDraftEmpty(emptyDraft)).toBe(true);
  });

  it('recognises when the story or milestones have content', () => {
    expect(isCampaignDraftEmpty({ ...emptyDraft, title: 'Clean water' })).toBe(false);
    expect(isCampaignDraftEmpty({ ...emptyDraft, milestones: ['50', ''] })).toBe(false);
  });

  it('round trips a valid local draft', () => {
    const draft = { ...emptyDraft, title: 'Flood relief', verifier: 'GABC' };
    expect(parseCampaignDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it('rejects malformed or incompatible draft data', () => {
    expect(parseCampaignDraft(null)).toBeNull();
    expect(parseCampaignDraft('{bad')).toBeNull();
    expect(parseCampaignDraft(JSON.stringify({ ...emptyDraft, milestones: [1] }))).toBeNull();
  });
});
