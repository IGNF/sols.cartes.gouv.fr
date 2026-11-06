import { describe, expect, it } from 'vitest';
import type { CapabilitiesIndex } from '../../src/data/capabilitiesIndex';
import { isSolsLayersFile } from '../../src/data/solsLayersSchema';
import type { CswRecord } from './csw';
import {
  assertCompleteInputs,
  buildSolsLayersFile,
  serviceForLink,
  summarise,
  type CapabilitiesByService,
} from './validate';

const index = (entries: Array<[string, string, string[]?, string?]>): CapabilitiesIndex =>
  new Map(
    entries.map(([name, title, crs, legendUrl]) => [
      name,
      { title, ...(crs ? { crs } : {}), ...(legendUrl ? { legendUrl } : {}) },
    ]),
  );

const capabilities: CapabilitiesByService = {
  wmts: index([['COUCHE_WMTS', 'Couche WMTS', ['EPSG:2154']]]),
  'wms-raster': index([['COUCHE_R', 'Couche raster', undefined, 'https://data.geopf.fr/l.png']]),
  'wms-vector': index([['couche_v', 'Couche vecteur']]),
  wfs: index([['espace:type_publie', 'Type publié']]),
  tms: index([['couche_tms', 'Couche TMS']]),
};

const endpoints = {
  wmts: 'https://data.geopf.fr/wmts',
  'wms-raster': 'https://data.geopf.fr/wms-r/wms',
  'wms-vector': 'https://data.geopf.fr/wms-v/ows',
  wfs: 'https://data.geopf.fr/wfs/ows',
  tms: 'https://data.geopf.fr/tms/1.0.0',
};

const link = (protocol: string, linkage: string, name: string) => ({
  protocol,
  linkage,
  name,
  description: '',
});

const record = (
  id: string,
  title: string,
  links: CswRecord['links'],
  thumbnail = '',
): CswRecord => ({
  id,
  title,
  abstract: 'Résumé',
  organisation: 'INRAE - Info&Sols',
  thumbnail,
  links,
});

describe('serviceForLink', () => {
  it('distingue WMS raster et vecteur par le chemin du point d’accès', () => {
    expect(serviceForLink(link('OGC:WMS', 'https://data.geopf.fr/wms-r/wms', 'x'))).toBe(
      'wms-raster',
    );
    expect(serviceForLink(link('OGC:WMS', 'https://data.geopf.fr/wms-v', 'x'))).toBe('wms-vector');
    expect(serviceForLink(link('OGC:WMTS', 'https://data.geopf.fr/wmts', 'x'))).toBe('wmts');
    expect(serviceForLink(link('OGC:WFS', 'https://data.geopf.fr/wfs', 'x'))).toBe('wfs');
    expect(serviceForLink(link('TMS', 'https://data.geopf.fr/tms/1.0.0', 'x'))).toBe('tms');
  });

  it('ne reconnaît pas un point d’accès inattendu', () => {
    expect(serviceForLink(link('OGC:WMS', 'https://exemple.fr/wms', 'x'))).toBeNull();
    expect(serviceForLink(link('OGC:WMS', 'pas une url', 'x'))).toBeNull();
  });
});

describe('buildSolsLayersFile', () => {
  const file = buildSolsLayersFile(
    [
      record(
        'b',
        'Zèbre',
        [link('OGC:WMS', 'https://data.geopf.fr/wms-v', 'couche_v')],
        'https://data.geopf.fr/annexes/gissol-osf/thumbnail/b.png',
      ),
      record(
        'c',
        'Chouette',
        [link('OGC:WMS', 'https://data.geopf.fr/wms-r/wms', 'COUCHE_R')],
        'http://data.geopf.fr/annexes/non-https.png',
      ),
      record(
        'd',
        'Dauphin',
        [link('OGC:WMS', 'https://data.geopf.fr/wms-r/wms', 'COUCHE_R')],
        'https://exemple.org/ailleurs.png',
      ),
      record('a', 'Abeille', [
        link('OGC:WMS', 'https://data.geopf.fr/wms-r/wms', 'COUCHE_R'),
        link('OGC:WMTS', 'https://data.geopf.fr/wmts', 'COUCHE_WMTS'),
        link('OGC:WMTS', 'https://data.geopf.fr/wmts', 'COUCHE_WMTS'),
        link('OGC:WMTS', 'https://data.geopf.fr/wmts', 'COUCHE_WMTS_INEXISTANTE'),
        link('OGC:WMS', 'https://data.geopf.fr/wms-v', 'COUCHE_R'),
        link('OGC:WFS', 'https://data.geopf.fr/wfs', 'espace:nom_court'),
        link('TMS', 'https://data.geopf.fr/tms/1.0.0', 'couche_tms'),
        link('', 'https://data.geopf.fr/annexes/style.json', 'style'),
      ]),
    ],
    capabilities,
    endpoints,
    'https://data.geopf.fr/csw/gissol-osf_c?REQUEST=GetRecords',
  );
  const abeille = file.datasets[0];

  it('produit un fichier conforme au schéma, fiches triées par titre, vignette https d’un hôte de confiance seulement', () => {
    expect(isSolsLayersFile(file)).toBe(true);
    expect(file.datasets.map((d) => d.title)).toEqual(['Abeille', 'Chouette', 'Dauphin', 'Zèbre']);
    expect(file.datasets[3]?.thumbnail).toBe(
      'https://data.geopf.fr/annexes/gissol-osf/thumbnail/b.png',
    );
    expect(file.datasets[0]).not.toHaveProperty('thumbnail');
    // http, or another host: dropped (the map catalogue shows these images).
    expect(file.datasets[1]).not.toHaveProperty('thumbnail');
    expect(file.datasets[2]).not.toHaveProperty('thumbnail');
  });

  it('garde les couches publiées avec titre, point d’accès canonique, CRS WMTS et légende, sans doublon', () => {
    expect(abeille?.layers).toEqual([
      {
        service: 'wmts',
        name: 'COUCHE_WMTS',
        title: 'Couche WMTS',
        endpoint: endpoints.wmts,
        crs: ['EPSG:2154'],
      },
      {
        service: 'wms-raster',
        name: 'COUCHE_R',
        title: 'Couche raster',
        endpoint: endpoints['wms-raster'],
        legendUrl: 'https://data.geopf.fr/l.png',
      },
      { service: 'tms', name: 'couche_tms', title: 'Couche TMS', endpoint: endpoints.tms },
    ]);
  });

  it('rejette les noms absents des capacités avec un motif, et ignore les liens non cartographiques', () => {
    expect(abeille?.rejected).toEqual([
      {
        protocol: 'OGC:WFS',
        name: 'espace:nom_court',
        linkage: 'https://data.geopf.fr/wfs',
        reason: 'absent des capacités WFS',
      },
      {
        protocol: 'OGC:WMS',
        name: 'COUCHE_R',
        linkage: 'https://data.geopf.fr/wms-v',
        reason: 'absent des capacités WMS vecteur (wms-v) ; publié sur WMS raster (wms-r)',
      },
      {
        protocol: 'OGC:WMTS',
        name: 'COUCHE_WMTS_INEXISTANTE',
        linkage: 'https://data.geopf.fr/wmts',
        reason: 'absent des capacités WMTS',
      },
    ]);
  });

  it('résume les fiches et les rejets', () => {
    const text = summarise(file);
    expect(text).toContain('4 fiches');
    expect(text).toContain('✗ OGC:WMTS COUCHE_WMTS_INEXISTANTE (absent des capacités WMTS)');
  });
});

describe('assertCompleteInputs (jamais de fichier partiel)', () => {
  const complete = [record('a', 'Abeille', [])];

  it('accepte des fiches complètes et des capacités non vides', () => {
    expect(() => assertCompleteInputs(complete, capabilities)).not.toThrow();
  });

  it('refuse un CSW sans fiche', () => {
    expect(() => assertCompleteInputs([], capabilities)).toThrow(/aucune fiche/);
  });

  it('refuse une fiche sans identifiant ou sans titre', () => {
    expect(() => assertCompleteInputs([record('', 'Sans identifiant', [])], capabilities)).toThrow(
      /n° 1 n’a pas d’identifiant/,
    );
    expect(() => assertCompleteInputs([record('id-1', '', [])], capabilities)).toThrow(
      /la fiche id-1 n’a pas de titre/,
    );
  });

  it('refuse des capacités vides (exception ou réponse tronquée)', () => {
    expect(() =>
      assertCompleteInputs(complete, { ...capabilities, 'wms-vector': new Map() }),
    ).toThrow(/les capacités wms-vector ne listent aucune couche/);
  });
});
