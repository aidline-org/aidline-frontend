import type { Meta, StoryObj } from '@storybook/react';

function ButtonDemo({ label, variant = 'primary', disabled = false, size = 'md' }: { label: string; variant?: 'primary' | 'secondary'; disabled?: boolean; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'text-xs py-1 px-3' : '';
  const variantClass = variant === 'primary' ? 'btn btn-primary' : 'btn btn-secondary';
  return (
    <button type="button" className={`${variantClass} ${sizeClass}`} disabled={disabled}>
      {label}
    </button>
  );
}

const meta: Meta<typeof ButtonDemo> = {
  title: 'UI/Button',
  component: ButtonDemo,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['primary', 'secondary'],
    },
    disabled: {
      control: 'boolean',
    },
    size: {
      control: 'radio',
      options: ['md', 'sm'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonDemo>;

export const Primary: Story = {
  args: {
    label: 'Browse campaigns',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'How verification works',
    variant: 'secondary',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Transaction in progress...',
    variant: 'primary',
    disabled: true,
  },
};

export const SmallSecondary: Story = {
  args: {
    label: 'View Data Table',
    variant: 'secondary',
    size: 'sm',
  },
};
