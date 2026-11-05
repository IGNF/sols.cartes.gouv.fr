import type OlMap from 'ol/Map';
import { create } from 'zustand';
import { DEFAULT_BASE_LAYER_ID, type BaseLayerId } from '../config/map';

/**
 * Client state of the map page. Server state (GPF capabilities) lives in TanStack Query,
 * OpenLayers state (view, layer visibility...) stays in the OpenLayers objects.
 */
export interface MapState {
  /** The single OpenLayers map instance, created by useMap. */
  map: OlMap | null;
  activeBaseLayerId: BaseLayerId;
  isPanelOpen: boolean;
  setMap: (map: OlMap | null) => void;
  setActiveBaseLayer: (id: BaseLayerId) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
}

export const initialMapState = {
  map: null,
  activeBaseLayerId: DEFAULT_BASE_LAYER_ID,
  isPanelOpen: false,
} satisfies Partial<MapState>;

export const useMapStore = create<MapState>()((set) => ({
  ...initialMapState,
  setMap: (map) => set({ map }),
  setActiveBaseLayer: (activeBaseLayerId) => set({ activeBaseLayerId }),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}));
