import { config } from './config';

export type CampaignKind = 'emergency' | 'climate';
export type CampaignStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface CampaignMetadata {
  title: string;
  summary: string;
  location: string;
  organizer: string | null;
  category: string | null;
  imageUrl: string | null;
  description?: string;
}

export interface Campaign {
  id: string;
  kind: CampaignKind;
  status: CampaignStatus;
  creator: string;
  beneficiary: string;
  verifier: string;
  goal: string;
  raised: string;
  released: string;
  milestones: string[];
  milestonesReleased: number;
  deadline: string;
  metadataUri: string;
  createdAt: string;
  donorCount: number;
  metadata: CampaignMetadata | null;
}

export interface ProofFile {
  name: string;
  type: string;
  url: string;
}

export interface Proof {
  id: string;
  note: string;
  files: ProofFile[];
}

export interface Milestone {
  index: number;
  amount: string;
  released: boolean;
  releasedAt: string | null;
  txHash: string | null;
  proofUri: string | null;
  proof: Proof | null;
}

export interface CampaignDetail extends Omit<Campaign, 'milestones'> {
  milestones: Milestone[];
}

export interface Donation {
  donor: string;
  amount: string;
  txHash: string;
  createdAt: string;
}

export interface Release {
  campaignId: string;
  campaignTitle: string | null;
  location: string | null;
  organizer: string | null;
  kind: CampaignKind;
  index: number;
  amount: string;
  releasedAt: string;
  txHash: string;
  verifier: string;
  verifierName: string | null;
  proofUri: string;
  proof: Proof | null;
}

export interface Stats {
  campaigns: number;
  activeCampaigns: number;
  totalDonated: string;
  totalReleased: string;
  totalRefunded: string;
  donors: number;
  verifiers: number;
  milestonesVerified: number;
}

export interface Verifier {
  address: string;
  orgName: string | null;
  website: string | null;
  country: string | null;
  description: string | null;
}

export interface VerifierApplication {
  address: string;
  orgName: string;
  website?: string | null;
  country: string;
  description: string;
  createdAt?: string;
  status?: string;
}

/** One daily snapshot from GET /stats/history. Amounts are stroop strings. */
export interface StatsHistoryPoint {
  snapshotDate: string;
  campaigns: number;
  activeCampaigns: number;
  totalDonated: string;
  totalReleased: string;
  totalRefunded: string;
  donors: number;
  verifiers: number;
  milestonesVerified: number;
}

export interface DonorHistory {
  address: string;
  totalDonated: string;
  campaignsSupported: number;
  donations: (Donation & {
    campaignId: string;
    campaignTitle: string | null;
    kind: CampaignKind;
    goal: string;
    raised: string;
    released: string;
  })[];
  refunds: { campaignId: string; amount: string; txHash: string; createdAt: string }[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`, { cache: 'no-store', ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? res.statusText, body?.issues ?? []);
  }
  return body as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  stats: () => request<Stats>('/stats'),
  campaigns: (
    params: { kind?: CampaignKind; status?: CampaignStatus; limit?: number; offset?: number } = {},
  ) => request<{ items: Campaign[]; total: number }>(`/campaigns${query(params)}`),
  campaign: (id: string) => request<CampaignDetail>(`/campaigns/${id}`),
  donations: (id: string, limit = 20) =>
    request<{ items: Donation[] }>(`/campaigns/${id}/donations${query({ limit })}`),
  releases: (limit = 6) => request<{ items: Release[] }>(`/releases${query({ limit })}`),
  verifiers: () => request<{ items: Verifier[] }>('/verifiers'),
  verifier: (address: string) => request<Verifier & { active: boolean }>(`/verifiers/${address}`),
  donor: (address: string) => request<DonorHistory>(`/donors/${address}`),

  createMetadata: (body: {
    title: string;
    summary: string;
    description: string;
    location: string;
    organizer?: string;
    category?: string;
    imageUrl?: string;
  }) =>
    request<{ id: string; uri: string }>('/metadata', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  uploadProof: (form: FormData) =>
    request<{ id: string; uri: string; files: ProofFile[] }>('/proofs', {
      method: 'POST',
      body: form,
    }),
  applyAsVerifier: (body: {
    address: string;
    orgName: string;
    website?: string;
    country: string;
    description: string;
  }) =>
    request<{ address: string; status: string }>('/verifiers/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  verifierApplications: () => request<{ items: VerifierApplication[] }>('/verifiers/applications'),
  statsHistory: () => request<{ items: StatsHistoryPoint[] }>('/stats/history'),
};
