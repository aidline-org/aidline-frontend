import Link from 'next/link';

/**
 * A single line that steps up at each milestone: the product in one mark.
 * `newTab` opens the site in a new tab, for use inside the embeddable widget.
 */
export function Wordmark({ newTab = false }: { newTab?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 text-ink"
      aria-label="Aidline home"
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <svg width="30" height="18" viewBox="0 0 30 18" fill="none" aria-hidden="true">
        <path
          d="M1 16H8V11H15V6H22V1H25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
        <rect x="25" y="0" width="3" height="2" className="fill-relief" />
      </svg>
      <span className="font-serif text-[1.375rem] font-semibold tracking-[-0.01em]">Aidline</span>
    </Link>
  );
}
