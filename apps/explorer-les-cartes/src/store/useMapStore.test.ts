import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_BASE_LAYER_ID } from '../config/map';
import type { OverlayRef } from '../map/overlays';
import { initialBaseLayer, initialMapState, useMapStore } from './useMapStore';

const LOIRET: OverlayRef = {
  key: 'wms-vector:rrp_loiret',
  service: 'wms-vector',
  name: 'rrp_loiret',
  title: 'RRP du Loiret',
  endpoint: 'https://data.geopf.fr/wms-v/ows',
};

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('démarre sans carte, sur le fond par défaut', () => {
    const state = useMapStore.getState();
    expect(state.map).toBeNull();
    expect(state.activeBaseLayerId).toBe(DEFAULT_BASE_LAYER_ID);
  });

  it('enregistre puis oublie l’instance de carte', () => {
    const fakeMap = {} as OlMap;
    useMapStore.getState().setMap(fakeMap);
    expect(useMapStore.getState().map).toBe(fakeMap);
    useMapStore.getState().setMap(null);
    expect(useMapStore.getState().map).toBeNull();
  });

  it('change le fond actif', () => {
    useMapStore.getState().setActiveBaseLayer('orthophotos');
    expect(useMapStore.getState().activeBaseLayerId).toBe('orthophotos');
  });

  it('ajoute une couche sols une seule fois, puis la retire', () => {
    const { addOverlay, removeOverlay } = useMapStore.getState();
    addOverlay(LOIRET);
    addOverlay(LOIRET);
    expect(useMapStore.getState().overlays).toEqual([LOIRET]);
    removeOverlay(LOIRET.key);
    expect(useMapStore.getState().overlays).toEqual([]);
  });

  it('marque une couche indisponible, et oublie la marque quand elle est retirée', () => {
    const { addOverlay, markOverlayUnavailable, removeOverlay } = useMapStore.getState();
    addOverlay(LOIRET);
    markOverlayUnavailable(LOIRET.key);
    markOverlayUnavailable(LOIRET.key);
    expect(useMapStore.getState().unavailableOverlays).toEqual([LOIRET.key]);
    removeOverlay(LOIRET.key);
    expect(useMapStore.getState().unavailableOverlays).toEqual([]);
  });

  it('prend le fond de carte d’un permalien, sinon le fond par défaut', () => {
    expect(initialBaseLayer('?l=ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS(0;1;1;0)')).toBe(
      'orthophotos',
    );
    expect(initialBaseLayer('?l=x$GEOPORTAIL:OGC:WMS(1;1;1;0)')).toBe(DEFAULT_BASE_LAYER_ID);
    expect(initialBaseLayer('')).toBe(DEFAULT_BASE_LAYER_ID);
  });
});
