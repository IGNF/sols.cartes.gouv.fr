import type OlMap from 'ol/Map';
import { useEffect, useMemo } from 'react';
import { BASE_LAYERS, type BaseLayerId } from '../config/map';
import createWmtsLayer from '../map/createWmtsLayer';
import type { WmtsCapabilities } from '../map/wmtsCapabilities';

export interface BaseLayerStatus {
  /** True when the capabilities are loaded but do not publish the requested layer. */
  isMissing: boolean;
}

/** Adds the active base layer at the bottom of the map and removes it on change or unmount. */
export default function useBaseLayer(
  map: OlMap | null,
  capabilities: WmtsCapabilities | undefined,
  baseLayerId: BaseLayerId,
): BaseLayerStatus {
  const definition = BASE_LAYERS.find((layer) => layer.id === baseLayerId);
  const layerName = definition?.layerName;

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

  return { isMissing: Boolean(capabilities) && !layer };
}
