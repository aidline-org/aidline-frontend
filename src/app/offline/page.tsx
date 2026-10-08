import Link from 'next/link';

import { Container } from '@/components/ui/Container';

export default function OfflinePage() {
  return (
    <Container className="py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
        Connection lost
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-[var(--ink)]">You are offline</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--ink-soft)]">
        Aidline requires an active internet connection to load campaign updates and verify wallet
        data. Please check your connection and try again.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-[2px] bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink-soft)]"
        >
          Retry connection
        </Link>
      </div>
    </Container>
  );
}
