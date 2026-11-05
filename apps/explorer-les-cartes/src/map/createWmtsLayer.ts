import TileLayer from 'ol/layer/Tile';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { GPF_ATTRIBUTION } from '../config/map';
import { attachLayerInfo } from './layerInfo';
import { findWmtsLayer, type WmtsCapabilities } from './wmtsCapabilities';
import { attachWmtsFeatureInfo } from './wmtsFeatureInfo';

/**
 * Builds an OpenLayers WMTS layer from the GPF capabilities.
 * Returns null when the layer name is not published in the capabilities (never guessed).
 * `title`, `description` and the legend are exposed to the geopf-extensions LayerSwitcher and Legends
 * controls (attachLayerInfo); the source answers the GetFeatureInfo control (empty unless queryable).
 */
export default function createWmtsLayer(
  capabilities: WmtsCapabilities,
  layerName: string,
): TileLayer<WMTS> | null {
  const info = findWmtsLayer(capabilities, layerName);
  if (!info) return null;
  const options = optionsFromCapabilities(capabilities, { layer: layerName });
  if (!options) return null;
  const source = attachWmtsFeatureInfo(
    new WMTS({ ...options, crossOrigin: 'anonymous', attributions: GPF_ATTRIBUTION }),
    info.queryable,
  );
  return attachLayerInfo(new TileLayer({ source }), {
    name: layerName,
    title: info.title,
    description: info.abstract,
    ...(info.legendUrl ? { legendUrl: info.legendUrl } : {}),
  });
}
