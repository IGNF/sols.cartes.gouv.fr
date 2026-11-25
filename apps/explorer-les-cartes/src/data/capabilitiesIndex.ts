/**
 * Minimal readers of GPF capabilities documents, returning the published names and titles.
 * They take a DOM Document, so they work with the browser DOMParser and with @xmldom/xmldom (build script).
 */

export interface CapabilitiesEntry {
  title: string;
  /** WMTS only: CRS of the linked tile matrix sets. */
  crs?: string[];
  /** First legend image published for the layer (WMS and WMTS `LegendURL`), shown by the Legends control. */
  legendUrl?: string;
}

/** Published name → entry. */
export type CapabilitiesIndex = Map<string, CapabilitiesEntry>;

/** Element-like subset shared by the browser DOM and @xmldom/xmldom. */
interface XmlElement {
  localName: string | null;
  textContent: string | null;
  childNodes: ArrayLike<unknown>;
  getAttribute(name: string): string | null;
  getElementsByTagName(name: string): ArrayLike<XmlElement>;
}

export interface XmlDocument {
  getElementsByTagName(name: string): ArrayLike<XmlElement>;
  documentElement?: XmlElement | null;
}

/** Root element names of the OGC exception documents the GPF returns with HTTP 200. */
const EXCEPTION_ROOTS = ['ExceptionReport', 'ServiceExceptionReport'];

/**
 * Text of an OGC exception document (`ows:ExceptionReport`, `ServiceExceptionReport`), or null when
 * the document is not one. The GPF answers some failures with such a body and HTTP 200.
 */
export function exceptionReportText(doc: XmlDocument): string | null {
  const root = doc.documentElement;
  if (!root || !EXCEPTION_ROOTS.includes(root.localName ?? '')) return null;
  return (root.textContent ?? '').replace(/\s+/g, ' ').trim() || (root.localName ?? 'exception');
}

function isElement(node: unknown): node is XmlElement {
  return (
    typeof node === 'object' && node !== null && (node as { nodeType?: number }).nodeType === 1
  );
}

function children(element: XmlElement, localName: string): XmlElement[] {
  return Array.from(element.childNodes).filter(
    (node): node is XmlElement => isElement(node) && node.localName === localName,
  );
}

function childText(element: XmlElement, localName: string): string {
  return children(element, localName)[0]?.textContent?.trim() ?? '';
}

function all(doc: XmlDocument | XmlElement, localName: string): XmlElement[] {
  // '*' + localName filter: tolerant to namespace prefixes (wms:, ows:, wfs:...).
  return Array.from(doc.getElementsByTagName('*')).filter((el) => el.localName === localName);
}

/** `xlink:href` of an element (qualified name, as both DOM implementations expose it). */
function href(element: XmlElement): string {
  return (element.getAttribute('xlink:href') ?? element.getAttribute('href') ?? '').trim();
}

/**
 * First legend image of a layer: WMS `Style/LegendURL/OnlineResource@xlink:href`,
 * WMTS `Style/LegendURL@xlink:href`. Only the layer's own styles are read (not a nested layer's).
 */
function legendUrl(layer: XmlElement): string | undefined {
  for (const style of children(layer, 'Style')) {
    for (const legend of children(style, 'LegendURL')) {
      const url = href(legend) || children(legend, 'OnlineResource').map(href).find(Boolean) || '';
      if (url) return url;
    }
  }
  return undefined;
}

/** WMS 1.3.0: every named <Layer>. */
export function indexWmsLayers(doc: XmlDocument): CapabilitiesIndex {
  const index: CapabilitiesIndex = new Map();
  for (const layer of all(doc, 'Layer')) {
    const name = childText(layer, 'Name');
    if (!name) continue;
    const legend = legendUrl(layer);
    index.set(name, {
      title: childText(layer, 'Title') || name,
      ...(legend ? { legendUrl: legend } : {}),
    });
  }
  return index;
}

/** WMTS 1.0.0: Contents/Layer identifiers, with the CRS of their tile matrix sets. */
export function indexWmtsLayers(doc: XmlDocument): CapabilitiesIndex {
  const index: CapabilitiesIndex = new Map();
  const contents = all(doc, 'Contents')[0];
  if (!contents) return index;
  const setCrs = new Map<string, string>();
  for (const set of children(contents, 'TileMatrixSet')) {
    setCrs.set(childText(set, 'Identifier'), childText(set, 'SupportedCRS'));
  }
  for (const layer of children(contents, 'Layer')) {
    const name = childText(layer, 'Identifier');
    if (!name) continue;
    const crs = children(layer, 'TileMatrixSetLink')
      .map((link) => setCrs.get(childText(link, 'TileMatrixSet')) ?? '')
      .filter(Boolean);
    const legend = legendUrl(layer);
    index.set(name, {
      title: childText(layer, 'Title') || name,
      crs: [...new Set(crs)].sort(),
      ...(legend ? { legendUrl: legend } : {}),
    });
  }
  return index;
}

/** WFS 2.0.0: FeatureTypeList/FeatureType names. */
export function indexWfsFeatureTypes(doc: XmlDocument): CapabilitiesIndex {
  const index: CapabilitiesIndex = new Map();
  for (const type of all(doc, 'FeatureType')) {
    const name = childText(type, 'Name');
    if (name) index.set(name, { title: childText(type, 'Title') || name });
  }
  return index;
}

/** TMS 1.0.0 TileMapService: TileMap entries, named by the last segment of their href. */
export function indexTmsTileMaps(doc: XmlDocument): CapabilitiesIndex {
  const index: CapabilitiesIndex = new Map();
  for (const tileMap of all(doc, 'TileMap')) {
    const href = tileMap.getAttribute('href') ?? '';
    const name = href.replace(/\/+$/, '').split('/').pop() ?? '';
    if (name) index.set(name, { title: tileMap.getAttribute('title') || name });
  }
  return index;
}
