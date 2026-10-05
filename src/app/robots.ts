import type { MetadataRoute } from 'next';

import { config } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Personal giving history pages are public but not useful in search results.
      disallow: '/donors/',
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
