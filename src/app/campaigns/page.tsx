import type { Metadata } from 'next';
import Link from 'next/link';

import { CampaignCard } from '@/components/campaign/CampaignCard';
import { Container } from '@/components/ui/Container';
import { Notice } from '@/components/ui/Notice';
import { api, type CampaignKind, type CampaignStatus } from '@/lib/api';
import { safe } from '@/lib/safe';

export const metadata: Metadata = { title: 'Campaigns' };

const KINDS: { value?: CampaignKind; label: string }[] = [
  { label: 'All' },
  { value: 'emergency', label: 'Emergency relief' },
  { value: 'climate', label: 'Climate action' },
];

const STATUSES: { value?: CampaignStatus; label: string }[] = [
  { value: 'active', label: 'Open' },
  { value: 'completed', label: 'Fully released' },
  { value: 'expired', label: 'Ended' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 12;

export default async function CampaignsPage(props: PageProps<'/campaigns'>) {
  const sp = await props.searchParams;
  const kind = KINDS.find((k) => k.value === sp.kind)?.value;
  const status = STATUSES.find((s) => s.value === sp.status)?.value ?? 'active';
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await safe(() =>
    api.campaigns({ kind, status, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  );
  const href = (next: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { kind, status, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/campaigns?${q.toString()}`;
  };

  return (
    <Container className="pt-12">
      <p className="kicker">Campaigns</p>
      <h1 className="mt-3 text-[2.75rem]">Every campaign, every payout, in the open</h1>

      <div className="mt-10 flex flex-col gap-4 border-y border-rule py-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Campaign type" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
          {KINDS.map((k) => (
            <Link
              key={k.label}
              href={href({ kind: k.value, page: undefined })}
              aria-current={kind === k.value ? 'page' : undefined}
              className={
                kind === k.value
                  ? 'text-ink underline decoration-ink underline-offset-[6px]'
                  : 'text-ink-soft hover:text-ink'
              }
            >
              {k.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Campaign status" className="flex flex-wrap gap-2 text-sm">
          {STATUSES.map((s) => (
            <Link
              key={s.label}
              href={href({ status: s.value, page: undefined })}
              aria-current={status === s.value ? 'page' : undefined}
              className={`border px-3 py-1 ${status === s.value ? 'border-ink text-ink' : 'border-rule text-ink-soft hover:border-ink'}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {!result ? (
        <div className="mt-10">
          <Notice title="Campaigns could not be loaded" tone="danger">
            The Aidline API is not responding. Try again in a moment.
          </Notice>
        </div>
      ) : result.items.length === 0 ? (
        <p className="mt-12 text-ink-muted">
          No campaigns match these filters.{' '}
          <Link href="/start" className="link">
            Start one
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="figure mt-6 text-sm text-ink-muted">
            {result.total} campaign{result.total === 1 ? '' : 's'}
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
          {result.total > PAGE_SIZE && (
            <div className="mt-14 flex justify-between border-t border-rule pt-5 text-[0.9375rem]">
              {page > 1 ? (
                <Link className="link" href={href({ page: String(page - 1) })}>
                  Newer
                </Link>
              ) : (
                <span />
              )}
              {page * PAGE_SIZE < result.total && (
                <Link className="link" href={href({ page: String(page + 1) })}>
                  Older
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
