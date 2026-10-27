import { afterEach, describe, expect, it, vi } from 'vitest';

const rethrow = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ unstable_rethrow: rethrow }));

import { safe } from '@/lib/safe';

afterEach(() => {
  rethrow.mockReset();
  vi.restoreAllMocks();
});

describe('safe', () => {
  it('returns the value when the call succeeds', async () => {
    await expect(safe(async () => 42)).resolves.toBe(42);
  });

  it('returns null and logs when the call fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('api down');
    await expect(safe(async () => Promise.reject(error))).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith(error);
  });

  it('lets Next.js control-flow errors through', async () => {
    const signal = new Error('NEXT_REDIRECT');
    rethrow.mockImplementation(() => {
      throw signal;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(safe(async () => Promise.reject(signal))).rejects.toBe(signal);
  });
});
