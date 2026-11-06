import type Control from 'ol/control/Control';
import ScaleLine from 'ol/control/ScaleLine';
import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { MAP_TOOLS_OPTIONS } from '../config/map';
import { GeoportalFullScreen, GeoportalZoom, loadSearchEngine } from '../map/geopf';
import { labelSearchInput } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';

/**
 * Map tools available immediately: geopf-extensions zoom (top left) and full screen (bottom right, v1.1),
 * OL scale line (bottom right too, MapView.css). No attribution control since v1.1 (brief): the sources
 * stay on the layer sources for the print sheet (exportMap.mapSources).
 */
export function createMapControls(): Control[] {
  return [
    new GeoportalZoom({ ...MAP_TOOLS_OPTIONS.zoom }),
    new GeoportalFullScreen({ ...MAP_TOOLS_OPTIONS.fullScreen }),
    new ScaleLine({ ...MAP_TOOLS_OPTIONS.scaleLine }),
  ];
}

/**
 * Adds the map tools in an effect and removes them on cleanup.
 * The search engine (geocoding + geolocation) is loaded lazily, then added if the map is still mounted.
 */
export default function useMapControls(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    const controls = createMapControls();
    controls.forEach((control) => map.addControl(control));
    let active = true;
    let search: Control | null = null;
    loadSearchEngine()
      .then((SearchEngine) => {
        if (!active) return;
        const control = new SearchEngine({ ...MAP_TOOLS_OPTIONS.search });
        labelGeopfDialogs(control.element);
        labelSearchInput(control.element);
        map.addControl(control);
        search = control;
      })
      .catch(() => {
        // The map stays usable without search; nothing to report to the user beyond the missing tool.
      });
    return () => {
      active = false;
      controls.forEach((control) => map.removeControl(control));
      if (search) map.removeControl(search);
    };
  }, [map]);
}
