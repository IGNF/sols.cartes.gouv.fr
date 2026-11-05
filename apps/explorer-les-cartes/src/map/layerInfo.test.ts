import TileLayer from 'ol/layer/Tile';
import { describe, expect, it } from 'vitest';
import { attachLayerInfo } from './layerInfo';

describe('attachLayerInfo', () => {
  it('expose titre et description au gestionnaire de couches (propriétés OL)', () => {
    const layer = attachLayerInfo(new TileLayer(), {
      name: 'INRAE_CARTE-SOLS',
      title: 'Carte des sols',
      description: 'Sols dominants',
    });
    expect(layer.get('name')).toBe('INRAE_CARTE-SOLS');
    expect(layer.get('title')).toBe('Carte des sols');
    expect(layer.get('description')).toBe('Sols dominants');
  });

  it('donne à la couche l’interface attendue par le contrôle Legends (propriété name propre + accesseurs)', () => {
    const layer = attachLayerInfo(new TileLayer(), {
      name: 'x',
      title: 'X',
      legendUrl: 'https://data.geopf.fr/annexes/gissol-osf/legendes/INRAE_CARTE-SOLS.png',
    });
    // Legends.getMetaInformations only reads layers with an own `name` property.
    expect(Object.prototype.hasOwnProperty.call(layer, 'name')).toBe(true);
    expect(layer.name).toBe('x');
    expect(layer.getTitle()).toBe('X');
    expect(layer.getDescription()).toBe('');
    expect(layer.getLegends()).toEqual([
      {
        url: 'https://data.geopf.fr/annexes/gissol-osf/legendes/INRAE_CARTE-SOLS.png',
        format: 'image/png',
        minScaleDenominator: 0,
      },
    ]);
    expect(layer.getMetadata()).toEqual([]);
    expect(layer.getQuicklookUrl()).toBe('');
    expect(layer.getOriginators()).toEqual([]);
  });

  it('déduit le format JPEG de l’extension et ne liste aucune légende sans adresse', () => {
    const jpeg = attachLayerInfo(new TileLayer(), {
      name: 'a',
      title: 'A',
      legendUrl: 'https://data.geopf.fr/annexes/ressources/legendes/LEGEND.jpg',
    });
    expect(jpeg.getLegends()[0]?.format).toBe('image/jpeg');
    expect(attachLayerInfo(new TileLayer(), { name: 'b', title: 'B' }).getLegends()).toEqual([]);
  });
});
