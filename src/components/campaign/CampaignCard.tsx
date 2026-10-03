import Link from 'next/link';

import type { Campaign } from '@/lib/api';
import { deadlineLabel } from '@/lib/format';

import { CampaignCover } from './CampaignCover';
import { FundingBar } from './FundingBar';
import { KIND, STATUS_LABEL } from './kind';

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const k = KIND[campaign.kind];
  const m = campaign.metadata;
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="group flex flex-col border-t-2 border-ink pt-4"
    >
      <CampaignCover campaign={campaign} className="aspect-[3/2] w-full" />
      <div className="mt-4 flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
        <span className={k.text}>{k.short}</span>
        <span className="text-rule">/</span>
        <span className="text-ink-muted">{m?.location ?? 'Unknown location'}</span>
      </div>
      <h3 className="mt-2 text-[1.375rem] group-hover:underline group-hover:decoration-rule group-hover:underline-offset-4">
        {m?.title ?? `Campaign #${campaign.id}`}
      </h3>
      {m?.organizer && (
        <p className="mt-1.5 text-[0.8125rem] text-ink-muted">Raised by {m.organizer}</p>
      )}
      {m?.summary && <p className="mt-2 line-clamp-2 text-[0.9375rem]">{m.summary}</p>}
      <div className="mt-auto pt-5">
        <FundingBar
          kind={campaign.kind}
          goal={campaign.goal}
          raised={campaign.raised}
          released={campaign.released}
        />
        <p className="mt-3 flex justify-between text-[0.8125rem] text-ink-muted">
          <span>
            {campaign.milestonesReleased} of {campaign.milestones.length} milestones verified
          </span>
          <span>
            {campaign.status === 'active'
              ? deadlineLabel(campaign.deadline)
              : STATUS_LABEL[campaign.status]}
          </span>
        </p>
      </div>
    </Link>
  );
}
