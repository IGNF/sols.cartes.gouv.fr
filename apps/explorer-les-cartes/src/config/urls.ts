/**
 * Single source for every URL used by the carto brick: section paths of the portal
 * (served on the same origin by the other bricks), external links and Géoplateforme endpoints.
 * Nothing else in src/ should hardcode a URL, a path or a layer name.
 */
import brand from '@sols/brand/brand.json';

/** Section paths of the portal (same origin, other bricks): from `@sols/brand`, rendered as plain anchors. */
export const SECTION_PATHS = {
  home: brand.sections.home,
  catalogue: brand.sections.catalogue,
  carto: brand.sections.carto,
} as const;

/** Record page of the catalogue brick for a dataset identifier. */
export function catalogueRecordPath(identifier: string): string {
  return `${SECTION_PATHS.catalogue}dataset/${encodeURIComponent(identifier)}`;
}

/** Search page of the catalogue brick filtered on an organisation (producer tags of the map catalogue). */
export function catalogueSearchByOrganisationPath(organisation: string): string {
  return `${SECTION_PATHS.catalogue}search?organization=${encodeURIComponent(organisation)}`;
}

/**
 * Non-map alternative of the carto page: `?vue=liste`. A query parameter rather than a path, so it works
 * on any static host without SPA fallback, and the page never loads the map bundle.
 */
export const LIST_VIEW = { param: 'vue', value: 'liste' } as const;

export const LIST_VIEW_PATH = `${SECTION_PATHS.carto}?${LIST_VIEW.param}=${LIST_VIEW.value}`;

/** True when the query string asks for the list view. */
export function isListView(search: string): boolean {
  return new URLSearchParams(search).get(LIST_VIEW.param) === LIST_VIEW.value;
}

/** "Voir sur la carte" deep link of the carto brick (same contract as the catalogue, doc/agents/geonetwork-ui.md §10). */
export function mapDeepLinkPath(layer: string, type: 'WMS' | 'WMTS', endpoint: string): string {
  const params = new URLSearchParams({ layer, type, url: endpoint });
  return `${SECTION_PATHS.carto}?${params.toString()}`;
}

/** External links. */
export const EXTERNAL_LINKS = {
  gisSol: brand.external.gissol,
  cartesGouv: brand.external.cartesGouv,
} as const;

/**
 * Géoplateforme (GPF) service endpoints, see doc/agents/gpf-sols-data.md and doc/agents/geopf-ext.md §10.
 * All are open (no API key); checked with curl on 2026-11-05.
 */
export const GPF_ENDPOINTS = {
  wmts: 'https://data.geopf.fr/wmts',
  wmsVector: 'https://data.geopf.fr/wms-v/ows',
  wmsRaster: 'https://data.geopf.fr/wms-r/wms',
  wfs: 'https://data.geopf.fr/wfs/ows',
  tms: 'https://data.geopf.fr/tms/1.0.0',
  csw: 'https://data.geopf.fr/csw/gissol-osf_c',
  /** Elevation of points (MousePosition) and along a path (ElevationPath). */
  elevation: 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json',
  elevationLine: 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json',
  /** Routing and isochrones (Road2); resources listed by /navigation/getcapabilities. */
  route: 'https://data.geopf.fr/navigation/itineraire',
  isochrone: 'https://data.geopf.fr/navigation/isochrone',
  /** Geocoding: autocompletion (search engine, route and isochrone forms) and reverse geocoding. */
  geocodeCompletion: 'https://data.geopf.fr/geocodage/completion',
  geocodeReverse: 'https://data.geopf.fr/geocodage/reverse',
} as const;

/** WMS 1.3.0 GetLegendGraphic of a layer (GeoServer, wms-v: used when the capabilities carry no LegendURL). */
export function legendGraphicUrl(endpoint: string, layer: string): string {
  const url = new URL(endpoint);
  url.searchParams.set('SERVICE', 'WMS');
  url.searchParams.set('VERSION', '1.3.0');
  url.searchParams.set('REQUEST', 'GetLegendGraphic');
  url.searchParams.set('FORMAT', 'image/png');
  url.searchParams.set('LAYER', layer);
  return url.toString();
}

/** MapLibre styles of the GIS Sol TMS layers; a cartes.gouv.fr TMS link carries `<file>` (without .json). */
export function solsStyleUrl(file: string): string {
  return `https://data.geopf.fr/annexes/gissol-osf/style/${encodeURIComponent(file)}.json`;
}

/** Host of every GPF service: deep links to other hosts are refused. */
export const GPF_HOST = 'data.geopf.fr';

/** Hosts whose images the map may show (record thumbnails): the GPF annexes and the GIS Sol site. */
export const TRUSTED_IMAGE_HOSTS: readonly string[] = [
  GPF_HOST,
  new URL(EXTERNAL_LINKS.gisSol).hostname,
];

/** True for an `https:` URL on a trusted image host (anything else is dropped by the generator). */
export function isTrustedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && TRUSTED_IMAGE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * CSW GetRecords request returning the 7 "sols" records (ISO 19115-3), see doc/agents/gpf-sols-data.md §1.
 * Read by scripts/build-sols-layers.ts only.
 */
export const SOLS_CSW_GETRECORDS_URL = `${GPF_ENDPOINTS.csw}?REQUEST=GetRecords&SERVICE=CSW&VERSION=2.0.2&RESULTTYPE=results&elementSetName=full&TYPENAMES=gmd:MD_Metadata&OUTPUTSCHEMA=http://standards.iso.org/iso/19115/-3/mdb/2.0`;

/** Builds an OGC GetCapabilities URL for a GPF endpoint. */
export function buildCapabilitiesUrl(endpoint: string, service: string, version: string): string {
  const url = new URL(endpoint);
  url.searchParams.set('SERVICE', service);
  url.searchParams.set('VERSION', version);
  url.searchParams.set('REQUEST', 'GetCapabilities');
  return url.toString();
}
