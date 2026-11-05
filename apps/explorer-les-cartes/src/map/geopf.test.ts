import { describe, expect, it, vi } from 'vitest';

const loadByName = vi.hoisted(() => vi.fn());
vi.mock(
  'geopf-extensions-openlayers/src/packages/Controls/Attribution/GeoportalAttribution',
  () => ({ default: function ControlStub() {} }),
);
vi.mock('geopf-extensions-openlayers/src/packages/Controls/FullScreen/GeoportalFullScreen', () => ({
  default: function ControlStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Zoom/GeoportalZoom', () => ({
  default: function ControlStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher', () => ({
  default: function ControlStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/SearchEngine/SearchEngine', () => ({
  default: function SearchEngineStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/CRS/CRS', () => ({ default: { loadByName } }));

describe('geopf (point d’entrée unique)', () => {
  it('charge le moteur de recherche à la demande', async () => {
    const { loadSearchEngine } = await import('./geopf');
    expect((await loadSearchEngine()).name).toBe('SearchEngineStub');
  });

  it('enregistre une projection par le module CRS chargé à la demande', async () => {
    const { loadCrs } = await import('./geopf');
    await loadCrs('EPSG:2154');
    expect(loadByName).toHaveBeenCalledWith('EPSG:2154');
  });
});
