import TileWMS from 'ol/source/TileWMS';
import WMTS from 'ol/source/WMTS';
import { describe, expect, it, vi } from 'vitest';
import type { SolsLayer } from '../data/solsLayersSchema';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createOverlayLayer, preferredLayer, toOverlayRef, wmtsLayerCrs } from './overlays';
import { parseWmtsCapabilities } from './wmtsCapabilities';

const loadCrs = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('./geopf', () => ({ loadCrs }));

const capabilities = parseWmtsCapabilities(capabilitiesXml);
const layer = (service: SolsLayer['service'], name: string = service): SolsLayer => ({
  service,
  name,
  title: name,
  endpoint: `https://data.geopf.fr/${service}`,
});

describe('preferredLayer', () => {
  it('préfère WMTS, puis WMS raster, puis WMS vecteur', () => {
    expect(
      preferredLayer({ layers: [layer('wms-vector'), layer('wmts'), layer('wms-raster')] })
        ?.service,
    ).toBe('wmts');
    expect(preferredLayer({ layers: [layer('wms-vector'), layer('wms-raster')] })?.service).toBe(
      'wms-raster',
    );
    expect(preferredLayer({ layers: [layer('tms'), layer('wms-vector')] })?.service).toBe(
      'wms-vector',
    );
  });

  it('ne propose rien quand seuls TMS et WFS sont publiés', () => {
    expect(preferredLayer({ layers: [layer('tms'), layer('wfs')] })).toBeNull();
  });
});

describe('createOverlayLayer', () => {
  it('crée une couche WMS tuilée sur le point d’accès canonique, titrée pour le gestionnaire', async () => {
    const ref = toOverlayRef(layer('wms-vector', 'rrp_loiret'), 'RRP du Loiret');
    const olLayer = await createOverlayLayer(ref, undefined);
    const source = olLayer?.getSource();
    expect(source).toBeInstanceOf(TileWMS);
    expect((source as TileWMS).getParams()).toMatchObject({
      LAYERS: 'rrp_loiret',
      TRANSPARENT: true,
    });
    expect((source as TileWMS).getUrls()).toEqual(['https://data.geopf.fr/wms-vector']);
    expect(olLayer?.get('title')).toBe('RRP du Loiret');
    expect(olLayer?.get('overlayKey')).toBe('wms-vector:rrp_loiret');
  });

  it('crée une couche WMTS en Web Mercator sans charger de projection', async () => {
    loadCrs.mockClear();
    const ref = toOverlayRef(layer('wmts', 'ORTHOIMAGERY.ORTHOPHOTOS'), 'Orthophotos');
    const olLayer = await createOverlayLayer(ref, capabilities);
    expect(olLayer?.getSource()).toBeInstanceOf(WMTS);
    expect(loadCrs).not.toHaveBeenCalled();
  });

  it('charge la projection d’une grille Lambert-93 avant de créer la couche', async () => {
    loadCrs.mockClear();
    const lambert = structuredClone(capabilities) as Record<string, unknown>;
    const contents = lambert['Contents'] as {
      TileMatrixSet: Array<{ Identifier: string; SupportedCRS: string }>;
    };
    for (const set of contents.TileMatrixSet) set.SupportedCRS = 'EPSG:2154';
    await createOverlayLayer(
      toOverlayRef(layer('wmts', 'ORTHOIMAGERY.ORTHOPHOTOS'), 'x'),
      lambert,
    ).catch(() => null);
    expect(loadCrs).toHaveBeenCalledWith('EPSG:2154');
  });

  it('ne dessine ni TMS ni WFS, ni une couche WMTS absente des capacités', async () => {
    expect(await createOverlayLayer(toOverlayRef(layer('tms'), 't'), capabilities)).toBeNull();
    expect(await createOverlayLayer(toOverlayRef(layer('wfs'), 'w'), capabilities)).toBeNull();
    expect(
      await createOverlayLayer(toOverlayRef(layer('wmts', 'INCONNUE'), 'i'), capabilities),
    ).toBeNull();
  });
});

describe('wmtsLayerCrs', () => {
  it('lit le CRS de la grille liée à la couche', () => {
    expect(wmtsLayerCrs(capabilities, 'ELEVATION.SLOPES')).toBe('EPSG:3857');
    expect(wmtsLayerCrs(capabilities, 'INCONNUE')).toBeNull();
  });
});
