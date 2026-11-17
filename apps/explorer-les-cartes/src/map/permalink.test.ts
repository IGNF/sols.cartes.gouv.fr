import { describe, expect, it } from 'vitest';
import { readDeepLinks, readPermalinkBaseLayer } from './deepLink';
import { readPermalinkView } from './permalink';

/** A permalink as cartes.gouv.fr writes it: centre, zoom, base layer first, then a data layer. */
const PERMALINK =
  '?c=2.5,46.6&z=6&l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;1;1;0),stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.6;0;0)&permalink=yes';

describe('permalien cartes.gouv.fr', () => {
  it('donne la vue, le fond et les couches', () => {
    expect(readPermalinkView(PERMALINK)).toEqual({ center: [2.5, 46.6], zoom: 6 });
    expect(readPermalinkBaseLayer(PERMALINK)).toBe('plan-ign');
    expect(readDeepLinks(PERMALINK)).toEqual([
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
