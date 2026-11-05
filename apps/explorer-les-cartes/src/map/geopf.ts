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

export { default as GeoportalAttribution } from 'geopf-extensions-openlayers/src/packages/Controls/Attribution/GeoportalAttribution';
export { default as GeoportalFullScreen } from 'geopf-extensions-openlayers/src/packages/Controls/FullScreen/GeoportalFullScreen';
export { default as GeoportalZoom } from 'geopf-extensions-openlayers/src/packages/Controls/Zoom/GeoportalZoom';
export { default as LayerSwitcher } from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';
export type { LayerSwitcherOptions } from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';
export type { SearchEngineOptions } from 'geopf-extensions-openlayers/src/packages/Controls/SearchEngine/SearchEngine';

/**
 * SearchEngine pulls geoportal-access-lib, proj4 and the geopf layer classes (~0.7 MB minified):
 * it is loaded in its own chunk, after the map is displayed.
 */
export async function loadSearchEngine() {
  const module =
    await import('geopf-extensions-openlayers/src/packages/Controls/SearchEngine/SearchEngine');
  return module.default;
}

/**
 * Registers a projection (proj4 definition and extent) with OpenLayers through the geopf CRS module,
 * loaded on demand: needed by WMTS layers published only in Lambert-93 (EPSG:2154).
 */
export async function loadCrs(name: string): Promise<void> {
  const module = await import('geopf-extensions-openlayers/src/packages/CRS/CRS');
  module.default.loadByName(name);
}
