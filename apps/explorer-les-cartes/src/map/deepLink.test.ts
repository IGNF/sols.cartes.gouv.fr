import { describe, expect, it } from 'vitest';
import {
  parseDeepLink,
  parsePermalinkLayers,
  readDeepLink,
  readDeepLinks,
  readPermalinkBaseLayer,
  resolveDeepLink,
} from './deepLink';

describe('parseDeepLink', () => {
  it('lit le lien émis par le catalogue (type en majuscules, layer non encodé, url encodée)', () => {
    expect(
      parseDeepLink(
        '?layer=rrp_loiret_gpkg_11-09-2026_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v',
      ),
    ).toEqual({
      layer: 'rrp_loiret_gpkg_11-09-2026_wmsv',
      type: 'WMS',
      url: 'https://data.geopf.fr/wms-v',
    });
  });

  it('accepte un type en minuscules et un nom encodé deux fois', () => {
    expect(
      parseDeepLink('?layer=INRAE_CARTE%252DSOLS&type=wmts&url=https%3A%2F%2Fdata.geopf.fr%2Fwmts'),
    ).toEqual({
      layer: 'INRAE_CARTE-SOLS',
      type: 'WMTS',
      url: 'https://data.geopf.fr/wmts',
    });
  });

  it('ignore un lien incomplet', () => {
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink('?layer=x&type=WMS')).toBeNull();
  });
});

describe('resolveDeepLink', () => {
  const link = (type: string, url: string, layer = 'couche') => ({ layer, type, url });

  it('reconnaît les deux formes de WMS et le WMTS de la Géoplateforme', () => {
    expect(resolveDeepLink(link('WMS', 'https://data.geopf.fr/wms-v'))).toEqual({
      kind: 'layer',
      service: 'wms-vector',
      name: 'couche',
    });
    expect(resolveDeepLink(link('WMS', 'https://data.geopf.fr/wms-r/wms'))).toEqual({
      kind: 'layer',
      service: 'wms-raster',
      name: 'couche',
    });
    expect(resolveDeepLink(link('WMTS', 'https://data.geopf.fr/wmts'))).toEqual({
      kind: 'layer',
      service: 'wmts',
      name: 'couche',
    });
  });

  it('signale les styles TMS comme non pris en charge', () => {
    expect(
      resolveDeepLink(
        link('TMS', 'https://data.geopf.fr/annexes/gissol-osf/style/x.json', 'style'),
      ),
    ).toEqual({ kind: 'unsupported', type: 'TMS' });
  });

  it('refuse un autre hôte, http, ou un chemin inconnu', () => {
    expect(resolveDeepLink(link('WMS', 'https://exemple.fr/wms-v'))).toEqual({ kind: 'invalid' });
    expect(resolveDeepLink(link('WMS', 'http://data.geopf.fr/wms-v'))).toEqual({ kind: 'invalid' });
    expect(resolveDeepLink(link('WMS', 'https://data.geopf.fr/autre'))).toEqual({
      kind: 'invalid',
    });
    expect(resolveDeepLink(link('WMTS', 'pas une url'))).toEqual({ kind: 'invalid' });
  });
});

describe('parsePermalinkLayers (format cartes.gouv.fr)', () => {
  it('lit nom, type GPF, type de service et options (position;opacité;visibilité;gris)', () => {
    expect(parsePermalinkLayers('INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;0.6;1;0)')).toEqual([
      {
        name: 'INRAE_CARTE-SOLS',
        geopType: 'OGC',
        serviceType: 'WMTS',
        opacity: 0.6,
        visible: true,
      },
    ]);
  });

  it('lit le style TMS facultatif et la forme courte (opacité;visibilité;gris)', () => {
    expect(
      parsePermalinkLayers(
        'rrp_gironde_gpkg_03-09-2026_tms$GEOPORTAIL:GPP:TMS(1;1;0;0;sols_gironde)',
      ),
    ).toEqual([
      {
        name: 'rrp_gironde_gpkg_03-09-2026_tms',
        geopType: 'GPP',
        serviceType: 'TMS',
        opacity: 1,
        visible: false,
        style: 'sols_gironde',
      },
    ]);
    expect(parsePermalinkLayers('ACCES.BIOMETHANE$GEOPORTAIL:OGC:WMTS(0.47;1;0)')[0]).toMatchObject(
      {
        opacity: 0.47,
        visible: true,
      },
    );
  });

  it('tolère casse, encodage, absence d’options et entrées invalides', () => {
    expect(parsePermalinkLayers('couche%24GEOPORTAIL%3Aogc%3Awms')).toEqual([
      { name: 'couche', geopType: 'OGC', serviceType: 'WMS' },
    ]);
    expect(
      parsePermalinkLayers('a$GEOPORTAIL:OGC:WMS(1;5;1;0),pas-une-couche,b$GEOPORTAIL:OGC:WMTS'),
    ).toEqual([
      { name: 'a', geopType: 'OGC', serviceType: 'WMS', opacity: 1, visible: true },
      { name: 'b', geopType: 'OGC', serviceType: 'WMTS' },
    ]);
  });
});

describe('readDeepLink', () => {
  it('lit `l` en priorité, ignore `permalink=no` et propose wms-r puis wms-v pour un WMS', () => {
    const search = `?l=${encodeURIComponent('stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.8;1;0)')}&permalink=no&layer=autre&type=WMTS&url=https%3A%2F%2Fdata.geopf.fr%2Fwmts`;
    expect(readDeepLink(search)).toEqual({
      kind: 'layer',
      name: 'stock_carbone_fao_fr_wmsv',
      candidates: ['wms-raster', 'wms-vector'],
      opacity: 0.8,
      visible: true,
    });
  });

  it('accepte le gabarit de production non encodé (`$` et `:` bruts)', () => {
    expect(
      readDeepLink('?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no'),
    ).toMatchObject({
      kind: 'layer',
      name: 'INRAE_CARTE-SOLS',
      candidates: ['wmts'],
    });
  });

  it('signale TMS comme non pris en charge et un `l` illisible comme invalide', () => {
    expect(
      readDeepLink('?l=cartogrammes_gpkg_11-09-2026_tms$GEOPORTAIL:GPP:TMS(1;1;1;0;style)'),
    ).toEqual({
      kind: 'unsupported',
      name: 'cartogrammes_gpkg_11-09-2026_tms',
      type: 'TMS',
      style: 'style',
    });
    expect(readDeepLink('?l=nimporte-quoi')).toEqual({ kind: 'invalid', name: 'nimporte-quoi' });
  });

  it('garde `layer/type/url` comme alias', () => {
    expect(readDeepLink('?layer=couche&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v')).toEqual({
      kind: 'layer',
      name: 'couche',
      candidates: ['wms-vector'],
    });
    expect(readDeepLink('?layer=style&type=TMS&url=https%3A%2F%2Fdata.geopf.fr%2Fx.json')).toEqual({
      kind: 'unsupported',
      name: 'style',
      type: 'TMS',
    });
    expect(readDeepLink('?layer=x&type=WMS&url=https%3A%2F%2Fexemple.fr%2Fwms-v')).toEqual({
      kind: 'invalid',
      name: 'x',
    });
    expect(readDeepLink('')).toBeNull();
  });
});

describe('valeurs émises par le catalogue (C6, doc/agents/geonetwork-ui.md §10)', () => {
  it('WMS : rrp_loiret, options par défaut', () => {
    expect(
      readDeepLink('?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no'),
    ).toEqual({
      kind: 'layer',
      name: 'rrp_loiret_gpkg_11-09-2026_wmsv',
      candidates: ['wms-raster', 'wms-vector'],
      opacity: 1,
      visible: true,
    });
  });

  it('WMTS : INRAE_CARTE-SOLS', () => {
    expect(readDeepLink('?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no')).toEqual({
      kind: 'layer',
      name: 'INRAE_CARTE-SOLS',
      candidates: ['wmts'],
      opacity: 1,
      visible: true,
    });
  });

  it('TMS : `style` et le nom du fichier de style en cinquième champ', () => {
    const l = 'style$GEOPORTAIL:GPP:TMS(1;1;1;0;c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde)';
    expect(parsePermalinkLayers(l)).toEqual([
      {
        name: 'style',
        geopType: 'GPP',
        serviceType: 'TMS',
        opacity: 1,
        visible: true,
        style: 'c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde',
      },
    ]);
    expect(readDeepLink(`?l=${l}&permalink=no`)).toEqual({
      kind: 'unsupported',
      name: 'style',
      type: 'TMS',
      style: 'c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde',
    });
  });

  it('valeur à deux couches : les deux sont lues et suivies dans l’ordre', () => {
    const l =
      'stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.7;1;0),INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(2;1;0;0)';
    expect(parsePermalinkLayers(l)).toEqual([
      {
        name: 'stock_carbone_fao_fr_wmsv',
        geopType: 'OGC',
        serviceType: 'WMS',
        opacity: 0.7,
        visible: true,
      },
      {
        name: 'INRAE_CARTE-SOLS',
        geopType: 'OGC',
        serviceType: 'WMTS',
        opacity: 1,
        visible: false,
      },
    ]);
    expect(readDeepLink(`?l=${l}&permalink=no`)).toMatchObject({
      kind: 'layer',
      name: 'stock_carbone_fao_fr_wmsv',
      opacity: 0.7,
    });
    expect(readDeepLinks(`?l=${l}&permalink=no`).map((r) => r.name)).toEqual([
      'stock_carbone_fao_fr_wmsv',
      'INRAE_CARTE-SOLS',
    ]);
  });
});

describe('readDeepLinks et readPermalinkBaseLayer (permalien de cette carte)', () => {
  const permalink =
    '?c=2.5,46.6&z=6&l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;1;1;0),stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.6;0;0),INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(2;1;1;0)&permalink=yes';

  it('reconnaît le fond de carte (entrée WMTS d’un fond configuré) et ne le suit pas comme couche', () => {
    expect(readPermalinkBaseLayer(permalink)).toBe('plan-ign');
    expect(readDeepLinks(permalink)).toEqual([
      {
        kind: 'layer',
        name: 'stock_carbone_fao_fr_wmsv',
        candidates: ['wms-raster', 'wms-vector'],
        opacity: 0.6,
        visible: false,
      },
      {
        kind: 'layer',
        name: 'INRAE_CARTE-SOLS',
        candidates: ['wmts'],
        opacity: 1,
        visible: true,
      },
    ]);
  });

  it('un fond nommé en WMS n’est pas un fond ; un permalien sans fond ne change pas le fond', () => {
    expect(
      readPermalinkBaseLayer('?l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMS(0;1;1;0)'),
    ).toBeNull();
    expect(readPermalinkBaseLayer('?l=ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS(0;1;1;0)')).toBe(
      'orthophotos',
    );
    expect(readPermalinkBaseLayer('?l=x$GEOPORTAIL:OGC:WMS(1;1;1;0)')).toBeNull();
    expect(readPermalinkBaseLayer('')).toBeNull();
  });

  it('un permalien qui ne nomme qu’un fond n’a aucune couche à suivre', () => {
    expect(
      readDeepLinks('?l=ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS(0;1;1;0)&permalink=yes'),
    ).toEqual([]);
    expect(readDeepLink('?l=ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS(0;1;1;0)')).toBeNull();
    expect(readDeepLinks('')).toEqual([]);
  });
});
