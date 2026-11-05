import { describe, expect, it } from 'vitest';
import { SOLS_DATASETS } from '../data/solsLayers';
import type { SolsDataset } from '../data/solsLayersSchema';
import {
  buildCatalogData,
  catalogLayerKey,
  catalogServiceType,
  findCatalogOverlay,
} from './catalogConfig';

const dataset = (
  id: string,
  layers: SolsDataset['layers'],
  extra: Partial<SolsDataset> = {},
): SolsDataset => ({
  id,
  title: `Titre ${id}`,
  abstract: `Résumé ${id}`,
  organisation: 'INRAE - Info&Sols',
  layers,
  rejected: [],
  ...extra,
});
const layer = (service: SolsDataset['layers'][number]['service'], name: string) => ({
  service,
  name,
  title: name,
  endpoint: `https://data.geopf.fr/${service}`,
});

describe('buildCatalogData', () => {
  it('décrit une entrée par fiche : couche préférée, titre, résumé, producteur, vignette, lien de la fiche', () => {
    const data = buildCatalogData([
      dataset('a', [layer('wms-vector', 'a_wmsv'), layer('wmts', 'A_WMTS')], {
        thumbnail: 'https://data.geopf.fr/annexes/gissol-osf/thumbnail/a.png',
      }),
      dataset('b', [layer('tms', 'b_tms')]),
      dataset('c', [layer('wms-raster', 'c_wmsr')]),
    ]);
    expect(Object.keys(data.layers)).toEqual([
      'A_WMTS$GEOPORTAIL:OGC:WMTS',
      'c_wmsr$GEOPORTAIL:OGC:WMS',
    ]);
    expect(data.layers['A_WMTS$GEOPORTAIL:OGC:WMTS']).toEqual({
      name: 'A_WMTS',
      title: 'Titre a',
      description: 'Résumé a',
      producer: ['INRAE - Info&Sols'],
      thumbnail: 'https://data.geopf.fr/annexes/gissol-osf/thumbnail/a.png',
      serviceParams: { id: 'OGC:WMTS' },
      metadata_urls: ['/rechercher-une-donnee/dataset/a'],
    });
    expect(data.layers['c_wmsr$GEOPORTAIL:OGC:WMS']).not.toHaveProperty('thumbnail');
  });

  it('couvre les sept fiches réelles, toutes affichables, avec leur vignette', () => {
    const data = buildCatalogData(SOLS_DATASETS);
    expect(Object.keys(data.layers)).toHaveLength(SOLS_DATASETS.length);
    expect(
      Object.values(data.layers).every((entry) => entry.thumbnail?.startsWith('https://')),
    ).toBe(true);
    expect(data.layers['stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS']?.title).toMatch(
      /stocks de carbone/,
    );
  });
});

describe('catalogServiceType et catalogLayerKey', () => {
  it('ne reconnaît que les services dessinés', () => {
    expect(catalogServiceType('wmts')).toBe('WMTS');
    expect(catalogServiceType('wms-raster')).toBe('WMS');
    expect(catalogServiceType('wms-vector')).toBe('WMS');
    expect(catalogServiceType('tms')).toBeNull();
    expect(catalogServiceType('wfs')).toBeNull();
    expect(catalogLayerKey('x', 'WMS')).toBe('x$GEOPORTAIL:OGC:WMS');
  });
});

describe('findCatalogOverlay', () => {
  it('retrouve la couche d’un évènement du catalogue (nom + service) et ignore les inconnues', () => {
    const overlay = findCatalogOverlay(SOLS_DATASETS, 'stock_carbone_fao_fr_wmsv', 'WMS');
    expect(overlay).toMatchObject({
      key: 'wms-vector:stock_carbone_fao_fr_wmsv',
      service: 'wms-vector',
      endpoint: 'https://data.geopf.fr/wms-v/ows',
    });
    expect(overlay?.legendUrl).toBeDefined();
    expect(findCatalogOverlay(SOLS_DATASETS, 'stock_carbone_fao_fr_wmsv', 'WMTS')).toBeNull();
    expect(findCatalogOverlay(SOLS_DATASETS, 'inconnue', 'WMS')).toBeNull();
  });
});
