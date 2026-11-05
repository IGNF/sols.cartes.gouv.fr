import { GEOPF_DIALOG_LABELS } from '../config/map';

/**
 * Gives an accessible name to the unnamed DSFR modals rendered by a geopf-extensions control
 * (`<dialog>` elements, and `div.fr-modal` such as the search suggestions, which also get role="group"
 * since a generic element cannot carry a name). Call it on `control.element` before `map.addControl`,
 * so the DSFR script sees named modals.
 */
export default function labelGeopfDialogs(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('dialog, .fr-modal').forEach((element) => {
    if (element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')) return;
    // Ids are `<prefix>-<uid>`, or `<prefix>_<n>-<uid>` for the numbered location forms of Route/Isocurve;
    // a few sub-dialogs have a fixed id, looked up as is.
    const prefix = (element.id.split('-')[0] ?? '').replace(/_\d+$/, '');
    const label = GEOPF_DIALOG_LABELS[element.id] ?? GEOPF_DIALOG_LABELS[prefix];
    if (!label) return;
    if (element.tagName !== 'DIALOG' && !element.hasAttribute('role')) {
      element.setAttribute('role', 'group');
    }
    element.setAttribute('aria-label', label);
  });
}
