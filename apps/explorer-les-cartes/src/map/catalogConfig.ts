import { catalogueRecordPath } from '../config/urls';
import type { SolsDataset, SolsService } from '../data/solsLayersSchema';
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
 * (they stay in the list view).
 */
export function buildCatalogData(datasets: readonly SolsDataset[]): CatalogData {
  const layers: Record<string, CatalogLayerConfig> = {};
  for (const dataset of datasets) {
    const layer = preferredLayer(dataset);
    const serviceType = layer ? catalogServiceType(layer.service) : null;
    if (!layer || !serviceType) continue;
    layers[catalogLayerKey(layer.name, serviceType)] = {
      name: layer.name,
      title: dataset.title,
      description: dataset.abstract,
      producer: [dataset.organisation],
      ...(dataset.thumbnail ? { thumbnail: dataset.thumbnail } : {}),
      serviceParams: { id: `OGC:${serviceType}` },
      metadata_urls: [catalogueRecordPath(dataset.id)],
    };
  }
  return { layers };
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
  for (const dataset of datasets) {
    const layer = preferredLayer(dataset);
    if (!layer || layer.name !== name) continue;
    if (catalogServiceType(layer.service) !== service.toUpperCase()) continue;
    return toOverlayRef(layer, dataset.title);
  }
  return null;
}
