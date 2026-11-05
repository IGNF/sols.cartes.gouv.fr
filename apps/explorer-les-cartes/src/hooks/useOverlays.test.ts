import { act, renderHook, waitFor } from '@testing-library/react';
import type OlMap from 'ol/Map';
import BaseEvent from 'ol/events/Event';
import Observable from 'ol/Observable';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OverlayRef } from '../map/overlays';
import { initialMapState, useMapStore } from '../store/useMapStore';
import useOverlays from './useOverlays';

const created = vi.hoisted(() => [] as Array<{ key: string; source: Observable }>);
vi.mock('../map/overlays', () => ({
  createOverlayLayer: (overlay: OverlayRef) => {
    const source = new Observable();
    const layer = { getSource: () => source, key: overlay.key };
    created.push({ key: overlay.key, source });
    return Promise.resolve(layer);
  },
}));
vi.mock('./useWmtsCapabilities', () => ({ default: () => ({ data: undefined }) }));

const ref = (key: string): OverlayRef => ({
  key,
  service: 'wms-vector',
  name: key,
  title: key,
  endpoint: 'https://data.geopf.fr/wms-v/ows',
});

function fakeMap() {
  const addLayer = vi.fn();
  const removeLayer = vi.fn();
  const map = { addLayer, removeLayer } as unknown as OlMap;
  return { map, addLayer, removeLayer };
}

describe('useOverlays', () => {
  beforeEach(() => {
    created.length = 0;
    useMapStore.setState(initialMapState);
  });

  it('ajoute à la carte les couches du store et retire celles qui en sortent', async () => {
    const { map, addLayer, removeLayer } = fakeMap();
    useMapStore.setState({ map });
    renderHook(() => useOverlays(map));
    act(() => useMapStore.getState().addOverlay(ref('a')));
    await waitFor(() => expect(addLayer).toHaveBeenCalledTimes(1));
    act(() => useMapStore.getState().removeOverlay('a'));
    await waitFor(() => expect(removeLayer).toHaveBeenCalledTimes(1));
    expect(removeLayer.mock.calls[0]?.[0]).toBe(addLayer.mock.calls[0]?.[0]);
  });

  it('n’ajoute pas une couche retirée avant la fin de sa création', async () => {
    const { map, addLayer } = fakeMap();
    useMapStore.setState({ map });
    renderHook(() => useOverlays(map));
    act(() => {
      useMapStore.getState().addOverlay(ref('b'));
      useMapStore.getState().removeOverlay('b');
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(addLayer).not.toHaveBeenCalled();
  });

  it('marque indisponible une couche dont aucune tuile ne se charge', async () => {
    const { map, addLayer } = fakeMap();
    useMapStore.setState({ map });
    renderHook(() => useOverlays(map));
    act(() => useMapStore.getState().addOverlay(ref('c')));
    await waitFor(() => expect(addLayer).toHaveBeenCalled());
    const source = created.find((c) => c.key === 'c')?.source;
    act(() => {
      for (let i = 0; i < 3; i++) {
        const tile = { getKey: () => `tuile-${i}`, load: vi.fn() };
        source?.dispatchEvent(Object.assign(new BaseEvent('tileloaderror'), { tile }));
      }
    });
    expect(useMapStore.getState().unavailableOverlays).toEqual(['c']);
  });

  it('retire ses couches quand la carte est démontée', async () => {
    const { map, addLayer, removeLayer } = fakeMap();
    useMapStore.setState({ map });
    const { unmount } = renderHook(() => useOverlays(map));
    act(() => useMapStore.getState().addOverlay(ref('d')));
    await waitFor(() => expect(addLayer).toHaveBeenCalled());
    unmount();
    expect(removeLayer).toHaveBeenCalledTimes(1);
  });
});
