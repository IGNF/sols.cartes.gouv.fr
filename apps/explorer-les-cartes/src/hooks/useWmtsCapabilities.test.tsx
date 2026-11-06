import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASE_LAYER_CANDIDATES } from '../config/map';
import { findWmtsLayer, WMTS_CAPABILITIES_URL } from '../map/wmtsCapabilities';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper, createRetryingQueryWrapper } from '../test/queryWrapper';
import {
  GPF_REQUEST_ATTEMPTS,
  GPF_REQUEST_DEADLINE_MS,
  GPF_REQUEST_HEDGE_DELAY_MS,
} from '../config/map';
import useWmtsCapabilities from './useWmtsCapabilities';

describe('useWmtsCapabilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('charge les capacités une seule fois pour plusieurs abonnés', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(capabilitiesXml, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => ({ a: useWmtsCapabilities(), b: useWmtsCapabilities() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.a.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(WMTS_CAPABILITIES_URL);
    const data = result.current.b.data;
    expect(data && findWmtsLayer(data, BASE_LAYER_CANDIDATES[0].layerName)).not.toBeNull();
  });

  it('expose l’erreur quand la Géoplateforme répond en erreur', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response('', { status: 500 })));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWmtsCapabilities(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.error?.message).toMatch(/HTTP 500/);
    // Every request of a round, then one more round (GPF_REQUEST_RETRIES).
    expect(fetchMock).toHaveBeenCalledTimes(GPF_REQUEST_ATTEMPTS * 2);
  });

  /** First request accepted and never answered, like the GPF sometimes does; the next ones answered. */
  function gpfFetch() {
    let calls = 0;
    return vi.fn((_url: string, init: RequestInit) => {
      calls += 1;
      if (calls > 1) return Promise.resolve(new Response(capabilitiesXml, { status: 200 }));
      return new Promise<Response>((_resolve, reject) =>
        init.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        ),
      );
    });
  }

  it('obtient les capacités par une seconde requête quand la première reste sans réponse (D-carto-1, D-carto-11)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = gpfFetch();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWmtsCapabilities(), {
      wrapper: createRetryingQueryWrapper(),
    });
    await vi.advanceTimersByTimeAsync(GPF_REQUEST_HEDGE_DELAY_MS);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('garde une première requête lente qui répond après le délai d’avant M15 (3 s)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Every request answers late: only the first one is kept, the others are aborted.
    const late = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
          setTimeout(() => resolve(new Response(capabilitiesXml, { status: 200 })), 3200);
        }),
    );
    vi.stubGlobal('fetch', late);
    const { result } = renderHook(() => useWmtsCapabilities(), {
      wrapper: createRetryingQueryWrapper(),
    });
    await vi.advanceTimersByTimeAsync(3200);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(late.mock.calls.length).toBeLessThanOrEqual(3);
    vi.useRealTimers();
  });

  it('échoue sans nouvelle série de requêtes quand aucune ne répond avant l’échéance', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const hung = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        ),
    );
    vi.stubGlobal('fetch', hung);
    const { result } = renderHook(() => useWmtsCapabilities(), {
      wrapper: createRetryingQueryWrapper(),
    });
    await vi.advanceTimersByTimeAsync(GPF_REQUEST_DEADLINE_MS);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.name).toBe('TimeoutError');
    expect(hung).toHaveBeenCalledTimes(GPF_REQUEST_ATTEMPTS);
    vi.useRealTimers();
  });
});
