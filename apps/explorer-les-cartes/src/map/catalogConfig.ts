import { catalogueRecordPath } from '../config/urls';
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
 * (they stay in the list view). Texts are HTML-escaped: the control builds its entries with `innerHTML`.
 */
export function buildCatalogData(datasets: readonly SolsDataset[]): CatalogData {
  const layers: Record<string, CatalogLayerConfig> = {};
  for (const dataset of datasets) {
    const layer = preferredLayer(dataset);
    const serviceType = layer ? catalogServiceType(layer.service) : null;
    if (!layer || !serviceType) continue;
    layers[catalogLayerKey(layer.name, serviceType)] = {
      name: layer.name,
      title: escapeHtml(dataset.title),
      description: escapeHtml(dataset.abstract),
      producer: [escapeHtml(dataset.organisation)],
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
): number {
  let changed = 0;
  const onMap = new Set(overlays.map((overlay) => overlay.key));
  root.querySelectorAll<HTMLInputElement>('input[data-layer]').forEach((input) => {
    // `data-layer` is `<name>:<service>` (the control splits on the last colon: names may hold one).
    const value = input.getAttribute('data-layer') ?? '';
    const at = value.lastIndexOf(':');
    const dataset =
      at < 0 ? null : findCatalogDataset(datasets, value.slice(0, at), value.slice(at + 1));
    if (!dataset) return;
    const checked = datasetLayerKeys(dataset).some((key) => onMap.has(key));
    if (input.checked !== checked) {
      input.checked = checked;
      changed += 1;
    }
  });
  return changed;
}
