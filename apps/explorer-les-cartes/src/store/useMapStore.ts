import type OlMap from 'ol/Map';
import { create } from 'zustand';
import { DEFAULT_BASE_LAYER_ID, type BaseLayerId } from '../config/map';
import { readPermalinkBaseLayer } from '../map/deepLink';
import type { OverlayRef } from '../map/overlays';

/**
 * Client state of the map page. Server state (GPF capabilities) lives in TanStack Query,
 * OpenLayers state (view, layer visibility...) stays in the OpenLayers objects.
 */
export interface MapState {
  /** The single OpenLayers map instance, created by useMap. */
  map: OlMap | null;
  activeBaseLayerId: BaseLayerId;
  /** Layers the user put on the map, in drawing order (last on top). */
  overlays: OverlayRef[];
  /** Keys of overlays whose tiles all fail (the service answers with errors). */
  unavailableOverlays: string[];
  /** The catalogue widget could not be loaded (its chunk failed): the list view is the fallback. */
  catalogueUnavailable: boolean;
  setMap: (map: OlMap | null) => void;
  setActiveBaseLayer: (id: BaseLayerId) => void;
  /** Adds an overlay once (same key ignored). */
  addOverlay: (overlay: OverlayRef) => void;
  removeOverlay: (key: string) => void;
  markOverlayUnavailable: (key: string) => void;
  setCatalogueUnavailable: (unavailable: boolean) => void;
}

export const initialMapState = {
  map: null,
  activeBaseLayerId: DEFAULT_BASE_LAYER_ID,
  overlays: [] as OverlayRef[],
  unavailableOverlays: [] as string[],
  catalogueUnavailable: false,
} satisfies Partial<MapState>;

/** Base layer named by a permalink (`l`), else the default one. */
export function initialBaseLayer(search: string): BaseLayerId {
  return readPermalinkBaseLayer(search) ?? DEFAULT_BASE_LAYER_ID;
}

export const useMapStore = create<MapState>()((set) => ({
  ...initialMapState,
  activeBaseLayerId: initialBaseLayer(window.location.search),
  setMap: (map) => set({ map }),
  setActiveBaseLayer: (activeBaseLayerId) => set({ activeBaseLayerId }),
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
  setCatalogueUnavailable: (catalogueUnavailable) => set({ catalogueUnavailable }),
}));
