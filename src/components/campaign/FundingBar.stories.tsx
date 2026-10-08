import type { Meta, StoryObj } from '@storybook/react';

import { FundingBar } from './FundingBar';

const meta: Meta<typeof FundingBar> = {
  title: 'Campaign/FundingBar',
  component: FundingBar,
  tags: ['autodocs'],
  argTypes: {
    kind: {
      control: 'select',
      options: ['emergency', 'climate'],
    },
    size: {
      control: 'radio',
      options: ['sm', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FundingBar>;

export const EmergencyInEscrow: Story = {
  args: {
    kind: 'emergency',
    goal: '1000000000',
    raised: '600000000',
    released: '250000000',
    size: 'lg',
    showFigures: true,
  },
};

export const ClimateFullyReleased: Story = {
  args: {
    kind: 'climate',
    goal: '500000000',
    raised: '500000000',
    released: '500000000',
    size: 'sm',
    showFigures: true,
  },
};

export const CompactNoFigures: Story = {
  args: {
    kind: 'emergency',
    goal: '2000000000',
    raised: '1200000000',
    released: '800000000',
    size: 'sm',
    showFigures: false,
  },
};
