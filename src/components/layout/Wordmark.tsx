import Link from 'next/link';

/** A single line that steps up at each milestone: the product in one mark. */
export function Wordmark() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 text-ink"
      aria-label="Aidline home"
    >
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden="true">
        <path
          d="M1 16H8V11H15V6H22V1H27"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
      <span className="font-serif text-[1.375rem] font-semibold tracking-[-0.01em]">Aidline</span>
    </Link>
  );
}
