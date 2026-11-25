import { PERMALINK_PARAMS } from '../config/map';

/**
 * View of a cartes.gouv.fr permalink (IGNF/cartes.gouv.fr-entree-carto, `src/stores/mapStore.js`):
 *   <base>?c=<lon>,<lat>&z=<zoom>&l=<layers>&permalink=yes
 * The layers of `l` are read by src/map/deepLink.ts.
 */
export interface PermalinkView {
  /** Geographic centre (lon, lat). */
  center: [number, number];
  zoom: number;
}

/**
 * Reads `c=<lon>,<lat>` and `z=<zoom>` of a permalink; null unless both are finite and plausible
 * (longitude ±180, latitude ±90, zoom 0 to 28). Tolerant to `c=lon,lat` with spaces and to a `z` with decimals.
 */
export function readPermalinkView(search: string): PermalinkView | null {
  const params = new URLSearchParams(search);
  const centerParam = params.get(PERMALINK_PARAMS.center);
  const zoomParam = params.get(PERMALINK_PARAMS.zoom);
  if (!centerParam?.trim() || !zoomParam?.trim()) return null;
  const center = centerParam.split(',').map((v) => Number(v.trim()));
  const zoom = Number(zoomParam);
  const [lon, lat] = center;
  if (
    center.length !== 2 ||
    lon === undefined ||
    lat === undefined ||
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(zoom) ||
    Math.abs(lon) > 180 ||
    Math.abs(lat) > 90 ||
    zoom < 0 ||
    zoom > 28
  ) {
    return null;
  }
  return { center: [lon, lat], zoom };
}
