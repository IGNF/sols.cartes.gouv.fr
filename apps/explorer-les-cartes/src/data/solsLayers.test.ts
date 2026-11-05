import { describe, expect, it } from 'vitest';
import { SOLS_CSW_GETRECORDS_URL } from '../config/urls';
import solsLayers from './sols-layers.json';
import { isSolsLayersFile, normaliseSolsLayersFile, solsLayerKey } from './solsLayersSchema';

/**
 * Checks the committed file against the generator contract (schema, ordering, source), without network.
 * Regenerate with `bun run build:sols-layers` if this fails.
 */
describe('sols-layers.json (fichier commité)', () => {
  it('respecte le schéma partagé avec le script', () => {
    expect(isSolsLayersFile(solsLayers)).toBe(true);
  });

  it('provient de la requête CSW configurée', () => {
    expect(solsLayers.source).toBe(SOLS_CSW_GETRECORDS_URL);
  });

  it('est trié comme le script l’écrit', () => {
    if (!isSolsLayersFile(solsLayers)) throw new Error('schéma');
    expect(solsLayers).toEqual(normaliseSolsLayersFile(solsLayers));
  });

  it('n’a pas de couche en double dans une fiche', () => {
    if (!isSolsLayersFile(solsLayers)) throw new Error('schéma');
    for (const dataset of solsLayers.datasets) {
      const keys = dataset.layers.map(solsLayerKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
