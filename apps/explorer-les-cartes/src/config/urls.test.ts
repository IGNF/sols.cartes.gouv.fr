import { describe, expect, it } from 'vitest';
import { catalogueRecordPath, isListView, LIST_VIEW_PATH } from './urls';

describe('urls', () => {
  it('construit l’adresse d’une fiche du catalogue', () => {
    expect(catalogueRecordPath('osf63e6c177-455e')).toBe(
      '/rechercher-une-donnee/dataset/osf63e6c177-455e',
    );
  });

  it('reconnaît la vue liste', () => {
    expect(LIST_VIEW_PATH).toBe('/explorer-les-cartes/?vue=liste');
    expect(isListView('?vue=liste')).toBe(true);
    expect(isListView('?vue=carte')).toBe(false);
    expect(isListView('')).toBe(false);
  });
});
