import { BASE_LAYER_CANDIDATES, type BaseLayerId } from '../config/map';
import { findWmtsLayer, type WmtsCapabilities } from './wmtsCapabilities';

export interface AvailableBaseLayer {
  id: BaseLayerId;
  layerName: string;
  /** Title published in the capabilities. */
  title: string;
}

/** Keeps the candidates published in the capabilities, in candidate order. Silent on missing ones. */
export function availableBaseLayers(
  capabilities: WmtsCapabilities,
  candidates: readonly { id: BaseLayerId; layerName: string }[] = BASE_LAYER_CANDIDATES,
): AvailableBaseLayer[] {
  return candidates.flatMap((candidate) => {
    const info = findWmtsLayer(capabilities, candidate.layerName);
    return info ? [{ id: candidate.id, layerName: candidate.layerName, title: info.title }] : [];
  });
}

/** The selected layer when available, otherwise the first available one. */
export function resolveActiveBaseLayer(
  layers: readonly AvailableBaseLayer[],
  selectedId: BaseLayerId,
): AvailableBaseLayer | undefined {
  return layers.find((layer) => layer.id === selectedId) ?? layers[0];
}
