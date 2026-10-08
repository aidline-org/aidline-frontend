import { Networks } from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';

describe('config', () => {
  it('uses the official network passphrases', async () => {
    for (const [network, passphrase] of [
      ['testnet', Networks.TESTNET],
      ['mainnet', Networks.PUBLIC],
      ['futurenet', Networks.FUTURENET],
    ] as const) {
      vi.resetModules();
      vi.stubEnv('NEXT_PUBLIC_STELLAR_NETWORK', network);
      const { config } = await import('@/lib/config');
      expect(config.networkPassphrase).toBe(passphrase);
    }
    vi.unstubAllEnvs();
  });
});
