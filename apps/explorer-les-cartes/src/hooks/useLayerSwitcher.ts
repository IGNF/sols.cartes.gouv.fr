import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { LAYER_SWITCHER_OPTIONS } from '../config/map';
import { LayerSwitcher } from '../map/geopf';
import { watchLayerMoveArrows } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';

/**
 * Escape closes the open layer list (a `<dialog>` the control does not close on Escape) through its own
 * toggle button, and returns focus to that button.
 */
export function closeOnEscape(root: HTMLElement): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const toggle = root.querySelector<HTMLButtonElement>('button[id^="GPshowLayersListPicto-"]');
    if (toggle?.getAttribute('aria-pressed') !== 'true') return;
    event.stopPropagation();
    toggle.click();
    toggle.focus();
  };
  root.addEventListener('keydown', onKeyDown);
  return () => root.removeEventListener('keydown', onKeyDown);
}

/** Adds the geopf-extensions LayerSwitcher to the map; it follows the map layers by itself. */
export default function useLayerSwitcher(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    const control = new LayerSwitcher({ options: { ...LAYER_SWITCHER_OPTIONS } });
    labelGeopfDialogs(control.element);
    const stopEscape = closeOnEscape(control.element);
    const stopArrows = watchLayerMoveArrows(control.element);
    map.addControl(control);
    return () => {
      stopEscape();
      stopArrows();
      map.removeControl(control);
    };
  }, [map]);
}
