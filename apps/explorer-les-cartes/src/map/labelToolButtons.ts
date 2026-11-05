import { TOOL_BUTTON_LABELS } from '../config/map';

/**
 * Names the icon-only buttons the Legends and Territories controls render without any accessible name
 * (geopf-extensions 1.0.0-beta.16, upstream gap): the "show legend" toggle of each legend entry and the
 * "remove territory" button of each entry of the territory views. Also gives the « Mes outils » list menu
 * semantics: its `<li>` carry `role="button"` (not allowed on a list item, and the `<ul>` then has no
 * list item: axe `list` and `aria-allowed-role`), so the `<ul>` becomes a `menu` of `menuitem`s (Enter and
 * Space are handled by the control). Returns the number of elements fixed.
 */
export function fixToolButtons(root: HTMLElement): number {
  let fixed = 0;
  root
    .querySelectorAll<HTMLElement>('[id^="GPcontrolListPanel-"] ul:not([role="menu"])')
    .forEach((list) => {
      list.setAttribute('role', 'menu');
      fixed += 1;
    });
  root
    .querySelectorAll<HTMLElement>('[id^="GPcontrolListPanel-"] li[role="button"]')
    .forEach((item) => {
      item.setAttribute('role', 'menuitem');
      fixed += 1;
    });
  root
    .querySelectorAll<HTMLButtonElement>('button[id^="GPcollapseLegend_ID_"]:not([aria-label])')
    .forEach((button) => {
      const title = button.parentElement?.querySelector('label')?.textContent?.trim() ?? '';
      button.setAttribute(
        'aria-label',
        `${TOOL_BUTTON_LABELS.showLegend}${title ? ` : ${title}` : ''}`,
      );
      fixed += 1;
    });
  root
    .querySelectorAll<HTMLButtonElement>(
      'button[id^="gpf-territories-view-entry-button-id-"]:not([aria-label])',
    )
    .forEach((button) => {
      const title = button.parentElement?.querySelector('label')?.textContent?.trim() ?? '';
      button.setAttribute(
        'aria-label',
        `${TOOL_BUTTON_LABELS.removeTerritory}${title ? ` : ${title}` : ''}`,
      );
      fixed += 1;
    });
  return fixed;
}

/** Applies `fixToolButtons` now and to every entry the controls add later (legends follow the map layers). */
export function watchToolButtons(root: HTMLElement): () => void {
  fixToolButtons(root);
  const observer = new MutationObserver(() => fixToolButtons(root));
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Route and Isocurve build their panels in `setMap` (`_initContainer(map)`), after the control exists and
 * right before OpenLayers attaches the element: the DSFR script would see unnamed modals. The private
 * method is wrapped on the instance so the dialogs are named as soon as they are created.
 */
export function labelDialogsOnInit(control: object, label: (root: HTMLElement) => void): void {
  const target = control as { _initContainer?: (...args: unknown[]) => HTMLElement };
  const original = target._initContainer;
  if (typeof original !== 'function') return;
  target._initContainer = function initContainer(this: unknown, ...args: unknown[]) {
    const container = original.apply(this, args);
    label(container);
    return container;
  };
}
