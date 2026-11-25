import { describe, expect, it } from 'vitest';

import type { Campaign, Release } from '@/lib/api';
import { campaignsForVerifier, releasesForVerifier } from '@/lib/verifierProfile';

describe('verifier profile records', () => {
  it('includes only campaigns overseen by the profile address', () => {
    const campaigns = [
      { id: '1', verifier: 'GABC' },
      { id: '2', verifier: 'GXYZ' },
      { id: '3', verifier: 'GABC' },
    ] as Campaign[];
    expect(campaignsForVerifier(campaigns, 'GABC').map((campaign) => campaign.id)).toEqual([
      '1',
      '3',
    ]);
  });

  it('includes only releases approved by the profile address', () => {
    const releases = [
      { campaignId: '1', verifier: 'GABC' },
      { campaignId: '2', verifier: 'GXYZ' },
    ] as Release[];
    expect(releasesForVerifier(releases, 'GABC').map((release) => release.campaignId)).toEqual([
      '1',
    ]);
  });

  it('returns empty lists for a verifier with no records', () => {
    expect(campaignsForVerifier([], 'GABC')).toEqual([]);
    expect(releasesForVerifier([], 'GABC')).toEqual([]);
  });
});
