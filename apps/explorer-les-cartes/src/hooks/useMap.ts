import OlMap from 'ol/Map';
import Rotate from 'ol/control/Rotate';
import { defaults as defaultControls } from 'ol/control/defaults';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { useEffect, type RefObject } from 'react';
import { CONTROL_LABELS, DEFAULT_CONTROLS_OPTIONS, INITIAL_VIEW } from '../config/map';
import { labelControlButtons } from '../map/labelControls';
import { readPermalinkView } from '../map/permalink';
import { useMapStore } from '../store/useMapStore';

/** Initial centre (lon, lat) and zoom: the permalink's `c` and `z` when present, else the configured view. */
export function initialView(search: string): { centerLonLat: [number, number]; zoom: number } {
  const permalink = readPermalinkView(search);
  return permalink
    ? { centerLonLat: permalink.center, zoom: permalink.zoom }
    : { centerLonLat: [...INITIAL_VIEW.centerLonLat], zoom: INITIAL_VIEW.zoom };
}

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
    const controls = defaultControls(DEFAULT_CONTROLS_OPTIONS);
    controls.forEach((control) => {
      if (control instanceof Rotate) labelControlButtons(control, CONTROL_LABELS.rotate);
    });
    const { centerLonLat, zoom } = initialView(window.location.search);
    const instance = new OlMap({
      target,
      controls,
      view: new View({
        center: fromLonLat(centerLonLat),
        zoom,
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
