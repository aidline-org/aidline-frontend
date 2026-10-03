import type { Metadata } from 'next';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { WalletProvider } from '@/components/wallet/WalletProvider';

import { newsreader, plexMono, plexSans } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Aidline: relief and climate funding you can trace',
    template: '%s · Aidline',
  },
  description:
    'Donations held in escrow and released milestone by milestone, only after an independent verifier confirms the work. Built on Stellar.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <WalletProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </WalletProvider>
      </body>
    </html>
  );
}
