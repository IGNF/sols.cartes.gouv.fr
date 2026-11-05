import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_BASE_LAYER_ID } from '../config/map';
import { initialMapState, useMapStore } from './useMapStore';

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('démarre sans carte, sur le fond par défaut, panneau des fonds ouvert', () => {
    const state = useMapStore.getState();
    expect(state.map).toBeNull();
    expect(state.activeBaseLayerId).toBe(DEFAULT_BASE_LAYER_ID);
    expect(state.isPanelOpen).toBe(true);
  });

  it('enregistre puis oublie l’instance de carte', () => {
    const fakeMap = {} as OlMap;
    useMapStore.getState().setMap(fakeMap);
    expect(useMapStore.getState().map).toBe(fakeMap);
    useMapStore.getState().setMap(null);
    expect(useMapStore.getState().map).toBeNull();
  });

  it('bascule le panneau des fonds de carte', () => {
    useMapStore.getState().togglePanel();
    expect(useMapStore.getState().isPanelOpen).toBe(false);
    useMapStore.getState().togglePanel();
    expect(useMapStore.getState().isPanelOpen).toBe(true);
  });

  it('change le fond actif', () => {
    useMapStore.getState().setActiveBaseLayer('orthophotos');
    expect(useMapStore.getState().activeBaseLayerId).toBe('orthophotos');
  });
});
