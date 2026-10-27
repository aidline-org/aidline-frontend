import { describe, expect, it } from 'vitest';

import { securityHeaders } from '../security-headers';

const rule = (source: string) => securityHeaders.find((r) => r.source === source);
const names = (source: string) => rule(source)?.headers.map((h) => h.key) ?? [];

describe('securityHeaders', () => {
  it('applies the baseline headers to every route', () => {
    expect(names('/:path*')).toEqual(
      expect.arrayContaining([
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
      ]),
    );
  });

  it('refuses framing everywhere except the embed routes', () => {
    const framing = rule('/((?!embed).*)');
    expect(framing?.headers).toEqual([{ key: 'X-Frame-Options', value: 'DENY' }]);

    const matches = (path: string) => new RegExp(`^${framing!.source}$`).test(path);
    expect(matches('/campaigns/1')).toBe(true);
    expect(matches('/embed/campaigns/1')).toBe(false);
  });

  it('never sets X-Frame-Options in the all-routes rule, which would break embeds', () => {
    expect(names('/:path*')).not.toContain('X-Frame-Options');
  });

  it('turns off camera, microphone and location', () => {
    const value = rule('/:path*')?.headers.find((h) => h.key === 'Permissions-Policy')?.value;
    expect(value).toContain('camera=()');
    expect(value).toContain('microphone=()');
    expect(value).toContain('geolocation=()');
  });
});
