import type BaseLayer from 'ol/layer/Base';

/** Descriptive data of a layer shown by the geopf-extensions LayerSwitcher and Legends controls. */
export interface LayerInfo {
  /** Published name (WMS/WMTS identifier): also the id of the legend entry. */
  name: string;
  title: string;
  description?: string;
  /** Legend image (capabilities `LegendURL`, or a GetLegendGraphic request). */
  legendUrl?: string;
}

/** A legend as `Legends.getMetaInformations` returns it for a geopf layer. */
export interface LegendEntry {
  url: string;
  format: string;
  minScaleDenominator: number;
}

/** The interface the Legends control reads on a layer (`Legends.js`, `getMetaInformations`). */
export interface LegendCapableLayer {
  name: string;
  getTitle(): string;
  getDescription(): string;
  getLegends(): LegendEntry[];
  getMetadata(): unknown[];
  getQuicklookUrl(): string;
  getOriginators(): unknown[];
}

function legendFormat(url: string): string {
  return /\.jpe?g(\?|$)/i.test(url) ? 'image/jpeg' : 'image/png';
}

/**
 * Gives a standard OpenLayers layer what the geopf-extensions controls expect from their own layer classes
 * (`LayerWMTS`, `LayerWMS`, built from `Gp.Config`, which this app does not load): the `title` and
 * `description` properties read by the LayerSwitcher, and the own `name` property plus the getters the
 * Legends control calls (`getMetaInformations` ignores any layer without an own `name`).
 * Returns the layer, for chaining.
 */
export function attachLayerInfo<T extends BaseLayer>(
  layer: T,
  info: LayerInfo,
): T & LegendCapableLayer {
  layer.set('name', info.name);
  layer.set('title', info.title);
  layer.set('description', info.description ?? '');
  const legends: LegendEntry[] = info.legendUrl
    ? [{ url: info.legendUrl, format: legendFormat(info.legendUrl), minScaleDenominator: 0 }]
    : [];
  const capable: LegendCapableLayer = {
    name: info.name,
    getTitle: () => info.title,
    getDescription: () => info.description ?? '',
    getLegends: () => legends,
    getMetadata: () => [],
    getQuicklookUrl: () => '',
    getOriginators: () => [],
  };
  return Object.assign(layer, capable);
}
