/**
 * Shape of src/data/sols-layers.json, written by scripts/build-sols-layers.ts and read by the app.
 * Shared by both sides so that the committed file and the generator cannot drift apart.
 */

export const SOLS_LAYERS_SCHEMA_VERSION = 1;

/** A GPF service; WMS is split in its vector (GeoServer) and raster flavours. */
export type SolsService = 'wmts' | 'wms-raster' | 'wms-vector' | 'wfs' | 'tms';

export const SOLS_SERVICES: readonly SolsService[] = [
  'wmts',
  'wms-raster',
  'wms-vector',
  'tms',
  'wfs',
];

export interface SolsLayer {
  service: SolsService;
  /** Layer (WMS, WMTS, TMS) or feature type (WFS) name, as published in the capabilities. */
  name: string;
  /** Title published in the capabilities (falls back to the name). */
  title: string;
  /** Canonical GPF endpoint of the service. */
  endpoint: string;
  /** WMTS only: CRS of the tile matrix sets the layer is published in. */
  crs?: string[];
}

export interface SolsRejectedLayer {
  protocol: string;
  name: string;
  /** Link URL as written in the CSW record. */
  linkage: string;
  reason: string;
}

export interface SolsDataset {
  id: string;
  title: string;
  abstract: string;
  organisation: string;
  layers: SolsLayer[];
  rejected: SolsRejectedLayer[];
}

export interface SolsLayersFile {
  schemaVersion: typeof SOLS_LAYERS_SCHEMA_VERSION;
  /** CSW request the file was generated from. */
  source: string;
  datasets: SolsDataset[];
}

/** Stable key of a layer across the app (store, deep links). */
export function solsLayerKey(layer: Pick<SolsLayer, 'service' | 'name'>): string {
  return `${layer.service}:${layer.name}`;
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isSolsLayer(value: unknown): value is SolsLayer {
  if (!isRecord(value)) return false;
  const { service, name, title, endpoint, crs } = value;
  return (
    SOLS_SERVICES.includes(service as SolsService) &&
    isString(name) &&
    isString(title) &&
    isString(endpoint) &&
    (crs === undefined || (Array.isArray(crs) && crs.every(isString)))
  );
}

function isRejected(value: unknown): value is SolsRejectedLayer {
  return (
    isRecord(value) &&
    isString(value['protocol']) &&
    isString(value['name']) &&
    isString(value['linkage']) &&
    isString(value['reason'])
  );
}

function isDataset(value: unknown): value is SolsDataset {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['title']) &&
    isString(value['abstract']) &&
    isString(value['organisation']) &&
    Array.isArray(value['layers']) &&
    value['layers'].every(isSolsLayer) &&
    Array.isArray(value['rejected']) &&
    value['rejected'].every(isRejected)
  );
}

/** Runtime guard for the generated file. */
export function isSolsLayersFile(value: unknown): value is SolsLayersFile {
  return (
    isRecord(value) &&
    value['schemaVersion'] === SOLS_LAYERS_SCHEMA_VERSION &&
    isString(value['source']) &&
    Array.isArray(value['datasets']) &&
    value['datasets'].every(isDataset)
  );
}

const byText = (a: string, b: string) => a.localeCompare(b, 'fr');

/** Deterministic order: datasets by title, layers by service then name, rejections by protocol then name. */
export function normaliseSolsLayersFile(file: SolsLayersFile): SolsLayersFile {
  return {
    ...file,
    datasets: [...file.datasets]
      .sort((a, b) => byText(a.title, b.title) || byText(a.id, b.id))
      .map((dataset) => ({
        ...dataset,
        layers: [...dataset.layers].sort(
          (a, b) =>
            SOLS_SERVICES.indexOf(a.service) - SOLS_SERVICES.indexOf(b.service) ||
            byText(a.name, b.name),
        ),
        rejected: [...dataset.rejected].sort(
          (a, b) => byText(a.protocol, b.protocol) || byText(a.name, b.name),
        ),
      })),
  };
}
