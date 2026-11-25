import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  api,
  ApiError,
  donorPosition,
  READ_TIMEOUT_MS,
  reuseUpload,
  type DonorHistory,
} from '@/lib/api';
import { config } from '@/lib/config';

function respond(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: async () => {
      if (body === undefined) throw new SyntaxError('no body');
      return body;
    },
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('api requests', () => {
  it('calls the configured API url and returns the parsed body', async () => {
    const fetchMock = respond(200, { campaigns: 3 });
    await expect(api.stats()).resolves.toEqual({ campaigns: 3 });
    expect(fetchMock).toHaveBeenCalledWith(`${config.apiUrl}/stats`, {
      next: { revalidate: 30 },
      signal: expect.any(AbortSignal),
    });
  });

  it('gives up on a read that takes longer than the timeout', async () => {
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
          ),
      ),
    );
    const pending = expect(api.stats()).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(timeout).toHaveBeenCalledWith(READ_TIMEOUT_MS);
    controller.abort(new DOMException('timed out', 'TimeoutError'));
    await pending;
    timeout.mockRestore();
  });

  it('puts no time limit on writes, which can be large uploads', async () => {
    const fetchMock = respond(201, { id: 'p', uri: 'u', files: [] });
    await api.uploadProof(new FormData());
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.signal).toBeUndefined();
  });

  it('builds a query string and drops empty values', async () => {
    const fetchMock = respond(200, { items: [], total: 0 });
    await api.campaigns({ kind: 'climate', status: undefined, q: 'haiti', limit: 12, offset: 0 });
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toBe(`${config.apiUrl}/campaigns?kind=climate&q=haiti&limit=12&offset=0`);
  });

  it('sends no question mark when there are no parameters', async () => {
    const fetchMock = respond(200, { items: [], total: 0 });
    await api.campaigns();
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(`${config.apiUrl}/campaigns`);
  });

  it('paginates donations with limit and offset', async () => {
    const fetchMock = respond(200, { items: [], total: 0 });
    await api.donations('123', 10, 20);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      `${config.apiUrl}/campaigns/123/donations?limit=10&offset=20`,
    );
  });

  it('accepts an object of params for donations', async () => {
    const fetchMock = respond(200, { items: [], total: 0 });
    await api.donations('123', { limit: 10, offset: 30 });
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      `${config.apiUrl}/campaigns/123/donations?limit=10&offset=30`,
    );
  });

  it('encodes path params so slashes and reserved characters cannot escape the route', async () => {
    const fetchMock = respond(200, {});
    await api.campaign('1/..?x=stats');
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      `${config.apiUrl}/campaigns/1%2F..%3Fx%3Dstats`,
    );

    await api.donations('1/../stats');
    expect(String((fetchMock.mock.calls[1] as unknown[])[0])).toBe(
      `${config.apiUrl}/campaigns/1%2F..%2Fstats/donations?limit=20`,
    );

    await api.verifier('G../?');
    expect(String((fetchMock.mock.calls[2] as unknown[])[0])).toBe(
      `${config.apiUrl}/verifiers/G..%2F%3F`,
    );

    await api.donor('G/x?y');
    expect(String((fetchMock.mock.calls[3] as unknown[])[0])).toBe(
      `${config.apiUrl}/donors/G%2Fx%3Fy`,
    );
  });

  it('posts JSON for metadata', async () => {
    const fetchMock = respond(201, { id: 'abc', uri: 'http://x/metadata/abc' });
    await api.createMetadata({ title: 'T', summary: 'S', description: 'D', location: 'L' });
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(JSON.parse(String(init.body))).toMatchObject({ title: 'T', location: 'L' });
  });

  it('sends form data for proofs without forcing a content type', async () => {
    const fetchMock = respond(201, { id: 'p', uri: 'u', files: [] });
    const form = new FormData();
    form.set('note', 'delivered');
    await api.uploadProof(form);
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.body).toBe(form);
    expect(init.headers).toBeUndefined();
  });
});

describe('api errors', () => {
  it('throws ApiError with the server message and field issues', async () => {
    respond(400, {
      message: 'Invalid request',
      issues: [{ path: 'title', message: 'Required' }],
    });
    const err = await api.stats().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 400,
      message: 'Invalid request',
      issues: [{ path: 'title', message: 'Required' }],
    });
  });

  it('names ApiError so logs distinguish it from a plain Error', async () => {
    respond(400, { message: 'Invalid request' });
    const err = (await api.stats().catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe('ApiError');
    // Error.toString() reads `${this.name}: ${this.message}` so logs now show the kind.
    expect(String(err)).toBe('ApiError: Invalid request');
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    respond(502, undefined);
    await expect(api.stats()).rejects.toMatchObject({
      status: 502,
      message: 'status 502',
      issues: [],
    });
  });

  it('lets network failures through unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(api.stats()).rejects.toThrow('fetch failed');
  });
});

describe('reuseUpload', () => {
  it('returns the cached uri when the key and input still match', () => {
    const files = {} as FileList;
    const cached = { key: 'campaign:0:note', input: files, uri: 'ipfs://proof' };
    expect(reuseUpload(cached, 'campaign:0:note', files)).toBe('ipfs://proof');
  });

  it('ignores a cache after the key or input changes', () => {
    const files = {} as FileList;
    const cached = { key: 'campaign:0:note', input: files, uri: 'ipfs://proof' };
    expect(reuseUpload(cached, 'campaign:1:note', files)).toBeNull();
    expect(reuseUpload(cached, 'campaign:0:note', {} as FileList)).toBeNull();
    expect(reuseUpload(null, 'campaign:0:note', files)).toBeNull();
  });
});

describe('donorPosition', () => {
  it('adds only this campaign’s donations and refunds', () => {
    const history = {
      donations: [
        { campaignId: 'a', amount: '100' },
        { campaignId: 'b', amount: '500' },
        { campaignId: 'a', amount: '250' },
      ],
      refunds: [
        { campaignId: 'a', amount: '50' },
        { campaignId: 'b', amount: '10' },
      ],
    } as unknown as DonorHistory;
    expect(donorPosition(history, 'a')).toEqual({ given: 350n, refunded: 50n });
  });
});
