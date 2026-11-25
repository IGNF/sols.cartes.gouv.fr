import { useMemo } from 'react';
import {
  availableBaseLayers,
  baseLayersStatus,
  resolveActiveBaseLayer,
  type AvailableBaseLayer,
  type BaseLayersStatus,
} from '../map/baseLayerCatalogue';
import { useMapStore } from '../store/useMapStore';
import useWmtsCapabilities from './useWmtsCapabilities';

export interface BaseLayerCatalogue {
  layers: AvailableBaseLayer[];
  /** Effective base layer: the selected one, or the first available. Derived, not stored. */
  activeLayer: AvailableBaseLayer | undefined;
  isPending: boolean;
  isError: boolean;
  /** Loading, failed, empty or ready: drives the notice of the « Fonds de cartes » tab. */
  status: BaseLayersStatus;
}

/** Base layers published by the GPF among the configured candidates. */
export default function useBaseLayerCatalogue(): BaseLayerCatalogue {
  const capabilities = useWmtsCapabilities();
  const selectedId = useMapStore((state) => state.activeBaseLayerId);
  const layers = useMemo(
    () => (capabilities.data ? availableBaseLayers(capabilities.data) : []),
    [capabilities.data],
  );
  return {
    layers,
    activeLayer: resolveActiveBaseLayer(layers, selectedId),
    isPending: capabilities.isPending,
    isError: capabilities.isError,
    status: baseLayersStatus(capabilities, layers),
  };
}
