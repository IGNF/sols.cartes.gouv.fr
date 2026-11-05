import TileLayer from 'ol/layer/Tile';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { findWmtsLayer, type WmtsCapabilities } from './wmtsCapabilities';

/**
 * Builds an OpenLayers WMTS layer from the GPF capabilities.
 * Returns null when the layer name is not published in the capabilities (never guessed).
 * `title` and `description` are read by the geopf-extensions LayerSwitcher.
 */
export default function createWmtsLayer(
  capabilities: WmtsCapabilities,
  layerName: string,
): TileLayer<WMTS> | null {
  const info = findWmtsLayer(capabilities, layerName);
  if (!info) return null;
  const options = optionsFromCapabilities(capabilities, { layer: layerName });
  if (!options) return null;
  return new TileLayer({
    source: new WMTS({ ...options, crossOrigin: 'anonymous' }),
    properties: {
      name: layerName,
      title: info.title,
      description: info.abstract,
    },
  });
}
