import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import { CATALOG_OPTIONS, CONTROL_LABELS } from '../config/map';
import { catalogueSearchByOrganisationPath } from '../config/urls';
import { SOLS_DATASETS } from '../data/solsLayers';
import { buildCatalogData, findCatalogOverlay } from '../map/catalogConfig';
import { loadCatalog, type CatalogControl } from '../map/geopf';
import { controlElement, labelToggleButton } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';
import { watchToolButtons } from '../map/labelToolButtons';
import { useMapStore } from '../store/useMapStore';

/** CSS hook on the catalogue widget (MapView.css: primary button, as on cartes.gouv.fr). */
export const CATALOG_CLASS = 'map-catalog';

/** Payload of the `catalog:layer:add` / `catalog:layer:remove` events. */
interface CatalogLayerEvent {
  name: string;
  service: string;
}

type CatalogClass = Awaited<ReturnType<typeof loadCatalog>>;

/** OpenLayers types `on` with its own event names: the control's custom events need a looser view. */
interface CustomEventSource {
  on(type: string, listener: (event: unknown) => void): unknown;
}

/**
 * Instantiates the geopf Catalog control on the GIS Sol datasets (src/map/catalogConfig.ts). The control
 * does not add layers itself (`addToMap: false`): its events drive the store, which draws the overlays
 * (legend, retry, availability as for every sols layer). Producer tags link to our catalogue rather than
 * to cartes.gouv.fr (the control's `createCatalogProducerLinks` is replaced on the instance).
 */
export function createCatalog(
  Catalog: CatalogClass,
  onAdd: (event: CatalogLayerEvent) => void,
  onRemove: (event: CatalogLayerEvent) => void,
): CatalogControl {
  const control = new Catalog({
    ...CATALOG_OPTIONS,
    configuration: { type: 'json', data: buildCatalogData(SOLS_DATASETS) },
  });
  Object.assign(control, {
    createCatalogProducerLinks: (producers: string[] | null) =>
      producers?.map((name) => ({ name, url: catalogueSearchByOrganisationPath(name) })) ?? null,
  });
  const element = controlElement(control);
  labelGeopfDialogs(element);
  labelToggleButton(element, CONTROL_LABELS.catalog);
  element.classList.add(CATALOG_CLASS);
  const payload = (event: unknown): CatalogLayerEvent => {
    const { name, service } = event as Partial<CatalogLayerEvent>;
    return { name: String(name ?? ''), service: String(service ?? '') };
  };
  const source = control as unknown as CustomEventSource;
  source.on('catalog:layer:add', (event) => onAdd(payload(event)));
  source.on('catalog:layer:remove', (event) => onRemove(payload(event)));
  return control;
}

/**
 * Adds the catalogue once the map exists (own chunk, after the map is displayed) as the first widget of
 * the right column, like the cartes.gouv.fr map viewer; removed on cleanup.
 */
export default function useCatalog(map: OlMap | null): void {
  const addOverlay = useMapStore((state) => state.addOverlay);
  const removeOverlay = useMapStore((state) => state.removeOverlay);
  useEffect(() => {
    if (!map) return undefined;
    let active = true;
    let control: CatalogControl | null = null;
    let stopWatching: (() => void) | undefined;
    loadCatalog()
      .then((Catalog) => {
        if (!active) return;
        control = createCatalog(
          Catalog,
          ({ name, service }) => {
            const overlay = findCatalogOverlay(SOLS_DATASETS, name, service);
            if (overlay) addOverlay(overlay);
          },
          ({ name, service }) => {
            const overlay = findCatalogOverlay(SOLS_DATASETS, name, service);
            if (overlay) removeOverlay(overlay.key);
          },
        );
        map.addControl(control);
        // geopf appends to the position container: put the catalogue first (the switcher came earlier).
        const element = controlElement(control);
        element.parentElement?.prepend(element);
        // Entries are rendered once the configuration is loaded: name their checkboxes as they appear.
        stopWatching = watchToolButtons(element);
      })
      .catch(() => {
        // The map stays usable without the catalogue; the list view keeps every dataset.
      });
    return () => {
      active = false;
      stopWatching?.();
      if (control) map.removeControl(control);
    };
  }, [map, addOverlay, removeOverlay]);
}
