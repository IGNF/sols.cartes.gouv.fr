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
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Legends/Legends', () => ({
  default: function LegendsStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Territories/Territories', () => ({
  default: function TerritoriesStub() {},
}));
vi.mock(
  'geopf-extensions-openlayers/src/packages/Controls/OverviewMap/GeoportalOverviewMap',
  () => ({
    default: function GeoportalOverviewMapStub() {},
  }),
);
vi.mock('geopf-extensions-openlayers/src/packages/Controls/MousePosition/MousePosition', () => ({
  default: function MousePositionStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureLength', () => ({
  default: function MeasureLengthStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureArea', () => ({
  default: function MeasureAreaStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureAzimuth', () => ({
  default: function MeasureAzimuthStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/ElevationPath/ElevationPath', () => ({
  default: function ElevationPathStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Isocurve/Isocurve', () => ({
  default: function IsocurveStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Route/Route', () => ({
  default: function RouteStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/ReverseGeocode/ReverseGeocode', () => ({
  default: function ReverseGeocodeStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Drawing/Drawing', () => ({
  default: function DrawingStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/LayerImport/LayerImport', () => ({
  default: function LayerImportStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/GetFeatureInfo/GetFeatureInfo', () => ({
  default: function GetFeatureInfoStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/ControlList/ControlList', () => ({
  default: function ControlListStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Catalog/Catalog', () => ({
  default: function CatalogStub() {},
}));
vi.mock('geopf-extensions-openlayers/src/packages/Controls/Territories/Territories.json', () => ({
  default: [{ id: 'FXX', title: 'France métropolitaine', bbox: [] }],
}));

describe('geopf (point d’entrée unique)', () => {
  it('charge le moteur de recherche à la demande', async () => {
    const { loadSearchEngine } = await import('./geopf');
    expect((await loadSearchEngine()).name).toBe('SearchEngineStub');
  });

  it('charge le jeu d’outils à la demande, avec la liste intégrée des territoires', async () => {
    const { loadMapTools } = await import('./geopf');
    const tools = await loadMapTools();
    expect(tools.MeasureLength.name).toBe('MeasureLengthStub');
    expect(tools.ControlList.name).toBe('ControlListStub');
    expect(tools.GeoportalOverviewMap.name).toBe('GeoportalOverviewMapStub');
    expect(tools.TERRITORIES.map((t) => t.id)).toEqual(['FXX']);
  });

  it('charge le catalogue à la demande', async () => {
    const { loadCatalog } = await import('./geopf');
    expect((await loadCatalog()).name).toBe('CatalogStub');
  });

  it('enregistre une projection par le module CRS chargé à la demande', async () => {
    const { loadCrs } = await import('./geopf');
    await loadCrs('EPSG:2154');
    expect(loadByName).toHaveBeenCalledWith('EPSG:2154');
  });
});
