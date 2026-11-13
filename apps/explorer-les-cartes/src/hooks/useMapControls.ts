import type Control from 'ol/control/Control';
import ScaleLine from 'ol/control/ScaleLine';
import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { CONTROL_LABELS, MAP_TOOLS_OPTIONS } from '../config/map';
import {
  GeoportalFullScreen,
  GeoportalZoom,
  loadSearchEngine,
  type SearchEngineModule,
} from '../map/geopf';
import { controlElement } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';
import { ensurePositionContainers } from '../map/positionContainers';

/**
 * Map tools available immediately: geopf-extensions full screen then zoom, stacked bottom right (M16, as
 * on cartes.gouv.fr), OL scale line at their left (MapView.css). The zoom appends itself to its container,
 * after the full screen: below it. No attribution control since v1.1 (brief): the sources stay on the
 * layer sources for the print sheet (exportMap.mapSources).
 */
export function createMapControls(): Control[] {
  return [
    new GeoportalFullScreen({ ...MAP_TOOLS_OPTIONS.fullScreen }),
    new GeoportalZoom({ ...MAP_TOOLS_OPTIONS.zoom }),
    new ScaleLine({ ...MAP_TOOLS_OPTIONS.scaleLine }),
  ];
}

/**
 * Search engine as on cartes.gouv.fr and guichet-collaboratif (M19): geocoding bar whose « Avancée » button
 * opens « Me géolocaliser » then the advanced forms (MAP_TOOLS_OPTIONS.search, .coordinateSearch).
 */
export function createSearchEngine({
  SearchEngineAdvanced,
  CoordinateAdvancedSearch,
}: SearchEngineModule): Control {
  const control = new SearchEngineAdvanced({
    ...MAP_TOOLS_OPTIONS.search,
    advancedSearch: [new CoordinateAdvancedSearch({ ...MAP_TOOLS_OPTIONS.coordinateSearch })],
  });
  control.advancedBtn?.setAttribute('aria-label', CONTROL_LABELS.advancedSearch);
  return control;
}

/**
 * Adds the map tools in an effect and removes them on cleanup.
 * The search engine (geocoding, geolocation, advanced forms) is loaded lazily, then added if the map is
 * still mounted.
 */
export default function useMapControls(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    // First controls of the map: the geopf position containers in reading order (Tab order) beforehand.
    ensurePositionContainers(map);
    const controls = createMapControls();
    controls.forEach((control) => map.addControl(control));
    let active = true;
    let search: Control | null = null;
    loadSearchEngine()
      .then((module) => {
        if (!active) return;
        const control = createSearchEngine(module);
        labelGeopfDialogs(controlElement(control));
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
