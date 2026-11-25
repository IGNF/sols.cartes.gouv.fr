import type Control from 'ol/control/Control';

/** The root element of a control (`element` is protected in the OL typings but public at runtime). */
export function controlElement(control: Control): HTMLElement {
  return (control as unknown as { element: HTMLElement }).element;
}

/** Sets the accessible name of every button of a control (OL only sets `title`, the name would be the glyph). */
export function labelControlButtons(control: Control, label: string): void {
  controlElement(control)
    .querySelectorAll('button')
    .forEach((button) => button.setAttribute('aria-label', label));
}

/**
 * Names the toggle button of a geopf widget (its first button, `GPshow…Picto`), e.g. the ControlList's
 * "Afficher plus". The panel's own buttons ("Fermer le panneau") keep their names.
 */
export function labelToggleButton(root: HTMLElement, label: string): void {
  root.querySelector('button')?.setAttribute('aria-label', label);
}

/**
 * Replaces the visible title of a geopf panel header (`.gpf-panel__title`), which some controls hardcode
 * (the ControlList's « Mes outils », D-carto-9). The header is built in the constructor: call it once the
 * control exists.
 */
export function labelPanelTitle(root: HTMLElement, title: string): void {
  const element = root.querySelector('.gpf-panel__title');
  if (element) element.textContent = title;
}

/**
 * The LayerSwitcher renders its keyboard "move layer" arrows as focusable `<span>`s handling Enter/Space,
 * with an `aria-label` that a span without role may not carry (axe aria-prohibited-attr). They act as
 * buttons: give them that role. Returns the number of spans fixed.
 */
export function fixLayerMoveArrows(root: HTMLElement): number {
  const spans = root.querySelectorAll<HTMLElement>(
    '.keyboard-navigation > span[data-direction]:not([role])',
  );
  spans.forEach((span) => span.setAttribute('role', 'button'));
  return spans.length;
}

/** Applies `fixLayerMoveArrows` now and to every layer row the control adds later. */
export function watchLayerMoveArrows(root: HTMLElement): () => void {
  fixLayerMoveArrows(root);
  const observer = new MutationObserver(() => fixLayerMoveArrows(root));
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
