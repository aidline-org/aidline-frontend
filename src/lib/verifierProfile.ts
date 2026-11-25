import type { Campaign, Release } from '@/lib/api';

export function campaignsForVerifier(campaigns: Campaign[], address: string): Campaign[] {
  return campaigns.filter((campaign) => campaign.verifier === address);
}

export function releasesForVerifier(releases: Release[], address: string): Release[] {
  return releases.filter((release) => release.verifier === address);
}
