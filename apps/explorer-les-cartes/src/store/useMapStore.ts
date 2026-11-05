import type OlMap from 'ol/Map';
import { create } from 'zustand';
import {
  DEFAULT_BASE_LAYER_ID,
  SIDE_PANEL_OPEN_MEDIA_QUERY,
  type BaseLayerId,
} from '../config/map';
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
  isPanelOpen: boolean;
  /** Layers the user put on the map, in drawing order (last on top). */
  overlays: OverlayRef[];
  /** Keys of overlays whose tiles all fail (the service answers with errors). */
  unavailableOverlays: string[];
  setMap: (map: OlMap | null) => void;
  setActiveBaseLayer: (id: BaseLayerId) => void;
  togglePanel: () => void;
  /** Adds an overlay once (same key ignored). */
  addOverlay: (overlay: OverlayRef) => void;
  removeOverlay: (key: string) => void;
  markOverlayUnavailable: (key: string) => void;
}

export const initialMapState = {
  map: null,
  activeBaseLayerId: DEFAULT_BASE_LAYER_ID,
  isPanelOpen: true,
  overlays: [] as OverlayRef[],
  unavailableOverlays: [] as string[],
} satisfies Partial<MapState>;

/** Base layer named by a permalink (`l`), else the default one. */
export function initialBaseLayer(search: string): BaseLayerId {
  return readPermalinkBaseLayer(search) ?? DEFAULT_BASE_LAYER_ID;
}

/**
 * Side panel open by default from the DSFR `md` breakpoint; closed on small screens so the map is
 * visible without scrolling (the "Afficher le panneau" button stays first). Open when matchMedia is
 * unavailable (tests, old browsers).
 */
export function initialPanelOpen(
  matchMedia: ((query: string) => MediaQueryList) | undefined,
): boolean {
  return matchMedia ? matchMedia(SIDE_PANEL_OPEN_MEDIA_QUERY).matches : true;
}

export const useMapStore = create<MapState>()((set) => ({
  ...initialMapState,
  isPanelOpen: initialPanelOpen(
    typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
  ),
  activeBaseLayerId: initialBaseLayer(window.location.search),
  setMap: (map) => set({ map }),
  setActiveBaseLayer: (activeBaseLayerId) => set({ activeBaseLayerId }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
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
