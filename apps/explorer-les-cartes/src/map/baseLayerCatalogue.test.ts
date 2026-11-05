import { describe, expect, it } from 'vitest';
import { BASE_LAYER_CANDIDATES } from '../config/map';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { availableBaseLayers, resolveActiveBaseLayer } from './baseLayerCatalogue';
import { parseWmtsCapabilities } from './wmtsCapabilities';

const capabilities = parseWmtsCapabilities(capabilitiesXml);

describe('availableBaseLayers', () => {
  it('ne garde que les fonds publiés, dans l’ordre des candidats, avec le titre des capacités', () => {
    // The fixture publishes Plan IGN, orthophotos and relief only.
    expect(availableBaseLayers(capabilities)).toEqual([
      { id: 'plan-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', title: 'Plan IGN' },
      {
        id: 'orthophotos',
        layerName: 'ORTHOIMAGERY.ORTHOPHOTOS',
        title: 'Photographies aériennes',
      },
      { id: 'relief', layerName: 'ELEVATION.SLOPES', title: 'Relief du terrain (MNT BD ALTI®)' },
    ]);
  });

  it('écarte silencieusement un candidat absent', () => {
    const ids = availableBaseLayers(capabilities).map((layer) => layer.id);
    expect(BASE_LAYER_CANDIDATES.map((c) => c.id)).toContain('cartes-ign');
    expect(ids).not.toContain('cartes-ign');
  });

  it('renvoie une liste vide sans couche publiée', () => {
    expect(availableBaseLayers({ Contents: { Layer: [] } })).toEqual([]);
  });
});

describe('resolveActiveBaseLayer', () => {
  const layers = availableBaseLayers(capabilities);

  it('renvoie le fond choisi quand il est disponible', () => {
    expect(resolveActiveBaseLayer(layers, 'orthophotos')?.id).toBe('orthophotos');
  });

  it('se replie sur le premier fond disponible', () => {
    expect(resolveActiveBaseLayer(layers, 'etat-major')?.id).toBe('plan-ign');
  });

  it('renvoie undefined sans fond disponible', () => {
    expect(resolveActiveBaseLayer([], 'plan-ign')).toBeUndefined();
  });
});
