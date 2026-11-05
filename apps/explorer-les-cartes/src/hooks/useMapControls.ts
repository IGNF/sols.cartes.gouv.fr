import type Control from 'ol/control/Control';
import ScaleLine from 'ol/control/ScaleLine';
import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { CONTROL_LABELS, MAP_TOOLS_OPTIONS } from '../config/map';
import {
  GeoportalAttribution,
  GeoportalFullScreen,
  GeoportalZoom,
  loadSearchEngine,
} from '../map/geopf';
import { labelControlButtons, labelSearchInput } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';

/** Map tools available immediately: geopf-extensions zoom, full screen, attribution; OL scale line. */
export function createMapControls(): Control[] {
  const attribution = new GeoportalAttribution({ ...MAP_TOOLS_OPTIONS.attribution });
  labelControlButtons(attribution, CONTROL_LABELS.attribution);
  return [
    new GeoportalZoom({ ...MAP_TOOLS_OPTIONS.zoom }),
    new GeoportalFullScreen({ ...MAP_TOOLS_OPTIONS.fullScreen }),
    new ScaleLine({ ...MAP_TOOLS_OPTIONS.scaleLine }),
    attribution,
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
