import { CATALOG_KINDS, type BaseLayerId, type CatalogKind } from '../config/map';
import { catalogueRecordPath } from '../config/urls';
import type { AvailableBaseLayer } from './baseLayerCatalogue';
import { solsLayerKey, type SolsDataset, type SolsService } from '../data/solsLayersSchema';
import { escapeHtml } from '../text/escapeHtml';
import { preferredLayer, toOverlayRef, type OverlayRef } from './overlays';

/**
 * Service type of a catalogue entry, as the geopf Catalog control keys its entries
 * (`<name>$GEOPORTAIL:OGC:<WMS|WMTS>`, `serviceParams.id`); the services not drawn in v1 have none.
 */
export function catalogServiceType(service: SolsService): 'WMS' | 'WMTS' | null {
  switch (service) {
    case 'wmts':
      return 'WMTS';
    case 'wms-raster':
    case 'wms-vector':
      return 'WMS';
    default:
      return null;
  }
}

/** One layer of the configuration object the Catalog control reads (`configuration.data.layers[key]`). */
export interface CatalogLayerConfig {
  /** Category of the entry (CATALOG_CATEGORIES filter on this field, CATALOG_KIND_FIELD). */
  kind: CatalogKind;
  /** Raw title, abstract and producer: what the control's search matches (the display fields are escaped). */
  search: string[];
  name: string;
  title: string;
  description: string;
  producer: string[];
  thumbnail?: string;
  serviceParams: { id: `OGC:${'WMS' | 'WMTS'}` };
  /** Links the control shows as « Voir la fiche détaillée » when one contains `rechercher-une-donnee/dataset`. */
  metadata_urls: string[];
}

export interface CatalogData {
  layers: Record<string, CatalogLayerConfig>;
}

/** Key of a layer in the configuration, in the cartes.gouv.fr form `name$GEOPORTAIL:OGC:WMS`. */
export function catalogLayerKey(name: string, serviceType: 'WMS' | 'WMTS'): string {
  return `${name}$GEOPORTAIL:OGC:${serviceType}`;
}

/**
 * Builds the Catalog configuration from the GIS Sol datasets: one entry per dataset, for its preferred
 * displayable layer (same choice as the deep links), with the record's title, abstract, producer,
 * thumbnail and the link to its page in our catalogue. Datasets without a drawable layer are left out
 * (they stay in the list view). Display texts are HTML-escaped (the control builds its entries with
 * `innerHTML`); the search reads the raw texts from `search` (CATALOG_OPTIONS.search.criteria).
 */
export function buildCatalogData(
  datasets: readonly SolsDataset[],
  baseLayers: readonly AvailableBaseLayer[] = [],
): CatalogData {
  const layers: Record<string, CatalogLayerConfig> = {};
  // « Fonds de cartes » tab: the GPF base layers published in the capabilities (one shown at a time).
  for (const layer of baseLayers) {
    layers[catalogLayerKey(layer.layerName, 'WMTS')] = {
      kind: CATALOG_KINDS.baseLayer,
      name: layer.layerName,
      title: escapeHtml(layer.title),
      description: '',
      producer: [],
      search: [layer.title],
      serviceParams: { id: 'OGC:WMTS' },
      metadata_urls: [],
    };
  }
  for (const dataset of datasets) {
    const layer = preferredLayer(dataset);
    const serviceType = layer ? catalogServiceType(layer.service) : null;
    if (!layer || !serviceType) continue;
    layers[catalogLayerKey(layer.name, serviceType)] = {
      kind: CATALOG_KINDS.sols,
      name: layer.name,
      title: escapeHtml(dataset.title),
      description: escapeHtml(dataset.abstract),
      producer: [escapeHtml(dataset.organisation)],
      search: [dataset.title, dataset.abstract, dataset.organisation],
      ...(dataset.thumbnail ? { thumbnail: dataset.thumbnail } : {}),
      serviceParams: { id: `OGC:${serviceType}` },
      metadata_urls: [catalogueRecordPath(dataset.id)],
    };
  }
  return { layers };
}

/** The dataset whose catalogue entry (preferred layer) a Catalog event (`name`, `service`) designates. */
export function findCatalogDataset(
  datasets: readonly SolsDataset[],
  name: string,
  service: string,
): SolsDataset | null {
  for (const dataset of datasets) {
    const layer = preferredLayer(dataset);
    if (!layer || layer.name !== name) continue;
    if (catalogServiceType(layer.service) !== service.toUpperCase()) continue;
    return dataset;
  }
  return null;
}

/**
 * The overlay a Catalog event (`name`, `service`) designates: the preferred layer of the dataset that
 * publishes it under that service type. Null for an unknown entry.
 */
export function findCatalogOverlay(
  datasets: readonly SolsDataset[],
  name: string,
  service: string,
): OverlayRef | null {
  const dataset = findCatalogDataset(datasets, name, service);
  const layer = dataset ? preferredLayer(dataset) : null;
  return dataset && layer ? toOverlayRef(layer, dataset.title) : null;
}

/** The base layer a Catalog event (`name`, `service`) designates, if it is one of the « Fonds de cartes ». */
export function findCatalogBaseLayer(
  baseLayers: readonly AvailableBaseLayer[],
  name: string,
  service: string,
): AvailableBaseLayer | null {
  if (service.toUpperCase() !== 'WMTS') return null;
  return baseLayers.find((layer) => layer.layerName === name) ?? null;
}

/** Keys of every layer of a dataset (store keys of its overlays). */
export function datasetLayerKeys(dataset: SolsDataset): string[] {
  return dataset.layers.map(solsLayerKey);
}

/**
 * Ticks the catalogue entries of the datasets with any layer on the map (a deep link may have added a
 * layer other than the preferred one) and unticks the others. The control only knows the entry's own
 * layer, hence this sync on the store. Returns the number of entries changed.
 */
export function syncCatalogTicks(
  root: HTMLElement,
  overlays: readonly Pick<OverlayRef, 'key'>[],
  datasets: readonly SolsDataset[],
  baseLayers: readonly AvailableBaseLayer[] = [],
  activeBaseLayerId?: BaseLayerId,
): number {
  let changed = 0;
  const onMap = new Set(overlays.map((overlay) => overlay.key));
  root.querySelectorAll<HTMLInputElement>('input[data-layer]').forEach((input) => {
    // `data-layer` is `<name>:<service>` (the control splits on the last colon: names may hold one).
    const value = input.getAttribute('data-layer') ?? '';
    const at = value.lastIndexOf(':');
    if (at < 0) return;
    const [name, service] = [value.slice(0, at), value.slice(at + 1)];
    const dataset = findCatalogDataset(datasets, name, service);
    const baseLayer = dataset ? null : findCatalogBaseLayer(baseLayers, name, service);
    if (!dataset && !baseLayer) return;
    const checked = dataset
      ? datasetLayerKeys(dataset).some((key) => onMap.has(key))
      : baseLayer?.id === activeBaseLayerId;
    if (input.checked !== checked) {
      input.checked = checked;
      changed += 1;
    }
  });
  return changed;
}
