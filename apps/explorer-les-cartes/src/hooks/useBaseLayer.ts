import type OlMap from 'ol/Map';
import { useEffect, useMemo } from 'react';
import { BASE_LAYER_Z_INDEX, TILE_RETRY_DELAY_MS } from '../config/map';
import createWmtsLayer from '../map/createWmtsLayer';
import attachTileRetry from '../map/tileRetry';
import type { WmtsCapabilities } from '../map/wmtsCapabilities';

/**
 * Adds the base layer at the bottom of the map and removes it on change or unmount.
 * The LayerSwitcher follows the map layers, so it always lists the active base layer.
 * Failed tiles are retried once while the layer is on the map (doc/agents/QUESTIONS.md M-2).
 */
export default function useBaseLayer(
  map: OlMap | null,
  capabilities: WmtsCapabilities | undefined,
  layerName: string | undefined,
): void {
  const layer = useMemo(
    () => (capabilities && layerName ? createWmtsLayer(capabilities, layerName) : null),
    [capabilities, layerName],
  );

  useEffect(() => {
    if (!map || !layer) return undefined;
    const source = layer.getSource();
    const detachRetry = source
      ? attachTileRetry(source, TILE_RETRY_DELAY_MS, () => map.render())
      : undefined;
    // An explicit zIndex makes the LayerSwitcher sort its list by zIndex instead of putting the
    // new layer on top (and drawing it over the overlays).
    layer.setZIndex(BASE_LAYER_Z_INDEX);
    map.getLayers().insertAt(0, layer);
    return () => {
      map.removeLayer(layer);
      detachRetry?.();
    };
  }, [map, layer]);
}
