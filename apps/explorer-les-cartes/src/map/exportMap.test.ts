import TileLayer from 'ol/layer/Tile';
import type OlMap from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import { describe, expect, it, vi } from 'vitest';
import { downloadDataUrl, exportMapImage, fileSlug, mapSources } from './exportMap';

describe('fileSlug', () => {
  it('fabrique un nom de fichier sans accent ni espace', () => {
    expect(fileSlug('Carte des sols : Loiret (2026)')).toBe('carte-des-sols-loiret-2026');
    expect(fileSlug('Épaisseur d’humus')).toBe('epaisseur-d-humus');
    expect(fileSlug('   ')).toBe('carte');
  });
});

describe('mapSources', () => {
  it('liste les attributions des couches visibles, en texte brut et sans doublon', () => {
    const attributed = (html: string, visible = true) =>
      new TileLayer({ source: new XYZ({ attributions: html }), visible });
    const map = {
      getAllLayers: () => [
        attributed('<a href="https://cartes.gouv.fr">IGN – Géoplateforme</a>'),
        attributed('<a href="https://cartes.gouv.fr">IGN – Géoplateforme</a>'),
        attributed('GIS Sol – INRAE'),
        attributed('Invisible', false),
        new TileLayer({ source: new XYZ() }),
      ],
    } as unknown as OlMap;
    expect(mapSources(map)).toEqual(['IGN – Géoplateforme', 'GIS Sol – INRAE']);
  });
});

describe('downloadDataUrl', () => {
  it('déclenche un téléchargement par un lien temporaire', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadDataUrl('data:image/png;base64,AAAA', 'carte.png');
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    click.mockRestore();
  });
});

describe('exportMapImage', () => {
  it('rejette une carte sans fenêtre ou sans taille', async () => {
    const noViewport = {
      getViewport: () => undefined,
      once: vi.fn(),
      renderSync: vi.fn(),
    } as unknown as OlMap;
    await expect(exportMapImage(noViewport)).rejects.toThrow('affichée');
    const noSize = {
      getViewport: () => document.createElement('div'),
      getSize: () => undefined,
      once: (_event: string, listener: () => void) => listener(),
      renderSync: vi.fn(),
    } as unknown as OlMap;
    await expect(exportMapImage(noSize)).rejects.toThrow('taille');
  });
});
