import type Layer from 'ol/layer/Layer';
import type OlMap from 'ol/Map';
import type TileSource from 'ol/source/Tile';
import { useEffect, useRef } from 'react';
import { OVERLAY_UNAVAILABLE_AFTER_ERRORS, TILE_RETRY_DELAY_MS } from '../config/map';
import { createOverlayLayer } from '../map/overlays';
import watchTileHealth from '../map/tileHealth';
import attachTileRetry from '../map/tileRetry';
import { useMapStore } from '../store/useMapStore';
import useWmtsCapabilities from './useWmtsCapabilities';

interface Mounted {
  layer: Layer;
  detach: () => void;
}

/**
 * Keeps the map overlays in sync with the store: creates the OpenLayers layer of each added overlay
 * (on top of the map, so the LayerSwitcher lists it with its title) and removes the others.
 */
export default function useOverlays(map: OlMap | null): void {
  const overlays = useMapStore((state) => state.overlays);
  const { data: capabilities, isError: capabilitiesFailed } = useWmtsCapabilities();
  const mounted = useRef(new Map<string, Mounted>());
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (!map) return;
    const wanted = new Set(overlays.map((o) => o.key));
    for (const [key, { layer, detach }] of mounted.current) {
      if (wanted.has(key)) continue;
      map.removeLayer(layer);
      detach();
      mounted.current.delete(key);
    }
    const { markOverlayUnavailable } = useMapStore.getState();
    for (const overlay of overlays) {
      if (mounted.current.has(overlay.key) || pending.current.has(overlay.key)) continue;
      if (overlay.service === 'wmts' && !capabilities) {
        // WMTS layers are built from the capabilities: wait for them, or report the failure.
        if (capabilitiesFailed) markOverlayUnavailable(overlay.key);
        continue;
      }
      pending.current.add(overlay.key);
      void createOverlayLayer(overlay, capabilities)
        .then((layer) => {
          const stillWanted = useMapStore.getState().overlays.some((o) => o.key === overlay.key);
          if (!stillWanted || useMapStore.getState().map !== map) return;
          if (!layer) {
            markOverlayUnavailable(overlay.key);
            return;
          }
          const source = layer.getSource() as TileSource | null;
          const detachers = source
            ? [
                attachTileRetry(source, TILE_RETRY_DELAY_MS),
                watchTileHealth(source, OVERLAY_UNAVAILABLE_AFTER_ERRORS, () =>
                  useMapStore.getState().markOverlayUnavailable(overlay.key),
                ),
              ]
            : [];
          const detach = () => detachers.forEach((stop) => stop());
          map.addLayer(layer);
          mounted.current.set(overlay.key, { layer, detach });
        })
        .finally(() => pending.current.delete(overlay.key));
    }
  }, [map, overlays, capabilities, capabilitiesFailed]);

  useEffect(() => {
    const current = mounted.current;
    return () => {
      for (const { layer, detach } of current.values()) {
        map?.removeLayer(layer);
        detach();
      }
      current.clear();
    };
  }, [map]);
}
