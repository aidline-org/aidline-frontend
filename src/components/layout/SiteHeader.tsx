import Link from 'next/link';

import { Container } from '@/components/ui/Container';
import { WalletButton } from '@/components/wallet/WalletButton';
import { config } from '@/lib/config';

import { Wordmark } from './Wordmark';

const NAV = [
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/verifiers', label: 'Verifiers' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/start', label: 'Start a campaign' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper">
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Wordmark />
          {config.network !== 'mainnet' && (
            <span className="figure border border-rule px-1.5 py-0.5 text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              {config.network}
            </span>
          )}
        </div>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[0.9375rem] md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink-soft hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </Container>
      <nav
        aria-label="Main mobile"
        className="flex gap-6 overflow-x-auto border-t border-rule px-4 py-2.5 text-sm md:hidden"
      >
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 text-ink-soft">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
