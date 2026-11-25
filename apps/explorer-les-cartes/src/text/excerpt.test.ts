import { describe, expect, it } from 'vitest';
import { excerpt } from './excerpt';

describe('excerpt', () => {
  it('garde un texte court tel quel, espaces normalisés', () => {
    expect(excerpt('  Carte   des sols  ', 50)).toBe('Carte des sols');
  });

  it('coupe sur un mot et ajoute des points de suspension', () => {
    expect(excerpt('Le Référentiel Régional Pédologique du Loiret', 20)).toBe('Le Référentiel…');
  });
});
