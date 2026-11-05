import type OlMap from 'ol/Map';
import { toLonLat } from 'ol/proj';
import { SHARE_LABELS } from '../config/map';
import { SECTION_PATHS } from '../config/urls';
import type { SolsService } from '../data/solsLayersSchema';
import type { OverlayRef } from './overlays';
import { buildPermalink, type PermalinkLayerState, type PermalinkState } from './permalink';

/** cartes.gouv.fr service type of a sols service; TMS and WFS overlays are not drawn (never in the store). */
const SERVICE_TYPES: Partial<Record<SolsService, PermalinkLayerState['serviceType']>> = {
  wmts: 'WMTS',
  'wms-raster': 'WMS',
  'wms-vector': 'WMS',
};

/**
 * Current state of the map as a permalink: view (centre, zoom), the base layer first, then the sols overlays
 * in store order with their live opacity and visibility (read on the OpenLayers layers, which hold that
 * state). Layers imported or drawn with the tools are not part of it. Null before the view is ready.
 */
export function mapPermalinkState(
  map: OlMap,
  baseLayerName: string | undefined,
  overlays: readonly OverlayRef[],
): PermalinkState | null {
  const view = map.getView();
  const center = view.getCenter();
  const zoom = view.getZoom();
  if (!center || zoom === undefined) return null;
  const [lon = 0, lat = 0] = toLonLat(center, view.getProjection());
  const olLayers = map.getAllLayers();
  const layers: PermalinkLayerState[] = [];
  if (baseLayerName) {
    const base = olLayers.find((layer) => layer.get('name') === baseLayerName);
    layers.push({
      name: baseLayerName,
      geopType: 'OGC',
      serviceType: 'WMTS',
      opacity: base?.getOpacity() ?? 1,
      visible: base?.getVisible() ?? true,
    });
  }
  for (const overlay of overlays) {
    const serviceType = SERVICE_TYPES[overlay.service];
    if (!serviceType) continue;
    const olLayer = olLayers.find((layer) => layer.get('overlayKey') === overlay.key);
    layers.push({
      name: overlay.name,
      geopType: 'OGC',
      serviceType,
      opacity: olLayer?.getOpacity() ?? overlay.opacity ?? 1,
      visible: olLayer?.getVisible() ?? overlay.visible ?? true,
    });
  }
  return { center: [lon, lat], zoom, layers };
}

/** Permalink URL of the map's current state; `base` is the absolute URL of the map page. */
export function mapPermalink(
  base: string,
  map: OlMap,
  baseLayerName: string | undefined,
  overlays: readonly OverlayRef[],
): string | null {
  const state = mapPermalinkState(map, baseLayerName, overlays);
  return state ? buildPermalink(base, state) : null;
}

/** Absolute URL of the map page, base of every permalink. */
export function mapPageUrl(location: Pick<Location, 'origin'> = window.location): string {
  return `${location.origin}${SECTION_PATHS.carto}`;
}

/** `mailto:` link carrying the permalink in the message body ("Envoyer par courriel"). */
export function mailtoLink(link: string): string {
  const body = `${SHARE_LABELS.mailBody}\n${link}`;
  return `mailto:?subject=${encodeURIComponent(SHARE_LABELS.mailSubject)}&body=${encodeURIComponent(body)}`;
}
