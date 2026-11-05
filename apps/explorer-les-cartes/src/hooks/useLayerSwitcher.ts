import LayerSwitcher from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';
import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { LAYER_SWITCHER_DIALOG_LABELS, LAYER_SWITCHER_OPTIONS } from '../config/map';

/** Gives an accessible name to the unnamed dialogs rendered by the control (before DSFR sees them). */
export function labelSwitcherDialogs(root: HTMLElement): void {
  root.querySelectorAll('dialog').forEach((dialog) => {
    if (dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby')) return;
    const prefix = dialog.id.split('-')[0] ?? '';
    const label = LAYER_SWITCHER_DIALOG_LABELS[prefix];
    if (label) dialog.setAttribute('aria-label', label);
  });
}

/** Adds the geopf-extensions LayerSwitcher to the map; it follows the map layers by itself. */
export default function useLayerSwitcher(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    const control = new LayerSwitcher({ options: { ...LAYER_SWITCHER_OPTIONS } });
    labelSwitcherDialogs(control.element);
    map.addControl(control);
    return () => {
      map.removeControl(control);
    };
  }, [map]);
}
