import type OlMap from 'ol/Map';
import { create } from 'zustand';
import { DEFAULT_BASE_LAYER_ID, type BaseLayerId, type SidePanelTab } from '../config/map';
import { readDeepLink } from '../map/deepLink';
import type { OverlayRef } from '../map/overlays';

/**
 * Client state of the map page. Server state (GPF capabilities) lives in TanStack Query,
 * OpenLayers state (view, layer visibility...) stays in the OpenLayers objects.
 */
export interface MapState {
  /** The single OpenLayers map instance, created by useMap. */
  map: OlMap | null;
  activeBaseLayerId: BaseLayerId;
  isPanelOpen: boolean;
  activeTab: SidePanelTab;
  /** Layers the user put on the map, in drawing order (last on top). */
  overlays: OverlayRef[];
  /** Keys of overlays whose tiles all fail (the service answers with errors). */
  unavailableOverlays: string[];
  setMap: (map: OlMap | null) => void;
  setActiveBaseLayer: (id: BaseLayerId) => void;
  togglePanel: () => void;
  setActiveTab: (tab: SidePanelTab) => void;
  /** Adds an overlay once (same key ignored). */
  addOverlay: (overlay: OverlayRef) => void;
  removeOverlay: (key: string) => void;
  markOverlayUnavailable: (key: string) => void;
}

export const initialMapState = {
  map: null,
  activeBaseLayerId: DEFAULT_BASE_LAYER_ID,
  isPanelOpen: true,
  activeTab: 'fonds' as SidePanelTab,
  overlays: [] as OverlayRef[],
  unavailableOverlays: [] as string[],
} satisfies Partial<MapState>;

/**
 * A "Voir sur la carte" link opens the "Données sols" tab. It must be selected from the first render:
 * the DSFR tabs script reads the selected tab when it initialises and keeps it otherwise.
 */
export function initialTab(search: string): SidePanelTab {
  return readDeepLink(search) ? 'sols' : 'fonds';
}

export const useMapStore = create<MapState>()((set) => ({
  ...initialMapState,
  activeTab: initialTab(window.location.search),
  setMap: (map) => set({ map }),
  setActiveBaseLayer: (activeBaseLayerId) => set({ activeBaseLayerId }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
  addOverlay: (overlay) =>
    set((state) =>
      state.overlays.some((o) => o.key === overlay.key)
        ? state
        : { overlays: [...state.overlays, overlay] },
    ),
  removeOverlay: (key) =>
    set((state) => ({
      overlays: state.overlays.filter((o) => o.key !== key),
      unavailableOverlays: state.unavailableOverlays.filter((k) => k !== key),
    })),
  markOverlayUnavailable: (key) =>
    set((state) =>
      state.unavailableOverlays.includes(key)
        ? state
        : { unavailableOverlays: [...state.unavailableOverlays, key] },
    ),
}));
