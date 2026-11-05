import solsLayersJson from './sols-layers.json';
import {
  isSolsLayersFile,
  solsLayerKey,
  type SolsDataset,
  type SolsLayer,
  type SolsService,
} from './solsLayersSchema';

if (!isSolsLayersFile(solsLayersJson)) {
  throw new Error(
    'src/data/sols-layers.json ne respecte pas le schéma : relancer bun run build:sols-layers',
  );
}

/** The GIS Sol datasets, generated from the CSW and validated against the GPF capabilities. */
export const SOLS_DATASETS: readonly SolsDataset[] = solsLayersJson.datasets;

/** Finds a validated layer by service and name. */
export function findSolsLayer(
  service: SolsService,
  name: string,
): { dataset: SolsDataset; layer: SolsLayer } | null {
  const key = solsLayerKey({ service, name });
  for (const dataset of SOLS_DATASETS) {
    const layer = dataset.layers.find((l) => solsLayerKey(l) === key);
    if (layer) return { dataset, layer };
  }
  return null;
}
