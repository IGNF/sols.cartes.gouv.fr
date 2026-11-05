import type Control from 'ol/control/Control';
import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import {
  CONTROL_LABELS,
  EXCLUDED_TERRITORY_IDS,
  MAP_TOOLS_OPTIONS,
  TOOL_PROJECTIONS,
} from '../config/map';
import { loadCrs, loadMapTools, type MapToolsModule } from '../map/geopf';
import { controlElement, labelToggleButton } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';
import { labelDialogsOnInit, watchToolButtons } from '../map/labelToolButtons';

/** CSS hooks on the tool widgets (layout rules in MapView.css). */
export const TOOL_CLASS = 'map-tool';
export const LISTABLE_TOOL_CLASS = 'map-tool--listable';

/**
 * Instantiates the tool set of the cartes.gouv.fr map viewer (doc/agents/geopf-ext.md §10), in the order
 * the position containers show them: top-left after the zoom (import, feature info); top-right after the
 * layer switcher ("Mes outils" list, then the listable tools); bottom-left (legends, territories, overview
 * map; geopf prepends bottom widgets, so the last one added is on top). Dialogs and the list button are
 * named before the controls reach the map.
 */
export function createMapTools(tools: MapToolsModule): Control[] {
  const options = MAP_TOOLS_OPTIONS;
  const controlList = new tools.ControlList({ ...options.controlList });
  labelToggleButton(controlElement(controlList), CONTROL_LABELS.controlList);
  const territories = tools.TERRITORIES.filter(
    (territory) => !EXCLUDED_TERRITORY_IDS.includes(territory.id),
  );
  const controls: Control[] = [
    new tools.LayerImport({ ...options.layerImport }),
    new tools.GetFeatureInfo({ ...options.getFeatureInfo }),
    controlList,
    new tools.MeasureLength({ ...options.measureLength }),
    new tools.MeasureArea({ ...options.measureArea }),
    new tools.MeasureAzimuth({ ...options.measureAzimuth }),
    new tools.MousePosition({ ...options.mousePosition }),
    new tools.ElevationPath({ ...options.elevationPath }),
    new tools.Route({ ...options.route }),
    new tools.Isocurve({ ...options.isocurve }),
    new tools.ReverseGeocode({ ...options.reverseGeocode }),
    new tools.Drawing({ ...options.drawing }),
    new tools.GeoportalOverviewMap({ ...options.overviewMap }),
    new tools.Territories({ ...options.territories, territories }),
    new tools.Legends({ ...options.legends }),
  ];
  for (const control of controls) {
    const element = controlElement(control);
    labelGeopfDialogs(element);
    labelDialogsOnInit(control, labelGeopfDialogs);
    element.classList.add(TOOL_CLASS);
    if ((control as { listable?: boolean }).listable) element.classList.add(LISTABLE_TOOL_CLASS);
  }
  return controls;
}

/**
 * Adds the tool set once the map exists: the controls are loaded in their own chunk (after the map is
 * displayed) together with the projections they resolve at construction (Lambert 93 for MousePosition),
 * added if the map is still mounted, and removed on cleanup.
 */
export default function useMapTools(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    let active = true;
    let controls: Control[] = [];
    let stopWatching: (() => void) | undefined;
    Promise.all([loadMapTools(), ...TOOL_PROJECTIONS.map((name) => loadCrs(name))])
      .then(([tools]) => {
        if (!active) return;
        controls = createMapTools(tools);
        controls.forEach((control) => map.addControl(control));
        // Legend entries follow the map layers; territory entries appear when their view opens.
        const overlays = map.getOverlayContainerStopEvent();
        if (overlays) stopWatching = watchToolButtons(overlays);
      })
      .catch(() => {
        // The map stays usable without the tool set; nothing to report beyond the missing buttons.
      });
    return () => {
      active = false;
      stopWatching?.();
      controls.forEach((control) => map.removeControl(control));
    };
  }, [map]);
}
