import Link from 'next/link';

import { formatDate, shortAddress } from '@/lib/format';

/** Looks like a rubber stamp on a document. See DESIGN.md. */
export function VerificationStamp({
  verifier,
  verifierName,
  date,
}: {
  verifier: string;
  verifierName?: string | null;
  date: string;
}) {
  return (
    <span className="figure inline-flex items-center gap-2 border border-ink px-2 py-1 text-[0.6875rem] uppercase tracking-[0.06em] text-ink">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M1 5.5L4 8.5L9 1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      Verified ·{' '}
      <Link href={`/verifiers/${verifier}`} className="hover:underline">
        {verifierName ?? shortAddress(verifier)}
      </Link>{' '}
      · {formatDate(date)}
    </span>
  );
}

