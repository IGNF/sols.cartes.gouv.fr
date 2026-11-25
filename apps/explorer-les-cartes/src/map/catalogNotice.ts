import { CATALOG_CATEGORY_IDS, MAP_NOTICES } from '../config/map';
import type { BaseLayersStatus } from './baseLayerCatalogue';

/** Class of the notice container (CSS and e2e hook), first child of the « Fonds de cartes » panel. */
export const BASE_LAYERS_NOTICE_CLASS = 'map-catalog__notice';

/** Tab panel of the « Fonds de cartes » category (`tabpanel-<n>-panel_<id>`, CatalogDOM). */
const PANEL = `[role="tabpanel"][id$="-panel_${CATALOG_CATEGORY_IDS.baseLayers}"]`;

const SEVERITY: Record<Exclude<BaseLayersStatus, 'ready'>, 'info' | 'error' | 'warning'> = {
  loading: 'info',
  error: 'error',
  empty: 'warning',
};

const TEXT: Record<Exclude<BaseLayersStatus, 'ready'>, string> = {
  loading: MAP_NOTICES.baseLayersLoading,
  error: MAP_NOTICES.baseLayersError,
  empty: MAP_NOTICES.baseLayersEmpty,
};

/** Small DSFR alert (geopf renders the widget outside React: plain DSFR markup). */
function createAlert(
  status: Exclude<BaseLayersStatus, 'ready'>,
  onReload: () => void,
): HTMLElement {
  const alert = document.createElement('div');
  alert.className = `fr-alert fr-alert--${SEVERITY[status]} fr-alert--sm`;
  const text = document.createElement('p');
  text.textContent = TEXT[status];
  alert.append(text);
  if (status === 'error') {
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.className =
      'fr-btn fr-btn--sm fr-btn--secondary fr-btn--icon-left fr-icon-refresh-line fr-mt-1w';
    reload.textContent = MAP_NOTICES.baseLayersReload;
    reload.addEventListener('click', onReload);
    alert.append(reload);
  }
  return alert;
}

/**
 * Keeps the « Fonds de cartes » tab of the catalogue widget (`root`) from staying blank while its entries
 * are missing: a loading notice while the WMTS capabilities load, an error with a reload button when they
 * failed, a warning when no candidate is published; nothing once the entries are there (`ready`, the
 * widget is rebuilt with them). The container is a polite live region kept across states (its content
 * changes). Idempotent, so it can run on every mutation of the widget: geopf builds the panel after a
 * delay. Returns true when the DOM was changed.
 */
export function showBaseLayersNotice(
  root: HTMLElement,
  status: BaseLayersStatus,
  onReload: () => void,
): boolean {
  const panel = root.querySelector<HTMLElement>(PANEL);
  if (!panel) return false;
  const current = Array.from(panel.children).find((child) =>
    child.classList.contains(BASE_LAYERS_NOTICE_CLASS),
  ) as HTMLElement | undefined;
  if (status === 'ready') {
    current?.remove();
    return Boolean(current);
  }
  if (current?.dataset['status'] === status) return false;
  const notice = current ?? document.createElement('div');
  if (!current) {
    notice.className = `${BASE_LAYERS_NOTICE_CLASS} fr-m-2w`;
    notice.setAttribute('role', 'status');
    panel.prepend(notice);
  }
  notice.dataset['status'] = status;
  notice.replaceChildren(createAlert(status, onReload));
  return true;
}
