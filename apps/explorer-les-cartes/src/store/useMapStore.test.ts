import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BASE_LAYER_ID } from '../config/map';
import type { OverlayRef } from '../map/overlays';
import {
  initialBaseLayer,
  initialMapState,
  initialPanelOpen,
  initialTab,
  useMapStore,
} from './useMapStore';

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

  it('change d’onglet et ouvre « Données sols » pour un lien « Voir sur la carte »', () => {
    useMapStore.getState().setActiveTab('sols');
    expect(useMapStore.getState().activeTab).toBe('sols');
    expect(initialTab('?layer=x&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v')).toBe('sols');
    expect(initialTab('')).toBe('fonds');
    // A permalink naming only a base layer keeps the base layer tab.
    expect(
      initialTab('?l=ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS(0;1;1;0)&permalink=yes'),
    ).toBe('fonds');
  });

  it('prend le fond de carte d’un permalien, sinon le fond par défaut', () => {
    expect(initialBaseLayer('?l=ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS(0;1;1;0)')).toBe(
      'orthophotos',
    );
    expect(initialBaseLayer('?l=x$GEOPORTAIL:OGC:WMS(1;1;1;0)')).toBe(DEFAULT_BASE_LAYER_ID);
    expect(initialBaseLayer('')).toBe(DEFAULT_BASE_LAYER_ID);
  });

  it('ferme le panneau par défaut sous le point de rupture DSFR md, l’ouvre au-delà', () => {
    const media = (matches: boolean) => (query: string) =>
      ({ matches, media: query }) as MediaQueryList;
    const wide = vi.fn(media(true));
    expect(initialPanelOpen(wide)).toBe(true);
    expect(wide).toHaveBeenCalledWith('(min-width: 48em)');
    expect(initialPanelOpen(media(false))).toBe(false);
    expect(initialPanelOpen(undefined)).toBe(true);
  });
});
