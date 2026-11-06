/**
 * View state of the geopf Catalog widget, carried over when the control is rebuilt while its panel is
 * open (the « Fonds de cartes » entries arrive with the WMTS capabilities, after the control: D-carto-8,
 * doc/agents/geopf-ext.md §12.4). geopf-extensions 1.0.0-beta.16 cannot add entries to a built control
 * (`addLayerConfig` calls a missing `createCatalogLinks` and sorts an object), so the control is rebuilt
 * and shown as the user left it: open panel, selected tab, search text, scroll position and focus.
 */

/** Element ids of the widget are `<prefix>-<uid>` (uid of the control) or fixed: the uid is swapped. */
const UID_TOKEN = '{uid}';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
/** Global search of the widget (`CatalogDOM._createCatalogContentSearchGlobalElement`). */
const SEARCH_INPUT_ID = 'catalog-input-search-global';
const SEARCH_BUTTON_ID = 'catalog-button-search-global';
/** geopf filters on input from three characters (its `input` listener); below, the list is not filtered. */
const SEARCH_MIN_LENGTH = 3;
/** Scrolling part of the open panel (MapView.css). */
const PANEL_BODY = '.gpf-panel__body';
const SELECTED_TAB = '.fr-tabs__tab[aria-selected="true"]';

/** The focused element, found again in the rebuilt widget through the closest ancestor with an id. */
interface FocusKey {
  /** Id of the element or of its closest ancestor with one, the widget uid replaced by UID_TOKEN. */
  id: string;
  /** Rank of the element among the focusable descendants of that ancestor; -1 for the ancestor itself. */
  index: number;
}

export interface CatalogView {
  open: boolean;
  /** Id of the selected category tab (`tabbutton-<n>_<category>`, the same in every build). */
  tabId: string | null;
  search: string;
  scrollTop: number;
  /** Null when the focus was not in the widget. */
  focus: FocusKey | null;
}

function widgetUid(root: HTMLElement): string | null {
  return /-(\d+)$/.exec(root.id)?.[1] ?? null;
}

/** Element of the widget with this id (ids are not escaped for a selector: compared as strings). */
function byId(root: HTMLElement, id: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('[id]')).find((e) => e.id === id) ?? null;
}

function toggleButton(root: HTMLElement): HTMLButtonElement | null {
  return root.querySelector('button');
}

function focusKey(root: HTMLElement, active: Element | null): FocusKey | null {
  if (!(active instanceof HTMLElement) || active === root || !root.contains(active)) return null;
  const anchor = active.closest<HTMLElement>('[id]');
  if (!anchor || anchor === root || !root.contains(anchor)) {
    return active === toggleButton(root) ? { id: '', index: -1 } : null;
  }
  const uid = widgetUid(root);
  const id = uid ? anchor.id.split(uid).join(UID_TOKEN) : anchor.id;
  const index =
    anchor === active ? -1 : Array.from(anchor.querySelectorAll(FOCUSABLE)).indexOf(active);
  return { id, index };
}

function findFocusTarget(root: HTMLElement, key: FocusKey): HTMLElement | null {
  if (!key.id) return toggleButton(root);
  const uid = widgetUid(root);
  const anchor = byId(root, uid ? key.id.split(UID_TOKEN).join(uid) : key.id);
  if (!anchor || key.index < 0) return anchor;
  return anchor.querySelectorAll<HTMLElement>(FOCUSABLE)[key.index] ?? null;
}

/** Reads what a rebuilt widget must show again. */
export function readCatalogView(
  root: HTMLElement,
  active: Element | null = document.activeElement,
): CatalogView {
  const search = byId(root, SEARCH_INPUT_ID);
  return {
    open: toggleButton(root)?.getAttribute('aria-pressed') === 'true',
    tabId: root.querySelector(SELECTED_TAB)?.id || null,
    search: search instanceof HTMLInputElement ? search.value : '',
    scrollTop: root.querySelector(PANEL_BODY)?.scrollTop ?? 0,
    focus: focusKey(root, active),
  };
}

/** Filters the entries on `text` as the widget does (its search button applies the filter at once). */
function applySearch(root: HTMLElement, text: string): void {
  const input = byId(root, SEARCH_INPUT_ID);
  if (!text || !(input instanceof HTMLInputElement)) return;
  input.value = text;
  if (text.length >= SEARCH_MIN_LENGTH) byId(root, SEARCH_BUTTON_ID)?.click();
}

/**
 * Shows a rebuilt widget (`root`, its panel already open or not as the control was built) as `view`. The
 * tab is selected at once (the tab buttons exist as soon as the control is built); the search, the scroll
 * position and the focus wait for the entries, which geopf inserts after a `setTimeout`: `rendered(root)`
 * tells when they are all there. The focus is only given back while it is lost (on the body), never taken
 * from where the user has put it since. Returns a function to stop waiting.
 */
export function restoreCatalogView(
  root: HTMLElement,
  view: CatalogView,
  rendered: (root: HTMLElement) => boolean,
): () => void {
  if (view.tabId) {
    const tab = byId(root, view.tabId);
    if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
  }
  const focus = (element: HTMLElement | null) => {
    const active = document.activeElement;
    if (element && (!active || active === document.body)) element.focus();
  };
  const early = view.focus ? findFocusTarget(root, view.focus) : null;
  focus(early);
  const finish = () => {
    applySearch(root, view.search);
    const body = root.querySelector(PANEL_BODY);
    if (body && view.scrollTop) body.scrollTop = view.scrollTop;
    if (view.focus && !early) focus(findFocusTarget(root, view.focus) ?? toggleButton(root));
  };
  if (rendered(root)) {
    finish();
    return () => undefined;
  }
  const observer = new MutationObserver(() => {
    if (!rendered(root)) return;
    observer.disconnect();
    finish();
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
