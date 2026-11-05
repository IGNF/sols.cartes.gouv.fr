import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_BASE_LAYER_ID } from '../config/map';
import { initialMapState, useMapStore } from './useMapStore';

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('démarre sans carte, sur le fond par défaut, panneau fermé', () => {
    const state = useMapStore.getState();
    expect(state.map).toBeNull();
    expect(state.activeBaseLayerId).toBe(DEFAULT_BASE_LAYER_ID);
    expect(state.isPanelOpen).toBe(false);
  });

  it('enregistre puis oublie l’instance de carte', () => {
    const fakeMap = {} as OlMap;
    useMapStore.getState().setMap(fakeMap);
    expect(useMapStore.getState().map).toBe(fakeMap);
    useMapStore.getState().setMap(null);
    expect(useMapStore.getState().map).toBeNull();
  });

  it('ouvre, ferme et bascule le panneau', () => {
    const { setPanelOpen, togglePanel } = useMapStore.getState();
    setPanelOpen(true);
    expect(useMapStore.getState().isPanelOpen).toBe(true);
    togglePanel();
    expect(useMapStore.getState().isPanelOpen).toBe(false);
    togglePanel();
    expect(useMapStore.getState().isPanelOpen).toBe(true);
  });

  it('change le fond actif', () => {
    useMapStore.getState().setActiveBaseLayer('plan-ign');
    expect(useMapStore.getState().activeBaseLayerId).toBe('plan-ign');
  });
});
