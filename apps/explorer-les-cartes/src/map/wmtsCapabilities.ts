import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import { GPF_CAPABILITIES_FETCH, WMTS_VERSION } from '../config/map';
import { buildCapabilitiesUrl, GPF_ENDPOINTS } from '../config/urls';
import { fetchHedged, type HedgeOptions } from './fetchHedged';

/**
 * Parsed WMTS capabilities, as returned by ol/format/WMTSCapabilities, plus `QueryableLayers`: the
 * identifiers of the layers that publish an `InfoFormat` (OpenLayers does not read it), i.e. the only
 * ones the GPF answers GetFeatureInfo requests for (the others get HTTP 400 "not queryable").
 */
export type WmtsCapabilities = Record<string, unknown> & { QueryableLayers?: string[] };

export interface WmtsLayerInfo {
  identifier: string;
  title: string;
  abstract: string;
  /** First legend image of the first style (`Style[0].LegendURL[0].href`), if published. */
  legendUrl?: string;
  /** The layer publishes at least one `InfoFormat`: GetFeatureInfo requests are accepted. */
  queryable: boolean;
}

/** Identifiers of the `Contents/Layer` elements that publish an `InfoFormat`. */
export function queryableWmtsLayers(doc: Document): string[] {
  const names: string[] = [];
  for (const layer of Array.from(doc.getElementsByTagName('Layer'))) {
    const children = Array.from(layer.children);
    if (!children.some((child) => child.localName === 'InfoFormat')) continue;
    const identifier = children
      .find((child) => child.localName === 'Identifier')
      ?.textContent?.trim();
    if (identifier) names.push(identifier);
  }
  return names;
}

export const WMTS_CAPABILITIES_URL = buildCapabilitiesUrl(GPF_ENDPOINTS.wmts, 'WMTS', WMTS_VERSION);

export function parseWmtsCapabilities(xml: string): WmtsCapabilities {
  // One DOM parse for both readers (OpenLayers accepts a Document).
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parsed: unknown = new WMTSCapabilities().read(doc);
  if (!parsed || typeof parsed !== 'object' || !('Contents' in parsed)) {
    throw new Error('Capacités WMTS illisibles');
  }
  return { ...(parsed as Record<string, unknown>), QueryableLayers: queryableWmtsLayers(doc) };
}

export async function fetchWmtsCapabilities(
  signal?: AbortSignal,
  options: Omit<HedgeOptions, 'signal'> = GPF_CAPABILITIES_FETCH,
): Promise<WmtsCapabilities> {
  const response = await fetchHedged(WMTS_CAPABILITIES_URL, { ...options, signal });
  if (!response.ok) {
    throw new Error(`Capacités WMTS indisponibles (HTTP ${response.status})`);
  }
  return parseWmtsCapabilities(await response.text());
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Returns the title and abstract of a layer, or null when the layer is not published. */
export function findWmtsLayer(
  capabilities: WmtsCapabilities,
  identifier: string,
): WmtsLayerInfo | null {
  const contents = capabilities['Contents'];
  if (!contents || typeof contents !== 'object') return null;
  const layers = (contents as Record<string, unknown>)['Layer'];
  if (!Array.isArray(layers)) return null;
  for (const layer of layers as unknown[]) {
    if (!layer || typeof layer !== 'object') continue;
    const record = layer as Record<string, unknown>;
    if (asString(record['Identifier']) === identifier) {
      const styles = record['Style'];
      const legends = Array.isArray(styles)
        ? (styles[0] as Record<string, unknown>)?.['LegendURL']
        : null;
      const legendUrl = Array.isArray(legends)
        ? asString((legends[0] as Record<string, unknown>)?.['href'])
        : '';
      return {
        identifier,
        title: asString(record['Title']) || identifier,
        abstract: asString(record['Abstract']),
        ...(legendUrl ? { legendUrl } : {}),
        queryable: capabilities.QueryableLayers?.includes(identifier) ?? false,
      };
    }
  }
  return null;
}
