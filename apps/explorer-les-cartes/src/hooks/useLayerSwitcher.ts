import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { LAYER_SWITCHER_OPTIONS } from '../config/map';
import { LayerSwitcher } from '../map/geopf';
import labelGeopfDialogs from '../map/labelGeopfDialogs';

/** Adds the geopf-extensions LayerSwitcher to the map; it follows the map layers by itself. */
export default function useLayerSwitcher(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    const control = new LayerSwitcher({ options: { ...LAYER_SWITCHER_OPTIONS } });
    labelGeopfDialogs(control.element);
    map.addControl(control);
    return () => {
      map.removeControl(control);
    };
  }, [map]);
}
