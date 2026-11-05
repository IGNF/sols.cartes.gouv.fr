import type OlMap from 'ol/Map';
import { useEffect, useMemo } from 'react';
import createWmtsLayer from '../map/createWmtsLayer';
import type { WmtsCapabilities } from '../map/wmtsCapabilities';

/**
 * Adds the base layer at the bottom of the map and removes it on change or unmount.
 * The LayerSwitcher follows the map layers, so it always lists the active base layer.
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
    map.getLayers().insertAt(0, layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, layer]);
}
