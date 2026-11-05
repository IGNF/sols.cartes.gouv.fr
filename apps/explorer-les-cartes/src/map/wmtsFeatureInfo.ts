import type { Coordinate } from 'ol/coordinate';
import { createEmpty, getWidth, intersects } from 'ol/extent';
import type Projection from 'ol/proj/Projection';
import { toSize } from 'ol/size';
import type WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';

/** `ol/source/WMTS` with the method the geopf-extensions GetFeatureInfo control calls on a WMTS source. */
export type WmtsWithFeatureInfo = WMTS & {
  getFeatureInfoUrl: (
    coordinate: Coordinate,
    resolution: number,
    projection: Projection,
    params: Record<string, string>,
  ) => string | undefined;
};

/**
 * WMTS 1.0.0 KVP GetFeatureInfo URL of a coordinate, as `geopf-extensions-openlayers/src/packages/Sources/WMTS.js`
 * builds it (ported here so the map chunk does not pull geoportal-access-lib): tile of the coordinate at the
 * given resolution, wrapped on a global projection, then the pixel (I, J) inside that tile.
 * Returns undefined when the tile is outside the projection extent or the grid has no such level.
 */
export function wmtsFeatureInfoUrl(
  source: WMTS,
  coordinate: Coordinate,
  resolution: number,
  projection: Projection,
  params: Record<string, string>,
): string | undefined {
  const tileGrid = source.getTileGrid();
  const base = source.getUrls()?.[0];
  if (!(tileGrid instanceof WMTSTileGrid) || !base) return undefined;
  const tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, resolution);
  const [z = 0, column = 0, row = 0] = tileCoord;
  if (z >= tileGrid.getResolutions().length) return undefined;
  let col = column;
  let tileExtent = tileGrid.getTileCoordExtent(tileCoord);
  const extent = projection.getExtent();
  if (extent && projection.isGlobal()) {
    const columns = Math.ceil(getWidth(extent) / getWidth(tileExtent));
    col = ((col % columns) + columns) % columns;
    tileExtent = tileGrid.getTileCoordExtent([z, col, row], createEmpty());
  }
  if (extent && !intersects(tileExtent, extent)) return undefined;
  const tileResolution = tileGrid.getResolution(z) / source.getTilePixelRatio(1);
  const [tileWidth = 256] = toSize(tileGrid.getTileSize(z));
  const [x = 0, y = 0] = coordinate;
  const [minX = 0, , , maxY = 0] = tileExtent;
  const i = Math.min(Math.floor((x - minX) / tileResolution), tileWidth - 1);
  const j = Math.max(Math.floor((maxY - y) / tileResolution), 0);
  const url = new URL(base);
  const query: Record<string, string> = {
    SERVICE: 'WMTS',
    VERSION: '1.0.0',
    REQUEST: 'GetFeatureInfo',
    LAYER: source.getLayer(),
    TILECOL: String(col),
    TILEROW: String(row),
    TILEMATRIX: tileGrid.getMatrixIds()[z] ?? String(z),
    TILEMATRIXSET: source.getMatrixSet(),
    FORMAT: source.getFormat() || 'image/png',
    STYLE: source.getStyle() || 'normal',
    ...params,
    I: String(i),
    J: String(j),
  };
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url.toString();
}

/**
 * What a non-queryable layer answers: the control fetches whatever URL it gets, and an empty document is
 * its "no data" case (a GPF 400 "not queryable" would be logged as a failed resource in the console).
 */
export const NO_FEATURE_INFO_URL = 'data:text/plain,';

/**
 * Adds `getFeatureInfoUrl` to a standard OpenLayers WMTS source (TileWMS already has one). A layer that
 * does not publish an `InfoFormat` (`queryable: false`) answers with NO_FEATURE_INFO_URL.
 */
export function attachWmtsFeatureInfo(source: WMTS, queryable = true): WmtsWithFeatureInfo {
  return Object.assign(source, {
    getFeatureInfoUrl: (
      coordinate: Coordinate,
      resolution: number,
      projection: Projection,
      params: Record<string, string>,
    ) =>
      queryable
        ? wmtsFeatureInfoUrl(source, coordinate, resolution, projection, params)
        : NO_FEATURE_INFO_URL,
  });
}
