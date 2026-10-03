import Link from 'next/link';

import { Container } from '@/components/ui/Container';
import { config, explorer } from '@/lib/config';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <Container className="grid gap-10 py-12 text-sm md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-serif text-lg text-ink">
            Every donation, traceable to the work it paid for.
          </p>
          <p className="mt-3 text-ink-muted">
            Aidline is open source and runs on Stellar {config.network}. The contracts have not been
            audited yet, so please do not send real funds.
          </p>
        </div>
        <div>
          <p className="kicker mb-3">Platform</p>
          <ul className="space-y-2">
            <li>
              <Link className="link" href="/campaigns">
                Campaigns
              </Link>
            </li>
            <li>
              <Link className="link" href="/verifiers">
                Verifiers
              </Link>
            </li>
            <li>
              <Link className="link" href="/start">
                Start a campaign
              </Link>
            </li>
            <li>
              <Link className="link" href="/how-it-works">
                How it works
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="kicker mb-3">Open source</p>
          <ul className="space-y-2">
            <li>
              <a className="link" href="https://github.com/aidline-org/aidline-contracts">
                Contracts
              </a>
            </li>
            <li>
              <a className="link" href="https://github.com/aidline-org/aidline-backend">
                Backend
              </a>
            </li>
            <li>
              <a className="link" href="https://github.com/aidline-org/aidline-frontend">
                Frontend
              </a>
            </li>
            {config.contractId && (
              <li>
                <a className="link" href={explorer.contract(config.contractId)}>
                  Contract on explorer
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
