import type { Metadata } from 'next';

import { CreateCampaignForm } from '@/components/forms/CreateCampaignForm';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import { safe } from '@/lib/safe';

export const metadata: Metadata = { title: 'Start a campaign' };

export default async function StartPage() {
  const verifiers = await safe(api.verifiers);
  return (
    <Container className="grid gap-12 pt-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="kicker">Start a campaign</p>
        <h1 className="mt-3 text-[2.5rem]">Raise funds that donors can follow</h1>
        <div className="mt-6 space-y-4 text-[0.9375rem]">
          <p>
            Split your goal into milestones. Donations wait in escrow, and each milestone is paid to
            your beneficiary wallet once your chosen verifier confirms the work.
          </p>
          <p>
            Choose milestones you can prove: a delivery, a site visit, a receipt. Smaller, earlier
            milestones get money moving sooner.
          </p>
          <p className="text-ink-muted">
            Creating a campaign takes one signature. A small network fee applies.
          </p>
        </div>
      </div>
      <div className="lg:col-span-7 lg:col-start-6">
        <CreateCampaignForm verifiers={verifiers?.items ?? []} />
      </div>
    </Container>
  );
}
