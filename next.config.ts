import type { NextConfig } from 'next';

import { securityHeaders } from './security-headers';

const nextConfig: NextConfig = {
  async headers() {
    return securityHeaders;
  },
};

export default nextConfig;
