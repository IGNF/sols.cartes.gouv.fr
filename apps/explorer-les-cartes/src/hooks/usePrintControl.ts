import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { PRINT_LABELS } from '../config/map';
import { controlElement } from '../map/labelControls';
import { createPrintControl } from '../map/printControl';

/** Id of the geopf position container that holds the top-left buttons (zoom, full screen, import…). */
const TOP_LEFT_CONTAINER = 'position-container-top-left';

/**
 * Adds the print button to the map, in the top-left column after the geopf controls (the container
 * exists once a geopf control with a position has been added; else the button stays where OpenLayers
 * puts it). Removed on cleanup.
 */
export default function usePrintControl(map: OlMap | null, onOpen: () => void): void {
  useEffect(() => {
    if (!map) return undefined;
    const control = createPrintControl(PRINT_LABELS.button, onOpen);
    map.addControl(control);
    const column = map.getTargetElement()?.querySelector(`#${TOP_LEFT_CONTAINER}`);
    if (column) column.append(controlElement(control));
    return () => {
      map.removeControl(control);
    };
  }, [map, onOpen]);
}
