import type Control from 'ol/control/Control';
import { CONTROL_LABELS } from '../config/map';

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

/** Gives the geopf search input an accessible name (it has no label). */
export function labelSearchInput(root: HTMLElement): void {
  root
    .querySelectorAll('input[id^="GPsearchInputText-"]')
    .forEach((input) => input.setAttribute('aria-label', CONTROL_LABELS.searchInput));
}
