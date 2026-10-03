import localFont from 'next/font/local';

// Fonts are self hosted so builds never depend on a network call to Google.
// All three families are licensed under the SIL Open Font License 1.1.

export const newsreader = localFont({
  variable: '--font-newsreader',
  display: 'swap',
  src: [
    { path: './fonts/newsreader-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/newsreader-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: './fonts/newsreader-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  fallback: ['Georgia', 'serif'],
});

export const plexSans = localFont({
  variable: '--font-plex-sans',
  display: 'swap',
  src: [
    { path: './fonts/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  fallback: ['system-ui', 'sans-serif'],
});

export const plexMono = localFont({
  variable: '--font-plex-mono',
  display: 'swap',
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  fallback: ['ui-monospace', 'monospace'],
});
