import { BASE_LAYER_CANDIDATES, type BaseLayerId } from '../config/map';
import { findWmtsLayer, type WmtsCapabilities } from './wmtsCapabilities';

export interface AvailableBaseLayer {
  id: BaseLayerId;
  layerName: string;
  /** Title published in the capabilities. */
  title: string;
  /** Thumbnail of the « Fonds de cartes » entry (BASE_LAYER_CANDIDATES), if any. */
  thumbnail?: string;
}

/**
 * Where the « Fonds de cartes » stand: capabilities still loading, failed, published without any
 * candidate, or entries available.
 */
export type BaseLayersStatus = 'loading' | 'error' | 'empty' | 'ready';

export function baseLayersStatus(
  query: { isPending: boolean; isError: boolean },
  layers: readonly AvailableBaseLayer[],
): BaseLayersStatus {
  if (query.isError) return 'error';
  if (query.isPending) return 'loading';
  return layers.length ? 'ready' : 'empty';
}

/** Keeps the candidates published in the capabilities, in candidate order. Silent on missing ones. */
export function availableBaseLayers(
  capabilities: WmtsCapabilities,
  candidates: readonly {
    id: BaseLayerId;
    layerName: string;
    thumbnail?: string;
  }[] = BASE_LAYER_CANDIDATES,
): AvailableBaseLayer[] {
  return candidates.flatMap((candidate) => {
    const info = findWmtsLayer(capabilities, candidate.layerName);
    if (!info) return [];
    const { id, layerName, thumbnail } = candidate;
    return [{ id, layerName, title: info.title, ...(thumbnail ? { thumbnail } : {}) }];
  });
}

/** The selected layer when available, otherwise the first available one. */
export function resolveActiveBaseLayer(
  layers: readonly AvailableBaseLayer[],
  selectedId: BaseLayerId,
): AvailableBaseLayer | undefined {
  return layers.find((layer) => layer.id === selectedId) ?? layers[0];
}
