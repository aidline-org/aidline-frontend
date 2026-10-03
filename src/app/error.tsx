'use client';

import { Container } from '@/components/ui/Container';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="pt-20">
      <p className="kicker">Something went wrong</p>
      <h1 className="mt-3 text-[2.5rem]">This page could not be loaded</h1>
      <p className="mt-4">
        The Aidline API may be briefly unavailable. Your funds are not affected.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </Container>
  );
}
