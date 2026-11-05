import { GPF_HOST } from '../config/urls';
import type { SolsService } from '../data/solsLayersSchema';

/**
 * "Voir sur la carte" contract with the catalogue (doc/agents/geonetwork-ui.md §10):
 * /explorer-les-cartes/?layer=<name>&type=<WMS|WMTS|TMS>&url=<endpoint>
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

function tolerantDecode(value: string): string {
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
