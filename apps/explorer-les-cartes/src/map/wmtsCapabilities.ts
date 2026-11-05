import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import { WMTS_VERSION } from '../config/map';
import { buildCapabilitiesUrl, GPF_ENDPOINTS } from '../config/urls';

/** Parsed WMTS capabilities, as returned by ol/format/WMTSCapabilities. */
export type WmtsCapabilities = Record<string, unknown>;

export interface WmtsLayerInfo {
  identifier: string;
  title: string;
  abstract: string;
}

export const WMTS_CAPABILITIES_URL = buildCapabilitiesUrl(GPF_ENDPOINTS.wmts, 'WMTS', WMTS_VERSION);

export function parseWmtsCapabilities(xml: string): WmtsCapabilities {
  const parsed: unknown = new WMTSCapabilities().read(xml);
  if (!parsed || typeof parsed !== 'object' || !('Contents' in parsed)) {
    throw new Error('Capacités WMTS illisibles');
  }
  return parsed as WmtsCapabilities;
}

export async function fetchWmtsCapabilities(signal?: AbortSignal): Promise<WmtsCapabilities> {
  const response = await fetch(WMTS_CAPABILITIES_URL, { signal });
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
      return {
        identifier,
        title: asString(record['Title']) || identifier,
        abstract: asString(record['Abstract']),
      };
    }
  }
  return null;
}
