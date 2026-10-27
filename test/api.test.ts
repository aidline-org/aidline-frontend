import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError } from '@/lib/api';
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
    expect(fetchMock).toHaveBeenCalledWith(`${config.apiUrl}/stats`, { cache: 'no-store' });
  });

  it('builds a query string and drops empty values', async () => {
    const fetchMock = respond(200, { items: [], total: 0 });
    await api.campaigns({ kind: 'climate', status: undefined, limit: 12, offset: 0 });
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toBe(`${config.apiUrl}/campaigns?kind=climate&limit=12&offset=0`);
  });

  it('sends no question mark when there are no parameters', async () => {
    const fetchMock = respond(200, { items: [], total: 0 });
    await api.campaigns();
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(`${config.apiUrl}/campaigns`);
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
