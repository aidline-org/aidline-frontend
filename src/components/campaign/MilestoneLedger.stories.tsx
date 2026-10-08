import type { Meta, StoryObj } from '@storybook/react';

import type { CampaignDetail } from '@/lib/api';

import { MilestoneLedger } from './MilestoneLedger';

const sampleCampaign: CampaignDetail = {
  id: '1',
  kind: 'emergency',
  status: 'active',
  creator: 'GCREATOR1234567890ABCDEF1234567890ABCDEF1234567890A',
  beneficiary: 'GBENEFICIARY1234567890ABCDEF1234567890ABCDEF12345678',
  verifier: 'GVERIFIER1234567890ABCDEF1234567890ABCDEF1234567890A',
  goal: '1000000000',
  raised: '600000000',
  released: '300000000',
  milestonesReleased: 1,
  deadline: '2026-12-31T23:59:59Z',
  metadataUri: 'https://api.aidline.org/metadata/1',
  createdAt: '2026-09-01T10:00:00Z',
  donorCount: 42,
  metadata: {
    title: 'Emergency Clean Water Distribution',
    summary: 'Delivering 50 clean water tanks to affected coastal communities.',
    description: 'Detailed description of the emergency clean water project.',
    location: 'Les Cayes, Haiti',
    organizer: 'Red Relief Network',
    category: 'Water & Sanitation',
    imageUrl: null,
  },
  milestones: [
    {
      index: 0,
      amount: '300000000',
      released: true,
      releasedAt: '2026-09-15T14:30:00Z',
      txHash: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
      proofUri: 'https://api.aidline.org/proofs/1',
      proof: {
        id: 'p1',
        note: 'Delivered initial batch of 20 water purification units and verified site installation.',
        files: [],
      },
    },
    {
      index: 1,
      amount: '300000000',
      released: false,
      releasedAt: null,
      txHash: null,
      proofUri: null,
      proof: null,
    },
    {
      index: 2,
      amount: '400000000',
      released: false,
      releasedAt: null,
      txHash: null,
      proofUri: null,
      proof: null,
    },
  ],
};

const meta: Meta<typeof MilestoneLedger> = {
  title: 'Campaign/MilestoneLedger',
  component: MilestoneLedger,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MilestoneLedger>;

export const ActiveCampaign: Story = {
  args: {
    campaign: sampleCampaign,
    verifierName: 'Red Relief Network',
  },
};
