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

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  return response.text();
}

const parse = (xml: string) =>
  new DOMParser().parseFromString(xml, 'text/xml') as unknown as XmlDocument;

const records = parseCswRecords(await fetchText(SOLS_CSW_GETRECORDS_URL));
const entries = await Promise.all(
  Object.entries(CAPABILITIES).map(async ([service, { url, index }]) => {
    const capabilities = index(parse(await fetchText(url)));
    process.stdout.write(`${service} : ${capabilities.size} noms publiés (${url})\n`);
    return [service, capabilities] as const;
  }),
);
const file = buildSolsLayersFile(
  records,
  Object.fromEntries(entries) as CapabilitiesByService,
  ENDPOINTS,
  SOLS_CSW_GETRECORDS_URL,
);
await writeFile(OUTPUT, `${JSON.stringify(file, null, 2)}\n`);
process.stdout.write(`${summarise(file)}\nÉcrit : ${OUTPUT}\n`);
