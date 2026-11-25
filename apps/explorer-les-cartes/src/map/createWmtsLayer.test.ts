import { get as getProjection } from 'ol/proj';
import WMTS from 'ol/source/WMTS';
import { describe, expect, it } from 'vitest';
import { BASE_LAYER_CANDIDATES, GPF_ATTRIBUTION } from '../config/map';
import { GPF_ENDPOINTS } from '../config/urls';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import createWmtsLayer from './createWmtsLayer';
import { parseWmtsCapabilities } from './wmtsCapabilities';

const capabilities = parseWmtsCapabilities(capabilitiesXml);
const planIgn = BASE_LAYER_CANDIDATES[0].layerName;

describe('createWmtsLayer', () => {
  it('crée une couche WMTS Plan IGN servie par la Géoplateforme', () => {
    const layer = createWmtsLayer(capabilities, planIgn);
    expect(layer).not.toBeNull();
    const source = layer?.getSource();
    expect(source).toBeInstanceOf(WMTS);
    expect(source?.getLayer()).toBe(planIgn);
    expect(source?.getMatrixSet()).toBe('PM_0_19');
    expect(source?.getUrls()?.[0]).toContain(GPF_ENDPOINTS.wmts);
  });

  it('expose le titre et la description pour le gestionnaire de couches', () => {
    const layer = createWmtsLayer(capabilities, planIgn);
    expect(layer?.get('name')).toBe(planIgn);
    expect(layer?.get('title')).toBe('Plan IGN');
    expect(layer?.get('description')).toMatch(/^Cartographie multi-échelles/);
  });

  it('attribue la couche à l’IGN et à la Géoplateforme', () => {
    const attributions = createWmtsLayer(capabilities, planIgn)?.getSource()?.getAttributions();
    expect(typeof attributions).toBe('function');
    const value = typeof attributions === 'function' ? attributions({} as never) : attributions;
    expect(value).toEqual([GPF_ATTRIBUTION]);
  });

  it('expose la légende publiée et la propriété name au contrôle Legends', () => {
    const layer = createWmtsLayer(capabilities, planIgn);
    expect(layer).toHaveProperty('name', planIgn);
    expect(
      (layer as unknown as { getLegends: () => Array<{ url: string }> }).getLegends()[0]?.url,
    ).toBe(
      'https://data.geopf.fr/annexes/ressources/legendes/GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2-legend.png',
    );
  });

  it('donne à la source la méthode GetFeatureInfo du contrôle geopf : vide pour Plan IGN, requête pour les orthophotos (InfoFormat publié)', () => {
    type Queryable = { getFeatureInfoUrl: (...args: unknown[]) => string | undefined };
    const projection = getProjection('EPSG:3857');
    const planSource = createWmtsLayer(capabilities, planIgn)?.getSource() as unknown as Queryable;
    expect(planSource.getFeatureInfoUrl([261000, 6250000], 2445.98, projection, {})).toBe(
      'data:text/plain,',
    );
    const orthos = createWmtsLayer(
      capabilities,
      'ORTHOIMAGERY.ORTHOPHOTOS',
    )?.getSource() as unknown as Queryable;
    expect(orthos.getFeatureInfoUrl([261000, 6250000], 2445.98, projection, {})).toContain(
      'REQUEST=GetFeatureInfo&LAYER=ORTHOIMAGERY.ORTHOPHOTOS',
    );
  });

  it('ne devine pas une couche absente des capacités', () => {
    expect(createWmtsLayer(capabilities, 'COUCHE.INEXISTANTE')).toBeNull();
  });
});
