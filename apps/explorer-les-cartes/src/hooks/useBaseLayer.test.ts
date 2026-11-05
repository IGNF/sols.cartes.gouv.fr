import { renderHook } from '@testing-library/react';
import type OlMap from 'ol/Map';
import type BaseLayer from 'ol/layer/Base';
import BaseEvent from 'ol/events/Event';
import { describe, expect, it, vi } from 'vitest';
import { TILE_RETRY_DELAY_MS } from '../config/map';
import { parseWmtsCapabilities } from '../map/wmtsCapabilities';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import useBaseLayer from './useBaseLayer';

const capabilities = parseWmtsCapabilities(capabilitiesXml);
const PLAN_IGN = 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2';
const ORTHO = 'ORTHOIMAGERY.ORTHOPHOTOS';

function createFakeMap() {
  const insertAt = vi.fn<(index: number, layer: BaseLayer) => void>();
  const removeLayer = vi.fn<(layer: BaseLayer) => void>();
  const map = { getLayers: () => ({ insertAt }), removeLayer } as unknown as OlMap;
  return { map, insertAt, removeLayer };
}

describe('useBaseLayer', () => {
  it('n’ajoute rien tant que les capacités ne sont pas chargées', () => {
    const { map, insertAt } = createFakeMap();
    renderHook(() => useBaseLayer(map, undefined, PLAN_IGN));
    expect(insertAt).not.toHaveBeenCalled();
  });

  it('ajoute le fond sous les autres couches puis le retire au démontage', () => {
    const { map, insertAt, removeLayer } = createFakeMap();
    const { unmount } = renderHook(() => useBaseLayer(map, capabilities, PLAN_IGN));
    expect(insertAt).toHaveBeenCalledTimes(1);
    const [index, layer] = insertAt.mock.calls[0] ?? [];
    expect(index).toBe(0);
    expect(layer?.get('name')).toBe(PLAN_IGN);
    unmount();
    expect(removeLayer).toHaveBeenCalledWith(layer);
  });

  it('remplace l’ancien fond quand le fond actif change', () => {
    const { map, insertAt, removeLayer } = createFakeMap();
    const { rerender } = renderHook(({ name }) => useBaseLayer(map, capabilities, name), {
      initialProps: { name: PLAN_IGN },
    });
    const first = insertAt.mock.calls[0]?.[1];
    rerender({ name: ORTHO });
    expect(removeLayer).toHaveBeenCalledWith(first);
    expect(insertAt.mock.calls[1]?.[1]?.get('name')).toBe(ORTHO);
  });

  it('n’ajoute rien pour une couche absente des capacités', () => {
    const { map, insertAt } = createFakeMap();
    renderHook(() => useBaseLayer(map, capabilities, 'COUCHE.INEXISTANTE'));
    expect(insertAt).not.toHaveBeenCalled();
  });

  it('réessaie une tuile en erreur tant que le fond est affiché, plus après son retrait', () => {
    vi.useFakeTimers();
    const { map, insertAt } = createFakeMap();
    const { unmount } = renderHook(() => useBaseLayer(map, capabilities, PLAN_IGN));
    const layer = insertAt.mock.calls[0]?.[1] as unknown as {
      getSource: () => { dispatchEvent: (event: BaseEvent) => void };
    };
    const source = layer.getSource();
    const fail = (key: string) => {
      const tile = { load: vi.fn(), getKey: () => key };
      source.dispatchEvent(Object.assign(new BaseEvent('tileloaderror'), { tile }));
      return tile;
    };
    const first = fail('tuile-1');
    vi.advanceTimersByTime(TILE_RETRY_DELAY_MS);
    expect(first.load).toHaveBeenCalledTimes(1);
    unmount();
    const second = fail('tuile-2');
    vi.advanceTimersByTime(TILE_RETRY_DELAY_MS);
    expect(second.load).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
