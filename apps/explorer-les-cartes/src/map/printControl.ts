import Control from 'ol/control/Control';

/** CSS hook on the print button widget (MapView.css). */
export const PRINT_CONTROL_CLASS = 'map-print';

/**
 * Map button opening the print dialog (v1.1: the toolbar above the map is gone). A plain OpenLayers
 * control dressed like the geopf icon buttons (DSFR tertiary button, DSFR printer icon), placed in the
 * top-left position container after the geopf controls by usePrintControl.
 */
export function createPrintControl(label: string, onOpen: () => void): Control {
  const element = document.createElement('div');
  element.className = `GPwidget gpf-widget gpf-widget-button ${PRINT_CONTROL_CLASS}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gpf-btn gpf-btn-icon fr-btn fr-btn--tertiary fr-icon-printer-line';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.addEventListener('click', onOpen);
  element.append(button);
  return new Control({ element });
}
