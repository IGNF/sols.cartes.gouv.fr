import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout, TimeoutError } from './fetchWithTimeout';

/** A fetch that never answers, like the GPF sometimes does, but honours abort. */
const hangingFetch = () =>
  vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) =>
        init.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        ),
      ),
  );

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('rend la réponse quand elle arrive à temps', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    const response = await fetchWithTimeout('https://data.geopf.fr/wmts', { timeoutMs: 5000 });
    expect(await response.text()).toBe('ok');
  });

  it('échoue avec TimeoutError quand le serveur ne répond pas', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', hangingFetch());
    const pending = fetchWithTimeout('https://data.geopf.fr/wmts', { timeoutMs: 5000 });
    const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(4999);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it('transmet l’annulation de l’appelant sans la confondre avec un délai dépassé', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const caller = new AbortController();
    const pending = fetchWithTimeout('https://data.geopf.fr/wmts', {
      signal: caller.signal,
      timeoutMs: 5000,
    });
    caller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('respecte un signal déjà annulé', async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal('fetch', fetchMock);
    const caller = new AbortController();
    caller.abort();
    await expect(
      fetchWithTimeout('https://data.geopf.fr/wmts', { signal: caller.signal, timeoutMs: 5000 }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
