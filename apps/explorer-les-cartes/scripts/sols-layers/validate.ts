import type { CapabilitiesIndex } from '../../src/data/capabilitiesIndex';
import {
  normaliseSolsLayersFile,
  SOLS_LAYERS_SCHEMA_VERSION,
  type SolsDataset,
  type SolsLayer,
  type SolsLayersFile,
  type SolsRejectedLayer,
  type SolsService,
} from '../../src/data/solsLayersSchema';
import type { CswLink, CswRecord } from './csw';

/** Protocols of the CSW links that describe a map service. */
export const SERVICE_PROTOCOLS = ['OGC:WMS', 'OGC:WMTS', 'OGC:WFS', 'TMS'] as const;

const SERVICE_LABELS: Record<SolsService, string> = {
  wmts: 'WMTS',
  'wms-raster': 'WMS raster (wms-r)',
  'wms-vector': 'WMS vecteur (wms-v)',
  wfs: 'WFS',
  tms: 'TMS',
};

/** The other WMS flavour, checked only to explain a rejection (the CSW endpoint is never corrected). */
const OTHER_FLAVOUR: Partial<Record<SolsService, SolsService>> = {
  'wms-raster': 'wms-vector',
  'wms-vector': 'wms-raster',
};

/** Maps a CSW link to the GPF service that must publish it, or null when the endpoint is not recognised. */
export function serviceForLink(link: Pick<CswLink, 'protocol' | 'linkage'>): SolsService | null {
  const path = (() => {
    try {
      return new URL(link.linkage).pathname;
    } catch {
      return '';
    }
  })();
  switch (link.protocol) {
    case 'OGC:WMS':
      if (path.startsWith('/wms-r')) return 'wms-raster';
      if (path.startsWith('/wms-v')) return 'wms-vector';
      return null;
    case 'OGC:WMTS':
      return path.startsWith('/wmts') ? 'wmts' : null;
    case 'OGC:WFS':
      return path.startsWith('/wfs') ? 'wfs' : null;
    case 'TMS':
      return path.startsWith('/tms') ? 'tms' : null;
    default:
      return null;
  }
}

export type CapabilitiesByService = Record<SolsService, CapabilitiesIndex>;
export type EndpointsByService = Record<SolsService, string>;

/**
 * Keeps the service links of each record whose name is published in the capabilities of its service;
 * the others go to `rejected` with a reason. Pure and deterministic.
 */
export function buildSolsLayersFile(
  records: readonly CswRecord[],
  capabilities: CapabilitiesByService,
  endpoints: EndpointsByService,
  source: string,
): SolsLayersFile {
  const datasets: SolsDataset[] = records.map((record) => {
    const layers: SolsLayer[] = [];
    const rejected: SolsRejectedLayer[] = [];
    const seen = new Set<string>();
    for (const link of record.links) {
      if (!(SERVICE_PROTOCOLS as readonly string[]).includes(link.protocol) || !link.name) continue;
      const service = serviceForLink(link);
      const dedupKey = `${service ?? link.protocol}|${link.name}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      if (!service) {
        rejected.push({
          protocol: link.protocol,
          name: link.name,
          linkage: link.linkage,
          reason: 'point d’accès non reconnu',
        });
        continue;
      }
      const entry = capabilities[service].get(link.name);
      if (!entry) {
        const other = OTHER_FLAVOUR[service];
        const hint =
          other && capabilities[other].has(link.name)
            ? ` ; publié sur ${SERVICE_LABELS[other]}`
            : '';
        rejected.push({
          protocol: link.protocol,
          name: link.name,
          linkage: link.linkage,
          reason: `absent des capacités ${SERVICE_LABELS[service]}${hint}`,
        });
        continue;
      }
      layers.push({
        service,
        name: link.name,
        title: entry.title,
        endpoint: endpoints[service],
        ...(entry.crs ? { crs: entry.crs } : {}),
        ...(entry.legendUrl ? { legendUrl: entry.legendUrl } : {}),
      });
    }
    return {
      id: record.id,
      title: record.title,
      abstract: record.abstract,
      organisation: record.organisation,
      ...(record.thumbnail ? { thumbnail: record.thumbnail } : {}),
      layers,
      rejected,
    };
  });
  return normaliseSolsLayersFile({ schemaVersion: SOLS_LAYERS_SCHEMA_VERSION, source, datasets });
}

/**
 * Refuses inputs that would produce a partial file: no record, a record without identifier or title,
 * or a service whose capabilities list no name (failed or truncated response). Throws with the reasons.
 */
export function assertCompleteInputs(
  records: readonly CswRecord[],
  capabilities: CapabilitiesByService,
): void {
  const problems: string[] = [];
  if (records.length === 0) problems.push('le CSW ne renvoie aucune fiche');
  records.forEach((record, index) => {
    if (!record.id) problems.push(`la fiche n° ${index + 1} n’a pas d’identifiant`);
    if (!record.title) problems.push(`la fiche ${record.id || `n° ${index + 1}`} n’a pas de titre`);
  });
  for (const [service, index] of Object.entries(capabilities)) {
    if (index.size === 0) problems.push(`les capacités ${service} ne listent aucune couche`);
  }
  if (problems.length > 0) {
    throw new Error(`Fichier non écrit : ${problems.join(' ; ')}.`);
  }
}

/** One line per dataset, then the rejected names. */
export function summarise(file: SolsLayersFile): string {
  const lines = [`${file.datasets.length} fiches`];
  for (const dataset of file.datasets) {
    lines.push(
      `- ${dataset.title} : ${dataset.layers.length} couche(s) validée(s), ${dataset.rejected.length} rejetée(s)`,
    );
  }
  const rejected = file.datasets.flatMap((d) => d.rejected);
  lines.push(`Rejets (${rejected.length}) :`);
  for (const r of rejected) lines.push(`  ✗ ${r.protocol} ${r.name} (${r.reason})`);
  return lines.join('\n');
}
