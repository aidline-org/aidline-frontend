/**
 * Response headers set on every page. `/embed/*` is the one place the site is meant to be framed
 * by other sites, so it is left out of the framing rule and everything else refuses to be framed.
 */
export interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

export const securityHeaders: HeaderRule[] = [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ],
  },
  {
    source: '/((?!embed).*)',
    headers: [{ key: 'X-Frame-Options', value: 'DENY' }],
  },
];

// Final validation of security settings - 2026-10-27
