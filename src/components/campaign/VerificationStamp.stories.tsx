import type { Meta, StoryObj } from '@storybook/react';

import { VerificationStamp } from './VerificationStamp';

const meta: Meta<typeof VerificationStamp> = {
  title: 'Campaign/VerificationStamp',
  component: VerificationStamp,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VerificationStamp>;

export const Default: Story = {
  args: {
    verifier: 'GAB1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12',
    verifierName: 'Red Relief Network',
    date: '2026-10-03T12:00:00Z',
  },
};

export const UnnamedVerifier: Story = {
  args: {
    verifier: 'GDKX78901234567890ABCDEF1234567890ABCDEF1234567890A',
    verifierName: null,
    date: '2026-09-15T09:30:00Z',
  },
};
