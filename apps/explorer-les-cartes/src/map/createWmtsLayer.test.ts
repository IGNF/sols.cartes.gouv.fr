import WMTS from 'ol/source/WMTS';
import BaseEvent from 'ol/events/Event';
import { describe, expect, it, vi } from 'vitest';
import { BASE_LAYER_CANDIDATES, GPF_ATTRIBUTION, TILE_RETRY_DELAY_MS } from '../config/map';
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

  it('réessaie une fois une tuile en erreur', () => {
    vi.useFakeTimers();
    const source = createWmtsLayer(capabilities, planIgn)?.getSource();
    const tile = { load: vi.fn(), getKey: () => 'tuile' };
    source?.dispatchEvent(Object.assign(new BaseEvent('tileloaderror'), { tile }));
    vi.advanceTimersByTime(TILE_RETRY_DELAY_MS);
    expect(tile.load).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('ne devine pas une couche absente des capacités', () => {
    expect(createWmtsLayer(capabilities, 'COUCHE.INEXISTANTE')).toBeNull();
  });
});
