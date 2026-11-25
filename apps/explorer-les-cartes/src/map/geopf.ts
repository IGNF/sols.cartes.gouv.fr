/**
 * Single entry point for geopf-extensions-openlayers (pinned to 1.0.0-beta.16, see doc/agents/geopf-ext.md §5.2).
 * Deep `src/packages/...` paths are not a public API: an upgrade must only touch this file.
 * The root index is not used (it pulls the Panoramax control and its missing peer dependency).
 */
import 'geopf-extensions-openlayers/src/packages/CSS/DSFRgeneralWidget.css';
import 'geopf-extensions-openlayers/src/packages/CSS/Controls/Zoom/DSFRzoomStyle.css';
import 'geopf-extensions-openlayers/src/packages/CSS/Controls/FullScreen/DSFRfullScreenStyle.css';
import 'geopf-extensions-openlayers/src/packages/CSS/Controls/LayerSwitcher/DSFRlayerSwitcherStyle.css';
import 'geopf-extensions-openlayers/src/packages/CSS/Controls/SearchEngine/DSFRsearchEngineStyle.css';
import 'geopf-extensions-openlayers/src/packages/CSS/Controls/SearchEngine/DSFRadvancedSearchEngineStyle.css';
import type Catalog from 'geopf-extensions-openlayers/src/packages/Controls/Catalog/Catalog';
import type CoordinateAdvancedSearch from 'geopf-extensions-openlayers/src/packages/Controls/SearchEngine/CoordinateAdvancedSearch';
import type SearchEngineAdvanced from 'geopf-extensions-openlayers/src/packages/Controls/SearchEngine/SearchEngineAdvanced';
import type Drawing from 'geopf-extensions-openlayers/src/packages/Controls/Drawing/Drawing';
import type ElevationPath from 'geopf-extensions-openlayers/src/packages/Controls/ElevationPath/ElevationPath';
import type GetFeatureInfo from 'geopf-extensions-openlayers/src/packages/Controls/GetFeatureInfo/GetFeatureInfo';
import type Isocurve from 'geopf-extensions-openlayers/src/packages/Controls/Isocurve/Isocurve';
import type LayerImport from 'geopf-extensions-openlayers/src/packages/Controls/LayerImport/LayerImport';
import type MeasureArea from 'geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureArea';
import type MeasureAzimuth from 'geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureAzimuth';
import type MeasureLength from 'geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureLength';
import type MousePosition from 'geopf-extensions-openlayers/src/packages/Controls/MousePosition/MousePosition';
import type ReverseGeocode from 'geopf-extensions-openlayers/src/packages/Controls/ReverseGeocode/ReverseGeocode';
import type Route from 'geopf-extensions-openlayers/src/packages/Controls/Route/Route';
import type { Territory } from 'geopf-extensions-openlayers/src/packages/Controls/Territories/Territories';

export { default as GeoportalFullScreen } from 'geopf-extensions-openlayers/src/packages/Controls/FullScreen/GeoportalFullScreen';
export { default as GeoportalZoom } from 'geopf-extensions-openlayers/src/packages/Controls/Zoom/GeoportalZoom';
export { default as LayerSwitcher } from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';
export type { LayerSwitcherOptions } from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';
export type { CatalogOptions } from 'geopf-extensions-openlayers/src/packages/Controls/Catalog/Catalog';
export type { ControlListOptions } from 'geopf-extensions-openlayers/src/packages/Controls/ControlList/ControlList';
export type { DrawingOptions } from 'geopf-extensions-openlayers/src/packages/Controls/Drawing/Drawing';
export type { LegendsOptions } from 'geopf-extensions-openlayers/src/packages/Controls/Legends/Legends';
export type {
  TerritoriesOptions,
  Territory,
} from 'geopf-extensions-openlayers/src/packages/Controls/Territories/Territories';

/** Options of the controls whose `.d.ts` only types the constructor parameter (no exported Options type). */
export type MousePositionOptions = ConstructorParameters<typeof MousePosition>[0];
export type MeasureLengthOptions = ConstructorParameters<typeof MeasureLength>[0];
export type MeasureAreaOptions = ConstructorParameters<typeof MeasureArea>[0];
export type MeasureAzimuthOptions = ConstructorParameters<typeof MeasureAzimuth>[0];
export type ElevationPathOptions = ConstructorParameters<typeof ElevationPath>[0];
export type IsocurveOptions = ConstructorParameters<typeof Isocurve>[0];
export type RouteOptions = ConstructorParameters<typeof Route>[0];
export type ReverseGeocodeOptions = ConstructorParameters<typeof ReverseGeocode>[0];
export type LayerImportOptions = ConstructorParameters<typeof LayerImport>[0];
export type GetFeatureInfoOptions = ConstructorParameters<typeof GetFeatureInfo>[0];
export type SearchEngineAdvancedOptions = ConstructorParameters<typeof SearchEngineAdvanced>[0];
export type CoordinateAdvancedSearchOptions = NonNullable<
  ConstructorParameters<typeof CoordinateAdvancedSearch>[0]
>;
export type DrawingControl = Drawing;
export type CatalogControl = Catalog;

/**
 * Catalogue of the GIS Sol datasets (M9): the geopf Catalog control, in its own chunk, fed with a
 * configuration built from sols-layers.json (src/map/catalogConfig.ts), never with `Gp.Config`.
 */
export async function loadCatalog() {
  const [module] = await Promise.all([
    import('geopf-extensions-openlayers/src/packages/Controls/Catalog/Catalog'),
    import('./geopfCatalogStyles'),
  ]);
  return module.default;
}

/**
 * Search engine of cartes.gouv.fr and guichet-collaboratif (M19): `SearchEngineAdvanced`, whose « Avancée »
 * button opens a panel starting with « Me géolocaliser », then one accordion per advanced form. It pulls
 * geoportal-access-lib, proj4 and the geopf layer classes (~0.7 MB minified): loaded in its own chunk, after
 * the map is displayed, with the coordinate form (the only advanced form calling no service).
 */
export async function loadSearchEngine() {
  const [advanced, coordinate] = await Promise.all([
    import('geopf-extensions-openlayers/src/packages/Controls/SearchEngine/SearchEngineAdvanced'),
    import('geopf-extensions-openlayers/src/packages/Controls/SearchEngine/CoordinateAdvancedSearch'),
  ]);
  return {
    SearchEngineAdvanced: advanced.default,
    CoordinateAdvancedSearch: coordinate.default,
  };
}

export type SearchEngineModule = Awaited<ReturnType<typeof loadSearchEngine>>;

/**
 * The tool set of the cartes.gouv.fr map viewer (M8), loaded on demand after the map is displayed:
 * legends, territories, overview map, cursor coordinates, measures, elevation profile, route, isochrone,
 * reverse geocoding, drawing, layer import, feature info and the « Afficher tous les outils » list, with their DSFR
 * stylesheets (geopfToolsStyles.ts). One chunk per control, geoportal-access-lib shared with the search
 * engine. `TERRITORIES` is the control's built-in list (Territories.json).
 */
export async function loadMapTools() {
  const [
    legends,
    territories,
    overviewMap,
    mousePosition,
    measureLength,
    measureArea,
    measureAzimuth,
    elevationPath,
    isocurve,
    route,
    reverseGeocode,
    drawing,
    layerImport,
    getFeatureInfo,
    controlList,
    territoriesJson,
  ] = await Promise.all([
    import('geopf-extensions-openlayers/src/packages/Controls/Legends/Legends'),
    import('geopf-extensions-openlayers/src/packages/Controls/Territories/Territories'),
    import('geopf-extensions-openlayers/src/packages/Controls/OverviewMap/GeoportalOverviewMap'),
    import('geopf-extensions-openlayers/src/packages/Controls/MousePosition/MousePosition'),
    import('geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureLength'),
    import('geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureArea'),
    import('geopf-extensions-openlayers/src/packages/Controls/Measures/MeasureAzimuth'),
    import('geopf-extensions-openlayers/src/packages/Controls/ElevationPath/ElevationPath'),
    import('geopf-extensions-openlayers/src/packages/Controls/Isocurve/Isocurve'),
    import('geopf-extensions-openlayers/src/packages/Controls/Route/Route'),
    import('geopf-extensions-openlayers/src/packages/Controls/ReverseGeocode/ReverseGeocode'),
    import('geopf-extensions-openlayers/src/packages/Controls/Drawing/Drawing'),
    import('geopf-extensions-openlayers/src/packages/Controls/LayerImport/LayerImport'),
    import('geopf-extensions-openlayers/src/packages/Controls/GetFeatureInfo/GetFeatureInfo'),
    import('geopf-extensions-openlayers/src/packages/Controls/ControlList/ControlList'),
    import('geopf-extensions-openlayers/src/packages/Controls/Territories/Territories.json'),
    import('./geopfToolsStyles'),
  ]);
  return {
    Legends: legends.default,
    Territories: territories.default,
    GeoportalOverviewMap: overviewMap.default,
    MousePosition: mousePosition.default,
    MeasureLength: measureLength.default,
    MeasureArea: measureArea.default,
    MeasureAzimuth: measureAzimuth.default,
    ElevationPath: elevationPath.default,
    Isocurve: isocurve.default,
    Route: route.default,
    ReverseGeocode: reverseGeocode.default,
    Drawing: drawing.default,
    LayerImport: layerImport.default,
    GetFeatureInfo: getFeatureInfo.default,
    ControlList: controlList.default,
    // The built-in JSON writes `zoom: null`, which the control accepts and the Territory type does not declare.
    TERRITORIES: territoriesJson.default as unknown as Territory[],
  };
}

export type MapToolsModule = Awaited<ReturnType<typeof loadMapTools>>;

/**
 * Registers a projection (proj4 definition and extent) with OpenLayers through the geopf CRS module,
 * loaded on demand: needed by WMTS layers published only in Lambert-93 (EPSG:2154).
 */
export async function loadCrs(name: string): Promise<void> {
  const module = await import('geopf-extensions-openlayers/src/packages/CRS/CRS');
  module.default.loadByName(name);
}
