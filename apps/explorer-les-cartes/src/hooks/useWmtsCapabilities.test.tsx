import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASE_LAYER_CANDIDATES } from '../config/map';
import { findWmtsLayer, WMTS_CAPABILITIES_URL } from '../map/wmtsCapabilities';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper, createRetryingQueryWrapper } from '../test/queryWrapper';
import { GPF_REQUEST_RETRY_DELAY_MS, GPF_REQUEST_TIMEOUT_MS } from '../config/map';
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

  it('expose l’erreur quand la Géoplateforme ne répond pas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    const { result } = renderHook(() => useWmtsCapabilities(), { wrapper: createQueryWrapper() });
    // Retries (GPF_REQUEST_RETRIES) delay the error by a little over 1 s.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.error?.message).toMatch(/HTTP 500/);
  });

  it('réessaie une requête restée sans réponse (D-carto-1) et obtient les capacités', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let calls = 0;
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      calls += 1;
      if (calls === 1) {
        // First request accepted and never answered, like the GPF sometimes does.
        return new Promise<Response>((_resolve, reject) =>
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        );
      }
      return Promise.resolve(new Response(capabilitiesXml, { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWmtsCapabilities(), {
      wrapper: createRetryingQueryWrapper(),
    });
    await vi.advanceTimersByTimeAsync(GPF_REQUEST_TIMEOUT_MS + GPF_REQUEST_RETRY_DELAY_MS + 10);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
