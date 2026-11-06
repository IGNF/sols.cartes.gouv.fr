import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import type { AvailableBaseLayer } from '../map/baseLayerCatalogue';
import { CATALOG_OPTIONS, CONTROL_LABELS } from '../config/map';
import { catalogueSearchByOrganisationPath } from '../config/urls';
import { SOLS_DATASETS } from '../data/solsLayers';
import {
  buildCatalogData,
  datasetLayerKeys,
  findCatalogBaseLayer,
  findCatalogDataset,
  findCatalogOverlay,
  syncCatalogTicks,
} from '../map/catalogConfig';
import { loadCatalog, type CatalogControl } from '../map/geopf';
import { unescapeHtml } from '../text/escapeHtml';
import { controlElement, labelToggleButton } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';
import { watchToolButtons } from '../map/labelToolButtons';
import { useMapStore } from '../store/useMapStore';

/** CSS hook on the catalogue widget (MapView.css: primary button, as on cartes.gouv.fr). */
export const CATALOG_CLASS = 'map-catalog';

/** Payload of the `catalog:layer:add` / `catalog:layer:remove` events. */
export interface CatalogLayerEvent {
  name: string;
  service: string;
}

type CatalogClass = Awaited<ReturnType<typeof loadCatalog>>;

/** OpenLayers types `on` with its own event names: the control's custom events need a looser view. */
interface CustomEventSource {
  on(type: string, listener: (event: unknown) => void): unknown;
}

/** The producer-tag builder, public at runtime but declared private in Catalog.d.ts. */
interface ProducerLinksPrototype {
  createCatalogProducerLinks: (
    producers: string[] | null,
  ) => Array<{ name: string; url: string }> | null;
}

/** Prototypes already patched: the patch is applied once per class, whatever the number of controls. */
const patchedPrototypes = new WeakSet<object>();

/**
 * Points the producer tags to our catalogue rather than to cartes.gouv.fr. The tags are built while the
 * control loads its configuration, in the constructor: the method is replaced on the prototype, once.
 * The names come HTML-escaped from the configuration (they go into the template as is); the URL is
 * built from the raw name.
 */
export function patchProducerLinks(Catalog: CatalogClass): void {
  const prototype = Catalog.prototype as unknown as ProducerLinksPrototype;
  if (patchedPrototypes.has(prototype)) return;
  // Null (not []) without producers: the entry template reads `producers[0].name` when the list is set.
  prototype.createCatalogProducerLinks = (producers) =>
    producers?.length
      ? producers.map((name) => ({
          name,
          url: catalogueSearchByOrganisationPath(unescapeHtml(name)),
        }))
      : null;
  patchedPrototypes.add(prototype);
}

/**
 * Instantiates the geopf Catalog control on the GIS Sol datasets (src/map/catalogConfig.ts). The control
 * does not add layers itself (`addToMap: false`): its events drive the store, which draws the overlays
 * (legend, retry, availability as for every sols layer).
 */
export function createCatalog(
  Catalog: CatalogClass,
  onAdd: (event: CatalogLayerEvent) => void,
  onRemove: (event: CatalogLayerEvent) => void,
  baseLayers: readonly AvailableBaseLayer[] = [],
): CatalogControl {
  patchProducerLinks(Catalog);
  const control = new Catalog({
    ...CATALOG_OPTIONS,
    configuration: { type: 'json', data: buildCatalogData(SOLS_DATASETS, baseLayers) },
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
 * Puts the dataset of a ticked entry on the map (its preferred layer), unless one of its layers is
 * already there: a « Voir sur la carte » link may have added another layer of the same dataset, and the
 * entry then stands for it. A « Fonds de cartes » entry becomes the base layer (the other base entries
 * are unticked by the sync).
 */
export function addCatalogEntry(
  { name, service }: CatalogLayerEvent,
  baseLayers: readonly AvailableBaseLayer[] = [],
): void {
  const baseLayer = findCatalogBaseLayer(baseLayers, name, service);
  if (baseLayer) {
    useMapStore.getState().setActiveBaseLayer(baseLayer.id);
    return;
  }
  const dataset = findCatalogDataset(SOLS_DATASETS, name, service);
  const overlay = findCatalogOverlay(SOLS_DATASETS, name, service);
  if (!dataset || !overlay) return;
  const { overlays, addOverlay } = useMapStore.getState();
  const onMap = new Set(overlays.map((item) => item.key));
  if (datasetLayerKeys(dataset).some((key) => onMap.has(key))) return;
  addOverlay(overlay);
}

/** Removes every layer of the dataset of an unticked entry (whichever one a link had added). */
export function removeCatalogEntry({ name, service }: CatalogLayerEvent): void {
  const dataset = findCatalogDataset(SOLS_DATASETS, name, service);
  if (!dataset) return;
  const { removeOverlay } = useMapStore.getState();
  for (const key of datasetLayerKeys(dataset)) removeOverlay(key);
}

/**
 * Adds the catalogue once the map exists (own chunk, after the map is displayed) as the first widget of
 * the right column, like the cartes.gouv.fr map viewer; removed on cleanup. The entries are ticked per
 * dataset from the store (`auto: false`: the control would only tick its own layer); the « Fonds de
 * cartes » entries (GPF base layers of the capabilities, rebuilt when they arrive) follow the active
 * base layer, which always stays ticked. When the chunk fails, the store reports it (notice pointing
 * to the list view).
 */
export default function useCatalog(
  map: OlMap | null,
  baseLayers: readonly AvailableBaseLayer[] = [],
): void {
  const setCatalogueUnavailable = useMapStore((state) => state.setCatalogueUnavailable);
  useEffect(() => {
    if (!map) return undefined;
    let active = true;
    let control: CatalogControl | null = null;
    let stopWatching: (() => void) | undefined;
    let unsubscribe: (() => void) | undefined;
    loadCatalog()
      .then((Catalog) => {
        if (!active) return;
        let sync = () => 0;
        control = createCatalog(
          Catalog,
          (event) => addCatalogEntry(event, baseLayers),
          (event) => {
            removeCatalogEntry(event);
            sync(); // an unticked base layer stays the base layer: tick it again
          },
          baseLayers,
        );
        map.addControl(control);
        // geopf appends to the position container: put the catalogue first (the switcher came earlier).
        const element = controlElement(control);
        element.parentElement?.prepend(element);
        sync = () => {
          const { overlays, activeBaseLayerId } = useMapStore.getState();
          return syncCatalogTicks(element, overlays, SOLS_DATASETS, baseLayers, activeBaseLayerId);
        };
        // Entries are rendered once the configuration is loaded: name their checkboxes and tick them as
        // they appear, then follow the store (layers removed from the switcher, links, base layer).
        stopWatching = watchToolButtons(element, sync);
        unsubscribe = useMapStore.subscribe((state, previous) => {
          if (
            state.overlays !== previous.overlays ||
            state.activeBaseLayerId !== previous.activeBaseLayerId
          )
            sync();
        });
      })
      .catch(() => {
        // The map stays usable without the catalogue; the list view keeps every dataset.
        if (active) setCatalogueUnavailable(true);
      });
    return () => {
      active = false;
      stopWatching?.();
      unsubscribe?.();
      if (control) map.removeControl(control);
    };
  }, [map, baseLayers, setCatalogueUnavailable]);
}
