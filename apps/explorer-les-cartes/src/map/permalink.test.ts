import { describe, expect, it } from 'vitest';
import { readDeepLinks, readPermalinkBaseLayer } from './deepLink';
import {
  buildPermalink,
  formatPermalinkLayer,
  readPermalinkView,
  type PermalinkState,
} from './permalink';

const BASE = 'https://sols.cartes.gouv.fr/explorer-les-cartes/';

const state: PermalinkState = {
  center: [2.5, 46.6],
  zoom: 6,
  layers: [
    {
      name: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      geopType: 'OGC',
      serviceType: 'WMTS',
      opacity: 1,
      visible: true,
    },
    {
      name: 'stock_carbone_fao_fr_wmsv',
      geopType: 'OGC',
      serviceType: 'WMS',
      opacity: 0.6,
      visible: false,
    },
  ],
};

describe('formatPermalinkLayer', () => {
  it('écrit une entrée au format cartes.gouv.fr : nom$GEOPORTAIL:type:service(position;opacité;visible;gris)', () => {
    const [, carbone] = state.layers;
    if (!carbone) throw new Error('fixture');
    expect(formatPermalinkLayer(carbone, 1)).toBe(
      'stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.6;0;0)',
    );
    expect(
      formatPermalinkLayer(
        {
          name: 'style',
          geopType: 'GPP',
          serviceType: 'TMS',
          opacity: 1,
          visible: true,
          style: 'x',
        },
        2,
      ),
    ).toBe('style$GEOPORTAIL:GPP:TMS(2;1;1;0;x)');
  });

  it('borne l’opacité et l’arrondit à deux décimales', () => {
    const [planIgn] = state.layers;
    if (!planIgn) throw new Error('fixture');
    const layer = { ...planIgn, opacity: 1.5 };
    expect(formatPermalinkLayer(layer, 0)).toContain('(0;1;1;0)');
    expect(formatPermalinkLayer({ ...layer, opacity: 0.333 }, 0)).toContain('(0;0.33;1;0)');
  });
});

describe('buildPermalink', () => {
  it('écrit c, z, l (brut, non encodé) et permalink=yes', () => {
    expect(buildPermalink(BASE, state)).toBe(
      `${BASE}?c=2.5,46.6&z=6&l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;1;1;0),stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.6;0;0)&permalink=yes`,
    );
  });

  it('arrondit le centre à six décimales et le zoom à deux', () => {
    const link = buildPermalink(BASE, { ...state, center: [2.3488889, 48.8534], zoom: 12.3456 });
    expect(link).toContain('?c=2.348889,48.8534&z=12.35&');
  });

  it('fait l’aller-retour par le lecteur de liens profonds : vue, fond et couches', () => {
    const link = buildPermalink(BASE, state);
    const search = new URL(link).search;
    expect(readPermalinkView(search)).toEqual({ center: [2.5, 46.6], zoom: 6 });
    expect(readPermalinkBaseLayer(search)).toBe('plan-ign');
    expect(readDeepLinks(search)).toEqual([
      {
        kind: 'layer',
        name: 'stock_carbone_fao_fr_wmsv',
        candidates: ['wms-raster', 'wms-vector'],
        opacity: 0.6,
        visible: false,
      },
    ]);
  });
});

describe('readPermalinkView', () => {
  it('lit le centre et le zoom', () => {
    expect(readPermalinkView('?c=2.5,46.6&z=6&l=x')).toEqual({ center: [2.5, 46.6], zoom: 6 });
    expect(readPermalinkView('?c= -61.5 , 16.2 &z=10.5')).toEqual({
      center: [-61.5, 16.2],
      zoom: 10.5,
    });
  });

  it('ignore une vue incomplète ou hors limites', () => {
    expect(readPermalinkView('')).toBeNull();
    expect(readPermalinkView('?c=2.5,46.6')).toBeNull();
    expect(readPermalinkView('?z=6')).toBeNull();
    expect(readPermalinkView('?c=2.5&z=6')).toBeNull();
    expect(readPermalinkView('?c=200,46.6&z=6')).toBeNull();
    expect(readPermalinkView('?c=2.5,91&z=6')).toBeNull();
    expect(readPermalinkView('?c=2.5,46.6&z=40')).toBeNull();
    expect(readPermalinkView('?c=a,b&z=c')).toBeNull();
  });
});
