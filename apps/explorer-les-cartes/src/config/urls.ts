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

/** External links. */
export const EXTERNAL_LINKS = {
  gisSol: 'https://www.gissol.fr/',
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

/** Builds an OGC GetCapabilities URL for a GPF endpoint. */
export function buildCapabilitiesUrl(endpoint: string, service: string, version: string): string {
  const url = new URL(endpoint);
  url.searchParams.set('SERVICE', service);
  url.searchParams.set('VERSION', version);
  url.searchParams.set('REQUEST', 'GetCapabilities');
  return url.toString();
}
