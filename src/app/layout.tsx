import type { Metadata } from 'next';
import Script from 'next/script';

import { I18nProvider } from '@/components/i18n/I18nProvider';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { config } from '@/lib/config';
import { FiatProvider } from '@/lib/fiat';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

import { newsreader, plexMono, plexSans } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  // Resolves relative canonical, Open Graph and image URLs against the site origin.
  metadataBase: new URL(config.siteUrl),
  title: {
    default: 'Aidline: diaspora giving you can trace',
    template: '%s · Aidline',
  },
  description:
    'Diaspora communities fund relief and climate work back home. Donations are held in escrow and released milestone by milestone, only after an independent verifier confirms the work. Built on Stellar.',
  manifest: '/manifest.webmanifest',
  icons: {
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <I18nProvider>
          <FiatProvider>
            <WalletProvider>
              <ServiceWorkerRegister />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2"
              >
                Skip to main content
              </a>
              <SiteHeader />
              <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <SiteFooter />
            </WalletProvider>
          </FiatProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
