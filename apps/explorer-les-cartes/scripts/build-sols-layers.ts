/**
 * Regenerates src/data/sols-layers.json from the GIS Sol CSW and the GPF capabilities.
 * Usage (apps/explorer-les-cartes): bun run build:sols-layers
 * Nothing about the records is hardcoded: every value comes from the CSW, every layer name is checked
 * against the capabilities of its service (see doc/agents/geopf-ext.md §6).
 */
import { DOMParser } from '@xmldom/xmldom';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  exceptionReportText,
  indexTmsTileMaps,
  indexWfsFeatureTypes,
  indexWmsLayers,
  indexWmtsLayers,
  type CapabilitiesIndex,
  type XmlDocument,
} from '../src/data/capabilitiesIndex';
import type { SolsService } from '../src/data/solsLayersSchema';
import { buildCapabilitiesUrl, GPF_ENDPOINTS, SOLS_CSW_GETRECORDS_URL } from '../src/config/urls';
import { parseCswRecords } from './sols-layers/csw';
import {
  assertCompleteInputs,
  buildSolsLayersFile,
  summarise,
  type CapabilitiesByService,
  type EndpointsByService,
} from './sols-layers/validate';

const OUTPUT = join(import.meta.dir, '..', 'src', 'data', 'sols-layers.json');

const ENDPOINTS: EndpointsByService = {
  wmts: GPF_ENDPOINTS.wmts,
  'wms-raster': GPF_ENDPOINTS.wmsRaster,
  'wms-vector': GPF_ENDPOINTS.wmsVector,
  wfs: GPF_ENDPOINTS.wfs,
  tms: GPF_ENDPOINTS.tms,
};

const CAPABILITIES: Record<
  SolsService,
  { url: string; index: (doc: XmlDocument) => CapabilitiesIndex }
> = {
  wmts: { url: buildCapabilitiesUrl(GPF_ENDPOINTS.wmts, 'WMTS', '1.0.0'), index: indexWmtsLayers },
  'wms-raster': {
    url: buildCapabilitiesUrl(GPF_ENDPOINTS.wmsRaster, 'WMS', '1.3.0'),
    index: indexWmsLayers,
  },
  'wms-vector': {
    url: buildCapabilitiesUrl(GPF_ENDPOINTS.wmsVector, 'WMS', '1.3.0'),
    index: indexWmsLayers,
  },
  wfs: {
    url: buildCapabilitiesUrl(GPF_ENDPOINTS.wfs, 'WFS', '2.0.0'),
    index: indexWfsFeatureTypes,
  },
  // The TMS service root is a TileMapService document listing every published tile map.
  tms: { url: GPF_ENDPOINTS.tms, index: indexTmsTileMaps },
};

/** Per-request timeout: the WMTS capabilities weigh about 3 MB. */
const FETCH_TIMEOUT_MS = 60_000;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  return response.text();
}

/** Parses a capabilities document; an OGC exception body (sent with HTTP 200) is an error. */
function parseCapabilities(xml: string, url: string): XmlDocument {
  const doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as XmlDocument;
  const exception = exceptionReportText(doc);
  if (exception) throw new Error(`Exception OGC pour ${url} : ${exception}`);
  return doc;
}

const records = parseCswRecords(await fetchText(SOLS_CSW_GETRECORDS_URL));
const entries = await Promise.all(
  Object.entries(CAPABILITIES).map(async ([service, { url, index }]) => {
    const capabilities = index(parseCapabilities(await fetchText(url), url));
    process.stdout.write(`${service} : ${capabilities.size} noms publiés (${url})\n`);
    return [service, capabilities] as const;
  }),
);
const capabilitiesByService = Object.fromEntries(entries) as CapabilitiesByService;
// Nothing is written unless every input is complete: never a partial sols-layers.json.
assertCompleteInputs(records, capabilitiesByService);
const file = buildSolsLayersFile(
  records,
  capabilitiesByService,
  ENDPOINTS,
  SOLS_CSW_GETRECORDS_URL,
);
await writeFile(OUTPUT, `${JSON.stringify(file, null, 2)}\n`);
process.stdout.write(`${summarise(file)}\nÉcrit : ${OUTPUT}\n`);
