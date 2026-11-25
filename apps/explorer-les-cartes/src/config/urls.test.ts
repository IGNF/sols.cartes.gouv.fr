import { describe, expect, it } from 'vitest';
import { BASE_LAYER_CANDIDATES } from './map';
import {
  catalogueRecordPath,
  gpfThumbnailUrl,
  isListView,
  isTrustedImageUrl,
  LIST_VIEW_PATH,
} from './urls';

describe('urls', () => {
  it('construit l’adresse d’une fiche du catalogue', () => {
    expect(catalogueRecordPath('osf63e6c177-455e')).toBe(
      '/rechercher-une-donnee/dataset/osf63e6c177-455e',
    );
  });

  it('construit l’adresse d’une vignette GPF, sur un hôte d’images de confiance (M16)', () => {
    expect(gpfThumbnailUrl('vignette-plan-ign.jpg')).toBe(
      'https://data.geopf.fr/annexes/ressources/metadata/thumbnail/vignette-plan-ign.jpg',
    );
    for (const candidate of BASE_LAYER_CANDIDATES) {
      expect(isTrustedImageUrl(candidate.thumbnail), candidate.id).toBe(true);
    }
  });

  it('reconnaît la vue liste', () => {
    expect(LIST_VIEW_PATH).toBe('/explorer-les-cartes/?vue=liste');
    expect(isListView('?vue=liste')).toBe(true);
    expect(isListView('?vue=carte')).toBe(false);
    expect(isListView('')).toBe(false);
  });
});
