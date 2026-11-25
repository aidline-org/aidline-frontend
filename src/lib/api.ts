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
  refunded?: string;
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
  dueDate?: string | null;
  released: boolean;
  releasedAt: string | null;
  txHash: string | null;
  proofUri: string | null;
  proof: Proof | null;
}

export interface EmergencyAdvance {
  amount: string;
  releasedAt: string | null;
  txHash: string | null;
}

export interface CampaignDetail extends Omit<Campaign, 'milestones'> {
  milestones: Milestone[];
  emergencyAdvance?: EmergencyAdvance | null;
  sponsor?: string | null;
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

export interface DonorPosition {
  given: bigint;
  refunded: bigint;
}

export function donorPosition(history: DonorHistory, campaignId: string): DonorPosition {
  const given = history.donations
    .filter((d) => d.campaignId === campaignId)
    .reduce((sum, d) => sum + BigInt(d.amount), 0n);
  const refunded = history.refunds
    .filter((r) => r.campaignId === campaignId)
    .reduce((sum, r) => sum + BigInt(r.amount), 0n);
  return { given, refunded };
}

export interface CachedUpload<K, I> {
  key: K;
  input: I;
  uri: string;
}

export function reuseUpload<K, I>(
  cached: CachedUpload<K, I> | null,
  key: K,
  input: I,
): string | null {
  if (!cached || cached.key !== key || cached.input !== input) return null;
  return cached.uri;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Reads give up after this long so a slow or sleeping API cannot hold a page open; the page
 * renders its "unavailable" state instead. Writes have no limit because proof uploads can be large.
 */
export const READ_TIMEOUT_MS = 8000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const read = !init?.method || init.method === 'GET';
  const res = await fetch(`${config.apiUrl}${path}`, {
    // #139: Public reads are revalidated every 30 seconds. Pages change slowly,
    // and router.refresh() after a transaction bypasses the cache for fresh data.
    next: { revalidate: 30 },
    ...(read && { signal: AbortSignal.timeout(READ_TIMEOUT_MS) }),
    ...init,
  });
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
    params: {
      kind?: CampaignKind;
      status?: CampaignStatus;
      q?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => request<{ items: Campaign[]; total: number }>(`/campaigns${query(params)}`),
  campaign: (id: string) =>
    request<CampaignDetail>(`/campaigns/${encodeURIComponent(id)}`),
  donations: (
    id: string,
    limitOrParams: number | { limit?: number; offset?: number } = 20,
    offset?: number,
  ) => {
    const params =
      typeof limitOrParams === 'number'
        ? { limit: limitOrParams, offset }
        : limitOrParams;
    return request<{ items: Donation[]; total?: number }>(
      `/campaigns/${encodeURIComponent(id)}/donations${query(params)}`,
    );
  },
  releases: (limit = 6) => request<{ items: Release[] }>(`/releases${query({ limit })}`),
  verifiers: () => request<{ items: Verifier[] }>('/verifiers'),
  verifier: (address: string) =>
    request<Verifier & { active: boolean }>(`/verifiers/${encodeURIComponent(address)}`),
  donor: (address: string) =>
    request<DonorHistory>(`/donors/${encodeURIComponent(address)}`),

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
