import { PERMALINK_PARAMS, PERMALINK_FLAG } from '../config/map';

/**
 * Permalink of the map, in the cartes.gouv.fr format (IGNF/cartes.gouv.fr-entree-carto, `src/stores/mapStore.js`),
 * so that a link copied from this map round-trips through the deep-link reader (src/map/deepLink.ts) and
 * stays homogeneous with the catalogue's "Voir sur la carte" links (decision C-3):
 *   <base>?c=<lon>,<lat>&z=<zoom>&l=<name>$GEOPORTAIL:<OGC|GPP>:<WMS|WMTS|TMS>(<position>;<opacity>;<visible>;<grayscale>[;<style>]),...&permalink=yes
 * `l` is written raw (`$`, `:`, `;`, `(`, `)` are valid in a query string), as cartes.gouv.fr does.
 */
export interface PermalinkLayerState {
  name: string;
  geopType: 'OGC' | 'GPP';
  serviceType: 'WMS' | 'WMTS' | 'TMS';
  opacity: number;
  visible: boolean;
  style?: string;
}

export interface PermalinkState {
  /** Geographic centre, WGS84 (lon, lat). */
  center: [number, number];
  zoom: number;
  /** Drawing order, base layer first (position 0). */
  layers: PermalinkLayerState[];
}

/** Six decimals as cartes.gouv.fr (about 10 cm), trailing zeros removed. */
function coordinate(value: number): string {
  return String(Number(value.toFixed(6)));
}

function opacity(value: number): string {
  return String(Number(Math.min(1, Math.max(0, value)).toFixed(2)));
}

/** One entry of `l`: `name$GEOPORTAIL:geopType:serviceType(position;opacity;visible;grayscale[;style])`. */
export function formatPermalinkLayer(layer: PermalinkLayerState, position: number): string {
  const options = [position, opacity(layer.opacity), layer.visible ? 1 : 0, 0];
  if (layer.style) options.push(layer.style);
  return `${layer.name}$GEOPORTAIL:${layer.geopType}:${layer.serviceType}(${options.join(';')})`;
}

/** Full permalink URL; `base` is the absolute URL of the map page (origin + path, no query). */
export function buildPermalink(base: string, state: PermalinkState): string {
  const { center: c, zoom: z, layers: l, permalink } = PERMALINK_PARAMS;
  const query = [
    `${c}=${coordinate(state.center[0])},${coordinate(state.center[1])}`,
    `${z}=${String(Number(state.zoom.toFixed(2)))}`,
    `${l}=${state.layers.map(formatPermalinkLayer).join(',')}`,
    `${permalink}=${PERMALINK_FLAG}`,
  ];
  return `${base}?${query.join('&')}`;
}

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
