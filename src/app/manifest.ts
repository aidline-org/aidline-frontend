import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aidline',
    short_name: 'Aidline',
    description: 'Diaspora giving you can trace',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F1E7',
    theme_color: '#1B1A17',
    icons: [
      {
        src: '/brand/aidline-mark.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/aidline-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/aidline-mark.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
