import { renderHook } from '@testing-library/react';
import type OlMap from 'ol/Map';
import type BaseLayer from 'ol/layer/Base';
import { describe, expect, it, vi } from 'vitest';
import { BASE_LAYERS } from '../config/map';
import { parseWmtsCapabilities } from '../map/wmtsCapabilities';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import useBaseLayer from './useBaseLayer';

const capabilities = parseWmtsCapabilities(capabilitiesXml);

function createFakeMap() {
  const insertAt = vi.fn<(index: number, layer: BaseLayer) => void>();
  const removeLayer = vi.fn<(layer: BaseLayer) => void>();
  const map = { getLayers: () => ({ insertAt }), removeLayer } as unknown as OlMap;
  return { map, insertAt, removeLayer };
}

describe('useBaseLayer', () => {
  it('n’ajoute rien tant que les capacités ne sont pas chargées', () => {
    const { map, insertAt } = createFakeMap();
    const { result } = renderHook(() => useBaseLayer(map, undefined, 'plan-ign'));
    expect(insertAt).not.toHaveBeenCalled();
    expect(result.current.isMissing).toBe(false);
  });

  it('ajoute le fond actif sous les autres couches puis le retire au démontage', () => {
    const { map, insertAt, removeLayer } = createFakeMap();
    const { result, unmount } = renderHook(() => useBaseLayer(map, capabilities, 'plan-ign'));
    expect(insertAt).toHaveBeenCalledTimes(1);
    const [index, layer] = insertAt.mock.calls[0] ?? [];
    expect(index).toBe(0);
    expect(layer?.get('name')).toBe(BASE_LAYERS[0].layerName);
    expect(result.current.isMissing).toBe(false);
    unmount();
    expect(removeLayer).toHaveBeenCalledWith(layer);
  });

  it('signale un fond absent des capacités', () => {
    const { map, insertAt } = createFakeMap();
    const { result } = renderHook(() => useBaseLayer(map, { Contents: { Layer: [] } }, 'plan-ign'));
    expect(insertAt).not.toHaveBeenCalled();
    expect(result.current.isMissing).toBe(true);
  });
});
