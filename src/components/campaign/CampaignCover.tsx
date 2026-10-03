import type { Campaign } from '@/lib/api';

import { TypographicCover } from './TypographicCover';

export function CampaignCover({
  campaign,
  className = '',
}: {
  campaign: Pick<Campaign, 'kind' | 'metadata'>;
  className?: string;
}) {
  const m = campaign.metadata;
  if (m?.imageUrl) {
    return (
      // Campaign images come from arbitrary hosts, so next/image optimisation is not used.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageUrl} alt="" className={`object-cover ${className}`} />
    );
  }
  return (
    <TypographicCover
      kind={campaign.kind}
      location={m?.location ?? 'Location pending'}
      className={className}
    />
  );
}
