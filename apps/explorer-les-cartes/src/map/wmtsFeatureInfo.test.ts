import { get as getProjection } from 'ol/proj';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { describe, expect, it } from 'vitest';
import { BASE_LAYER_CANDIDATES } from '../config/map';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { parseWmtsCapabilities } from './wmtsCapabilities';
import { attachWmtsFeatureInfo, NO_FEATURE_INFO_URL, wmtsFeatureInfoUrl } from './wmtsFeatureInfo';

const capabilities = parseWmtsCapabilities(capabilitiesXml);
const planIgn = BASE_LAYER_CANDIDATES[0].layerName;
const projection = getProjection('EPSG:3857');
if (!projection) throw new Error('projection EPSG:3857 absente');

function planIgnSource(): WMTS {
  const options = optionsFromCapabilities(capabilities, { layer: planIgn });
  if (!options) throw new Error('fixture sans Plan IGN');
  return new WMTS(options);
}

function resolutionAt(source: WMTS, z: number): number {
  const tileGrid = source.getTileGrid();
  if (!tileGrid) throw new Error('source sans grille');
  return tileGrid.getResolution(z);
}

describe('wmtsFeatureInfoUrl', () => {
  it('construit une requête GetFeatureInfo WMTS KVP sur la tuile et le pixel du point', () => {
    const source = planIgnSource();
    // Zoom 6 of PM: resolution 2445.98 m/px; a point near Paris.
    const url = new URL(
      wmtsFeatureInfoUrl(source, [261000, 6250000], resolutionAt(source, 6), projection, {
        INFOFORMAT: 'text/html',
        STYLES: '',
      }) ?? '',
    );
    expect(url.origin + url.pathname).toBe('https://data.geopf.fr/wmts');
    const params = Object.fromEntries(url.searchParams);
    expect(params).toMatchObject({
      SERVICE: 'WMTS',
      VERSION: '1.0.0',
      REQUEST: 'GetFeatureInfo',
      LAYER: planIgn,
      TILEMATRIXSET: 'PM_0_19',
      TILEMATRIX: '6',
      INFOFORMAT: 'text/html',
      STYLES: '',
    });
    expect(Number(params['TILECOL'])).toBe(32);
    expect(Number(params['TILEROW'])).toBe(22);
    const i = Number(params['I']);
    const j = Number(params['J']);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(256);
    expect(j).toBeGreaterThanOrEqual(0);
    expect(j).toBeLessThan(256);
  });

  it('ne construit rien pour un point hors de l’étendue de la projection', () => {
    const source = planIgnSource();
    expect(
      wmtsFeatureInfoUrl(source, [261000, 30_000_000], resolutionAt(source, 6), projection, {}),
    ).toBeUndefined();
  });

  it('répond par un document vide pour une couche non interrogeable (pas de requête, pas d’erreur console)', () => {
    const source = attachWmtsFeatureInfo(planIgnSource(), false);
    expect(
      source.getFeatureInfoUrl([261000, 6250000], resolutionAt(source, 6), projection, {}),
    ).toBe(NO_FEATURE_INFO_URL);
  });

  it('attache la méthode attendue par le contrôle GetFeatureInfo de geopf', () => {
    const source = attachWmtsFeatureInfo(planIgnSource());
    expect(
      source.getFeatureInfoUrl([261000, 6250000], resolutionAt(source, 6), projection, {}),
    ).toContain('REQUEST=GetFeatureInfo');
  });
});
