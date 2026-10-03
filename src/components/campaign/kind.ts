import type { CampaignKind, CampaignStatus } from '@/lib/api';

export const KIND = {
  emergency: {
    label: 'Emergency relief',
    short: 'Emergency',
    text: 'text-relief',
    bg: 'bg-relief',
    wash: 'bg-relief-wash',
    border: 'border-relief',
  },
  climate: {
    label: 'Climate action',
    short: 'Climate',
    text: 'text-climate',
    bg: 'bg-climate',
    wash: 'bg-climate-wash',
    border: 'border-climate',
  },
} satisfies Record<CampaignKind, Record<string, string>>;

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Open',
  completed: 'Fully released',
  cancelled: 'Cancelled',
  expired: 'Ended',
};
