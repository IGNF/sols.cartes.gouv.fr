/**
 * Pure helpers about sols services, shared by the map and the list view.
 * Must not import OpenLayers or geopf-extensions: the list view loads no map code.
 */
import { DISPLAYABLE_SOLS_SERVICES } from '../config/map';
import { buildCapabilitiesUrl, mapDeepLinkPath } from '../config/urls';
import type { SolsLayer, SolsService } from '../data/solsLayersSchema';

export function isDisplayable(service: SolsService): boolean {
  return (DISPLAYABLE_SOLS_SERVICES as readonly SolsService[]).includes(service);
}

export const SERVICE_LABELS: Record<SolsService, string> = {
  wmts: 'WMTS',
  'wms-raster': 'WMS raster',
  'wms-vector': 'WMS vecteur',
  wfs: 'WFS',
  tms: 'TMS (tuiles vectorielles)',
};

const CAPABILITIES: Record<Exclude<SolsService, 'tms'>, { service: string; version: string }> = {
  wmts: { service: 'WMTS', version: '1.0.0' },
  'wms-raster': { service: 'WMS', version: '1.3.0' },
  'wms-vector': { service: 'WMS', version: '1.3.0' },
  wfs: { service: 'WFS', version: '2.0.0' },
};

/** Direct link to the service of a layer: its GetCapabilities, or the TMS TileMap resource. */
export function serviceEndpointUrl(
  layer: Pick<SolsLayer, 'service' | 'name' | 'endpoint'>,
): string {
  if (layer.service === 'tms') return `${layer.endpoint}/${encodeURIComponent(layer.name)}`;
  const { service, version } = CAPABILITIES[layer.service];
  return buildCapabilitiesUrl(layer.endpoint, service, version);
}

/** Deep link to the carto page for a displayable layer, null otherwise. */
export function mapLinkFor(layer: Pick<SolsLayer, 'service' | 'name' | 'endpoint'>): string | null {
  if (!isDisplayable(layer.service)) return null;
  return mapDeepLinkPath(layer.name, layer.service === 'wmts' ? 'WMTS' : 'WMS', layer.endpoint);
}
