import OlMap from 'ol/Map';
import { defaults as defaultControls } from 'ol/control/defaults';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { useEffect, type RefObject } from 'react';
import { DEFAULT_CONTROLS_OPTIONS, INITIAL_VIEW } from '../config/map';
import { useMapStore } from '../store/useMapStore';

/**
 * Creates the single OpenLayers map on the given element and publishes it in the store.
 * The map is disposed on unmount (also covers the StrictMode double mount).
 */
export default function useMap(targetRef: RefObject<HTMLElement | null>): OlMap | null {
  const map = useMapStore((state) => state.map);
  const setMap = useMapStore((state) => state.setMap);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return undefined;
    const instance = new OlMap({
      target,
      controls: defaultControls(DEFAULT_CONTROLS_OPTIONS),
      view: new View({
        center: fromLonLat([...INITIAL_VIEW.centerLonLat]),
        zoom: INITIAL_VIEW.zoom,
        minZoom: INITIAL_VIEW.minZoom,
        maxZoom: INITIAL_VIEW.maxZoom,
      }),
    });
    setMap(instance);
    // Keep the canvas in sync with its container (side panel toggled, window resized).
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => instance.updateSize());
    observer?.observe(target);
    return () => {
      observer?.disconnect();
      instance.setTarget(undefined);
      instance.dispose();
      setMap(null);
    };
  }, [targetRef, setMap]);

  return map;
}
