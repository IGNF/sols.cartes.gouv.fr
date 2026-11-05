import { describe, expect, it } from 'vitest';
import { parseDeepLink, resolveDeepLink } from './deepLink';

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
