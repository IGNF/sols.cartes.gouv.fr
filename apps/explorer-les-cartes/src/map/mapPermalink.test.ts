import TileLayer from 'ol/layer/Tile';
import OlMap from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SHARE_LABELS } from '../config/map';
import { mailtoLink, mapPageUrl, mapPermalink, mapPermalinkState } from './mapPermalink';
import type { OverlayRef } from './overlays';

const overlay = (service: OverlayRef['service'], name: string): OverlayRef => ({
  key: `${service}:${name}`,
  service,
  name,
  title: name,
  endpoint: 'https://data.geopf.fr/x',
});

// ol/Map observes its target with ResizeObserver, absent from jsdom.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function createMap(): OlMap {
  const map = new OlMap({
    view: new View({ center: fromLonLat([2.5, 46.6]), zoom: 6 }),
    controls: [],
  });
  const base = new TileLayer({ source: new XYZ() });
  base.set('name', 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2');
  map.addLayer(base);
  const carbone = new TileLayer({ source: new XYZ(), opacity: 0.6, visible: false });
  carbone.set('overlayKey', 'wms-vector:stock_carbone_fao_fr_wmsv');
  map.addLayer(carbone);
  return map;
}

describe('mapPermalinkState', () => {
  it('lit la vue, le fond en premier, puis les couches sols avec leur opacité et visibilité en direct', () => {
    const map = createMap();
    const state = mapPermalinkState(map, 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', [
      overlay('wms-vector', 'stock_carbone_fao_fr_wmsv'),
      overlay('wmts', 'INRAE_CARTE-SOLS'),
    ]);
    expect(state?.center.map((v) => Number(v.toFixed(6)))).toEqual([2.5, 46.6]);
    expect(state?.zoom).toBe(6);
    expect(state?.layers).toEqual([
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
      // Not yet on the map (capabilities pending): store values, defaults.
      { name: 'INRAE_CARTE-SOLS', geopType: 'OGC', serviceType: 'WMTS', opacity: 1, visible: true },
    ]);
  });

  it('omet le fond quand il n’est pas connu et les services non dessinés', () => {
    const state = mapPermalinkState(createMap(), undefined, [overlay('wfs', 'x')]);
    expect(state?.layers).toEqual([]);
  });

  it('ne produit rien sans vue', () => {
    const map = new OlMap({ view: new View(), controls: [] });
    expect(mapPermalinkState(map, 'x', [])).toBeNull();
  });
});

describe('mapPermalink', () => {
  it('construit le lien complet sur la page de la carte', () => {
    const link = mapPermalink(
      'https://sols.cartes.gouv.fr/explorer-les-cartes/',
      createMap(),
      'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      [],
    );
    expect(link).toBe(
      'https://sols.cartes.gouv.fr/explorer-les-cartes/?c=2.5,46.6&z=6&l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;1;1;0)&permalink=yes',
    );
  });
});

describe('mapPageUrl et mailtoLink', () => {
  it('prend l’origine courante et le chemin de la brique carto', () => {
    expect(mapPageUrl({ origin: 'https://sols.cartes.gouv.fr' })).toBe(
      'https://sols.cartes.gouv.fr/explorer-les-cartes/',
    );
  });

  it('prépare un courriel avec le lien dans le corps', () => {
    const link =
      'https://sols.cartes.gouv.fr/explorer-les-cartes/?c=2.5,46.6&z=6&l=a$GEOPORTAIL:OGC:WMS(0;1;1;0)&permalink=yes';
    const mailto = new URL(mailtoLink(link));
    expect(mailto.protocol).toBe('mailto:');
    expect(mailto.searchParams.get('subject')).toBe(SHARE_LABELS.mailSubject);
    expect(mailto.searchParams.get('body')).toBe(`${SHARE_LABELS.mailBody}\n${link}`);
  });
});
