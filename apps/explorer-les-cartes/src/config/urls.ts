/**
 * Single source for every URL used by the carto brick: section paths of the portal
 * (served on the same origin by the other bricks), external links and Géoplateforme endpoints.
 * Nothing else in src/ should hardcode a URL, a path or a layer name.
 */

/** Section paths of the portal. Absolute on the same origin, rendered as plain anchors. */
export const SECTION_PATHS = {
  home: '/',
  catalogue: '/rechercher-une-donnee/',
  carto: '/explorer-les-cartes/',
  accessibility: '/accessibilite/',
  legalNotice: '/mentions-legales/',
  personalData: '/donnees-personnelles/',
  siteMap: '/plan-du-site/',
} as const;

/** Record page of the catalogue brick for a dataset identifier. */
export function catalogueRecordPath(identifier: string): string {
  return `${SECTION_PATHS.catalogue}dataset/${encodeURIComponent(identifier)}`;
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
  gisSol: 'https://www.gissol.fr/',
  cartesGouv: 'https://cartes.gouv.fr/',
  licenceEtalab: 'https://github.com/etalab/licence-ouverte/blob/master/LO.md',
} as const;

/**
 * Footer content links, same list and order as the edito brick (apps/accueil/src/_data/site.js).
 * react-dsfr renders each entry as `https://<domain>` with the domain as label.
 */
export const FOOTER_DOMAINS = [
  'cartes.gouv.fr',
  'gissol.fr',
  'info.gouv.fr',
  'service-public.gouv.fr',
  'legifrance.gouv.fr',
  'data.gouv.fr',
];

/** Géoplateforme (GPF) service endpoints, see doc/agents/gpf-sols-data.md. */
export const GPF_ENDPOINTS = {
  wmts: 'https://data.geopf.fr/wmts',
  wmsVector: 'https://data.geopf.fr/wms-v/ows',
  wmsRaster: 'https://data.geopf.fr/wms-r/wms',
  wfs: 'https://data.geopf.fr/wfs/ows',
  tms: 'https://data.geopf.fr/tms/1.0.0',
  csw: 'https://data.geopf.fr/csw/gissol-osf_c',
} as const;

/** MapLibre styles of the GIS Sol TMS layers; a cartes.gouv.fr TMS link carries `<file>` (without .json). */
export function solsStyleUrl(file: string): string {
  return `https://data.geopf.fr/annexes/gissol-osf/style/${encodeURIComponent(file)}.json`;
}

/** Host of every GPF service: deep links to other hosts are refused. */
export const GPF_HOST = 'data.geopf.fr';

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
