import { GEOPF_DIALOG_LABELS } from '../config/map';

/**
 * Gives an accessible name to the unnamed dialogs rendered by a geopf-extensions control.
 * Call it on `control.element` before `map.addControl`, so the DSFR script sees named modals.
 */
export default function labelGeopfDialogs(root: HTMLElement): void {
  root.querySelectorAll('dialog').forEach((dialog) => {
    if (dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby')) return;
    const prefix = dialog.id.split('-')[0] ?? '';
    const label = GEOPF_DIALOG_LABELS[prefix];
    if (label) dialog.setAttribute('aria-label', label);
  });
}
