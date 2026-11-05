import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASE_LAYERS } from '../config/map';
import { findWmtsLayer, WMTS_CAPABILITIES_URL } from '../map/wmtsCapabilities';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper } from '../test/queryWrapper';
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
    expect(data && findWmtsLayer(data, BASE_LAYERS[0].layerName)).not.toBeNull();
  });

  it('expose l’erreur quand la Géoplateforme ne répond pas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    const { result } = renderHook(() => useWmtsCapabilities(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/HTTP 500/);
  });
});
