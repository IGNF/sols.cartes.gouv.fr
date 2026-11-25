import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { DISPLAYABLE_SOLS_SERVICES, SOLS_ATTRIBUTION } from '../config/map';
import { legendGraphicUrl } from '../config/urls';
import {
  solsLayerKey,
  type SolsDataset,
  type SolsLayer,
  type SolsService,
} from '../data/solsLayersSchema';
import { loadCrs } from './geopf';
import { attachLayerInfo } from './layerInfo';
import { findWmtsLayer, type WmtsCapabilities } from './wmtsCapabilities';
import { attachWmtsFeatureInfo } from './wmtsFeatureInfo';

/** A layer the user put on the map (client state, kept in the store). */
export interface OverlayRef {
  key: string;
  service: SolsService;
  name: string;
  title: string;
  endpoint: string;
  /** Legend image published in the capabilities, when there is one. */
  legendUrl?: string;
  /** Initial opacity (0 to 1) and visibility, e.g. from a cartes.gouv.fr permalink. */
  opacity?: number;
  visible?: boolean;
}

export function toOverlayRef(
  layer: Pick<SolsLayer, 'service' | 'name' | 'endpoint' | 'legendUrl'>,
  title: string,
): OverlayRef {
  return {
    key: solsLayerKey(layer),
    service: layer.service,
    name: layer.name,
    title,
    endpoint: layer.endpoint,
    ...(layer.legendUrl ? { legendUrl: layer.legendUrl } : {}),
  };
}

/**
 * Legend shown by the Legends control: the published `LegendURL`, else a GetLegendGraphic request on the
 * vector WMS (GeoServer answers it; the raster WMS answers 400 without a published legend).
 */
export function overlayLegendUrl(
  overlay: Pick<OverlayRef, 'service' | 'name' | 'endpoint' | 'legendUrl'>,
  wmtsLegendUrl?: string,
): string | undefined {
  if (overlay.legendUrl) return overlay.legendUrl;
  if (overlay.service === 'wmts') return wmtsLegendUrl;
  if (overlay.service === 'wms-vector') return legendGraphicUrl(overlay.endpoint, overlay.name);
  return undefined;
}

/** The layer "Ajouter à la carte" draws for a dataset, by service preference. */
export function preferredLayer(dataset: Pick<SolsDataset, 'layers'>): SolsLayer | null {
  for (const service of DISPLAYABLE_SOLS_SERVICES) {
    const layer = dataset.layers.find((l) => l.service === service);
    if (layer) return layer;
  }
  return null;
}

/** CRS of the first tile matrix set linked to a WMTS layer in the parsed capabilities. */
export function wmtsLayerCrs(capabilities: WmtsCapabilities, name: string): string | null {
  const contents = capabilities['Contents'] as
    | {
        Layer?: Array<{
          Identifier?: string;
          TileMatrixSetLink?: Array<{ TileMatrixSet?: string }>;
        }>;
        TileMatrixSet?: Array<{ Identifier?: string; SupportedCRS?: string }>;
      }
    | undefined;
  const set = contents?.Layer?.find((l) => l.Identifier === name)?.TileMatrixSetLink?.[0]
    ?.TileMatrixSet;
  return contents?.TileMatrixSet?.find((s) => s.Identifier === set)?.SupportedCRS ?? null;
}

const WEB_MERCATOR = ['EPSG:3857', 'EPSG:900913', 'urn:ogc:def:crs:EPSG::3857'];

/**
 * Builds the OpenLayers layer of an overlay. WMS: tiled GetMap on the canonical GPF endpoint.
 * WMTS: from the capabilities; a Lambert-93 matrix set first registers EPSG:2154 (geopf CRS module) so
 * OpenLayers reprojects the tiles. Returns null for services not drawn in v0 or unknown WMTS layers.
 */
export async function createOverlayLayer(
  overlay: OverlayRef,
  capabilities: WmtsCapabilities | undefined,
): Promise<TileLayer<TileWMS | WMTS> | null> {
  const properties = { overlayKey: overlay.key };
  const display = {
    ...(overlay.opacity !== undefined ? { opacity: overlay.opacity } : {}),
    ...(overlay.visible !== undefined ? { visible: overlay.visible } : {}),
  };
  const describe = <T extends TileLayer<TileWMS | WMTS>>(layer: T, wmtsLegendUrl?: string): T => {
    const legendUrl = overlayLegendUrl(overlay, wmtsLegendUrl);
    return attachLayerInfo(layer, {
      name: overlay.name,
      service: overlay.service === 'wmts' ? 'WMTS' : 'WMS',
      title: overlay.title,
      ...(legendUrl ? { legendUrl } : {}),
    });
  };
  if (overlay.service === 'wms-raster' || overlay.service === 'wms-vector') {
    return describe(
      new TileLayer({
        source: new TileWMS({
          url: overlay.endpoint,
          params: {
            LAYERS: overlay.name,
            FORMAT: 'image/png',
            TRANSPARENT: true,
            VERSION: '1.3.0',
          },
          crossOrigin: 'anonymous',
          attributions: SOLS_ATTRIBUTION,
        }),
        properties,
        ...display,
      }),
    );
  }
  if (overlay.service !== 'wmts' || !capabilities) return null;
  const info = findWmtsLayer(capabilities, overlay.name);
  if (!info) return null;
  const crs = wmtsLayerCrs(capabilities, overlay.name);
  if (crs && !WEB_MERCATOR.includes(crs)) await loadCrs(crs);
  const options = optionsFromCapabilities(capabilities, { layer: overlay.name });
  if (!options) return null;
  const source = attachWmtsFeatureInfo(
    new WMTS({ ...options, crossOrigin: 'anonymous', attributions: SOLS_ATTRIBUTION }),
    info.queryable,
  );
  return describe(new TileLayer({ source, properties, ...display }), info.legendUrl);
}
