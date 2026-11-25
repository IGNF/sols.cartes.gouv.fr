import { BASE_LAYER_CANDIDATES, PERMALINK_PARAMS, type BaseLayerId } from '../config/map';
import { GPF_HOST } from '../config/urls';
import type { SolsService } from '../data/solsLayersSchema';

/**
 * "Voir sur la carte" links (doc/agents/geopf-ext.md §6.3).
 *
 * Primary format, the cartes.gouv.fr permalink (decision C-3, catalogue task C6):
 *   /explorer-les-cartes/?l=<name>$GEOPORTAIL:<OGC|GPP>:<WMS|WMTS|TMS>(<position>;<opacity>;<visible>;<grayscale>[;<style>])&permalink=no
 * Secondary alias (catalogue C4, doc/agents/geonetwork-ui.md §10):
 *   /explorer-les-cartes/?layer=<name>&type=<WMS|WMTS|TMS>&url=<endpoint>
 * `type` arrives uppercase, `layer` is not URL-encoded, `url` is.
 */
export interface DeepLink {
  layer: string;
  type: string;
  url: string;
}

export type DeepLinkTarget =
  | { kind: 'layer'; service: SolsService; name: string }
  | { kind: 'unsupported'; type: string }
  | { kind: 'invalid' };

export function tolerantDecode(value: string): string {
  // URLSearchParams already decoded once; a value encoded twice (or a stray "%") is decoded if possible.
  if (!/%[0-9A-Fa-f]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Reads the deep link from a query string; null when one of the three parameters is missing. */
export function parseDeepLink(search: string): DeepLink | null {
  const params = new URLSearchParams(search);
  const layer = params.get('layer')?.trim();
  const type = params.get('type')?.trim();
  const url = params.get('url')?.trim();
  if (!layer || !type || !url) return null;
  return { layer: tolerantDecode(layer), type: type.toUpperCase(), url: tolerantDecode(url) };
}

/**
 * Maps a deep link to a GPF service. Only https://data.geopf.fr endpoints are accepted; both WMS forms
 * seen in the CSW are understood (`/wms-v` without path, `/wms-r/wms`). TMS links carry a MapLibre style (unsupported in v0).
 */
export function resolveDeepLink(link: DeepLink): DeepLinkTarget {
  if (link.type === 'TMS') return { kind: 'unsupported', type: link.type };
  let url: URL;
  try {
    url = new URL(link.url);
  } catch {
    return { kind: 'invalid' };
  }
  if (url.protocol !== 'https:' || url.hostname !== GPF_HOST) return { kind: 'invalid' };
  const path = url.pathname;
  if (link.type === 'WMS') {
    if (path.startsWith('/wms-r'))
      return { kind: 'layer', service: 'wms-raster', name: link.layer };
    if (path.startsWith('/wms-v'))
      return { kind: 'layer', service: 'wms-vector', name: link.layer };
    return { kind: 'invalid' };
  }
  if (link.type === 'WMTS' && path.startsWith('/wmts')) {
    return { kind: 'layer', service: 'wmts', name: link.layer };
  }
  if (link.type === 'WFS' || link.type === 'GEOJSON')
    return { kind: 'unsupported', type: link.type };
  return { kind: 'invalid' };
}

/** One layer of a cartes.gouv.fr `l` permalink parameter. */
export interface PermalinkLayer {
  name: string;
  /** `OGC` or `GPP`. */
  geopType: string;
  /** Uppercase service type: WMS, WMTS, TMS, WFS... */
  serviceType: string;
  opacity?: number;
  visible?: boolean;
  style?: string;
}

const PERMALINK_LAYER = /^(.+?)\$GEOPORTAIL:([A-Za-z]+):([A-Za-z]+)(?:\((.*)\))?$/;

function readFlag(value: string | undefined): boolean | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  return Number(value) !== 0;
}

function readOpacity(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const opacity = Number(value);
  return Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : undefined;
}

/**
 * Parses the layers of `l` (comma separated). Options follow the cartes.gouv.fr permalink grammar:
 * `(position;opacity;visible;grayscale[;style])`, or the short `(opacity;visible;grayscale)` seen in older
 * links. Unparsable entries are skipped.
 */
export function parsePermalinkLayers(value: string): PermalinkLayer[] {
  return tolerantDecode(value)
    .split(',')
    .map((entry) => entry.trim())
    .flatMap((entry) => {
      const match = PERMALINK_LAYER.exec(entry);
      if (!match) return [];
      const [, name = '', geopType = '', serviceType = '', options] = match;
      const values = options === undefined ? [] : options.split(';');
      const short = values.length === 3;
      const layer: PermalinkLayer = {
        name: name.trim(),
        geopType: geopType.toUpperCase(),
        serviceType: serviceType.toUpperCase(),
      };
      const opacity = readOpacity(short ? values[0] : values[1]);
      const visible = readFlag(short ? values[1] : values[2]);
      const style = short ? undefined : values[4]?.trim();
      if (opacity !== undefined) layer.opacity = opacity;
      if (visible !== undefined) layer.visible = visible;
      if (style) layer.style = style;
      return layer.name ? [layer] : [];
    });
}

/** What the map does with a "Voir sur la carte" link, whatever its format. */
export type DeepLinkRequest =
  | {
      kind: 'layer';
      name: string;
      /** Services to look the name up in, in order (sols-layers.json first, then live capabilities). */
      candidates: SolsService[];
      opacity?: number;
      visible?: boolean;
    }
  | { kind: 'unsupported'; name: string; type: string; style?: string }
  | { kind: 'invalid'; name: string };

/** Candidate GPF services for a service type without endpoint: WMS raster then vector, WMTS. */
export function candidatesForType(serviceType: string): SolsService[] | null {
  switch (serviceType.toUpperCase()) {
    case 'WMS':
      return ['wms-raster', 'wms-vector'];
    case 'WMTS':
      return ['wmts'];
    default:
      return null;
  }
}

/** The configured base layer a permalink entry names (a WMTS entry with a candidate's layer name), else null. */
function baseLayerFor(layer: PermalinkLayer): BaseLayerId | null {
  if (layer.serviceType !== 'WMTS') return null;
  return BASE_LAYER_CANDIDATES.find((c) => c.layerName === layer.name)?.id ?? null;
}

function toRequest(layer: PermalinkLayer): DeepLinkRequest {
  const candidates = candidatesForType(layer.serviceType);
  if (!candidates) {
    return {
      kind: 'unsupported',
      name: layer.name,
      type: layer.serviceType,
      ...(layer.style ? { style: layer.style } : {}),
    };
  }
  return {
    kind: 'layer',
    name: layer.name,
    candidates,
    ...(layer.opacity !== undefined ? { opacity: layer.opacity } : {}),
    ...(layer.visible !== undefined ? { visible: layer.visible } : {}),
  };
}

/**
 * Base layer selected by a permalink: the first WMTS entry of `l` naming one of the configured base layers
 * (this map's own permalinks put it first, src/map/permalink.ts). Null when `l` names none.
 */
export function readPermalinkBaseLayer(search: string): BaseLayerId | null {
  const permalink = new URLSearchParams(search).get(PERMALINK_PARAMS.layers);
  if (!permalink) return null;
  for (const layer of parsePermalinkLayers(permalink)) {
    const id = baseLayerFor(layer);
    if (id) return id;
  }
  return null;
}

/**
 * Reads the layers to add from a query string: every entry of `l` (primary) that is not a base layer, in
 * order, else the `layer/type/url` alias. `permalink`, `c`, `z` and the other cartes.gouv.fr parameters are
 * not layers (see readPermalinkView). An `l` without any parsable entry and no alias is one invalid link.
 * Empty when there is no link.
 */
export function readDeepLinks(search: string): DeepLinkRequest[] {
  const params = new URLSearchParams(search);
  const permalink = params.get(PERMALINK_PARAMS.layers);
  if (permalink) {
    const layers = parsePermalinkLayers(permalink);
    if (layers.length > 0) return layers.filter((layer) => !baseLayerFor(layer)).map(toRequest);
  }
  const alias = parseDeepLink(search);
  if (!alias) return permalink ? [{ kind: 'invalid', name: tolerantDecode(permalink) }] : [];
  const target = resolveDeepLink(alias);
  if (target.kind === 'layer')
    return [{ kind: 'layer', name: target.name, candidates: [target.service] }];
  if (target.kind === 'unsupported')
    return [{ kind: 'unsupported', name: alias.layer, type: target.type }];
  return [{ kind: 'invalid', name: alias.layer }];
}

/** The first layer to add (the catalogue sends one); null when there is no link. */
export function readDeepLink(search: string): DeepLinkRequest | null {
  return readDeepLinks(search)[0] ?? null;
}
