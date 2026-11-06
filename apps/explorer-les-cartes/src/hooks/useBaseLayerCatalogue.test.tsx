import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialMapState, useMapStore } from '../store/useMapStore';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper } from '../test/queryWrapper';
import useBaseLayerCatalogue from './useBaseLayerCatalogue';

describe('useBaseLayerCatalogue', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(capabilitiesXml)));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('liste les fonds publiés et suit le fond choisi dans le store', async () => {
    const { result } = renderHook(() => useBaseLayerCatalogue(), {
      wrapper: createQueryWrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.layers).toHaveLength(3));
    expect(result.current.status).toBe('ready');
    expect(result.current.activeLayer?.id).toBe('plan-ign');
    act(() => useMapStore.getState().setActiveBaseLayer('orthophotos'));
    expect(result.current.activeLayer?.layerName).toBe('ORTHOIMAGERY.ORTHOPHOTOS');
  });
});
