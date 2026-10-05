import type { MetadataRoute } from 'next';

import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { safe } from '@/lib/safe';

// Regenerate hourly so new campaigns are picked up without a redeploy.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/campaigns', priority: 0.9 },
  { path: '/how-it-works', priority: 0.7 },
  { path: '/verifiers', priority: 0.6 },
  { path: '/start', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority }) => ({
    url: `${config.siteUrl}${path}`,
    changeFrequency: 'daily',
    priority,
  }));

  // If the API is unreachable, still serve the static pages.
  const campaigns = await safe(() => api.campaigns({ limit: 100 }));
  for (const c of campaigns?.items ?? []) {
    pages.push({
      url: `${config.siteUrl}/campaigns/${c.id}`,
      lastModified: new Date(c.createdAt),
      changeFrequency: c.status === 'active' ? 'daily' : 'monthly',
      priority: c.status === 'active' ? 0.8 : 0.4,
    });
  }
  return pages;
}
