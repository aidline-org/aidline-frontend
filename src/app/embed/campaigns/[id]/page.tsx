import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DonatePanel } from '@/components/campaign/DonatePanel';
import { FundingBar } from '@/components/campaign/FundingBar';
import { KIND } from '@/components/campaign/kind';
import { Wordmark } from '@/components/layout/Wordmark';
import { api } from '@/lib/api';
import { safe } from '@/lib/safe';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmbedCampaignPage({ params }: Props) {
  const { id } = await params;
  const campaign = await safe(() => api.campaign(id));

  if (!campaign) {
    notFound();
  }

  const k = KIND[campaign.kind];
  const m = campaign.metadata;

  return (
    <div className="min-h-screen bg-paper p-4 font-sans text-ink antialiased">
      <div className="mx-auto max-w-sm rounded-[2px] border border-ink bg-paper-raised p-5">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <Wordmark newTab />
          <span className={`text-[0.6875rem] font-medium uppercase tracking-wider ${k.text}`}>
            {k.short}
          </span>
        </div>

        <div className="mt-3">
          <h2 className="text-lg font-bold text-ink leading-snug">
            {m?.title ?? `Campaign #${campaign.id}`}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {m?.organizer ? `By ${m.organizer}` : (m?.location ?? 'Verified Campaign')}
          </p>
        </div>

        <div className="mt-4">
          <FundingBar
            kind={campaign.kind}
            goal={campaign.goal}
            raised={campaign.raised}
            released={campaign.released}
            size="sm"
          />
        </div>

        <div className="mt-5 border-t border-rule pt-4">
          <DonatePanel campaign={campaign} />
        </div>

        <div className="mt-4 border-t border-rule pt-3 text-center">
          <Link
            href={`/campaigns/${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link text-xs font-mono"
          >
            View full campaign on Aidline &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
