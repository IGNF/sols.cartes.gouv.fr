import Control from 'ol/control/Control';

/** CSS hook on the print button widget (MapView.css). */
export const PRINT_CONTROL_CLASS = 'map-print';
/** Id prefix: geopf's panel manager parses every widget id of a column as `<name>-<number>`. */
export const PRINT_CONTROL_ID_PREFIX = 'GPprint';
let nextId = 1;

/**
 * Map button opening the print dialog (v1.1: the toolbar above the map is gone). A plain OpenLayers
 * control dressed like the geopf icon buttons (DSFR tertiary button, DSFR printer icon), placed in the
 * top-left position container after the geopf controls by usePrintControl. The icon is a decorative
 * span: geopf draws the hover/focus tooltip as the button's `::before` (`content: attr(aria-label)`),
 * which replaced a DSFR icon class set on the button itself (empty button on hover); the tooltip is the
 * only one, as on the geopf buttons (no `title`).
 */
export function createPrintControl(label: string, onOpen: () => void): Control {
  const element = document.createElement('div');
  element.id = `${PRINT_CONTROL_ID_PREFIX}-${nextId++}`;
  element.className = `GPwidget gpf-widget gpf-widget-button ${PRINT_CONTROL_CLASS}`;
  const button = document.createElement('button');
  button.type = 'button';
  // Same classes as the geopf buttons: `gpf-btn--tertiary` positions the tooltip on the button.
  button.className = 'gpf-btn gpf-btn--tertiary gpf-btn-icon fr-btn fr-btn--tertiary';
  button.setAttribute('aria-label', label);
  const icon = document.createElement('span');
  icon.className = 'fr-icon-printer-line';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  button.addEventListener('click', onOpen);
  element.append(button);
  return new Control({ element });
}
