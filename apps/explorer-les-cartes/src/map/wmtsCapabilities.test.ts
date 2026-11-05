import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASE_LAYER_CANDIDATES } from '../config/map';
import { GPF_ENDPOINTS } from '../config/urls';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import {
  fetchWmtsCapabilities,
  findWmtsLayer,
  parseWmtsCapabilities,
  WMTS_CAPABILITIES_URL,
} from './wmtsCapabilities';

const planIgn = BASE_LAYER_CANDIDATES[0].layerName;

describe('wmtsCapabilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('construit l’URL GetCapabilities du WMTS de la Géoplateforme', () => {
    const url = new URL(WMTS_CAPABILITIES_URL);
    expect(`${url.origin}${url.pathname}`).toBe(GPF_ENDPOINTS.wmts);
    expect(url.searchParams.get('SERVICE')).toBe('WMTS');
    expect(url.searchParams.get('REQUEST')).toBe('GetCapabilities');
    expect(url.searchParams.get('VERSION')).toBe('1.0.0');
  });

  it('lit le titre et le résumé d’une couche publiée', () => {
    const info = findWmtsLayer(parseWmtsCapabilities(capabilitiesXml), planIgn);
    expect(info).toMatchObject({ identifier: planIgn, title: 'Plan IGN' });
    expect(info?.abstract).toMatch(/^Cartographie multi-échelles/);
  });

  it('renvoie null pour une couche absente des capacités', () => {
    expect(findWmtsLayer(parseWmtsCapabilities(capabilitiesXml), 'COUCHE.INEXISTANTE')).toBeNull();
    expect(findWmtsLayer({}, planIgn)).toBeNull();
  });

  it('rejette un document illisible', () => {
    expect(() => parseWmtsCapabilities('pas du xml')).toThrow(/illisibles/);
    expect(() => parseWmtsCapabilities('<ServiceException/>')).toThrow(/illisibles/);
  });

  it('télécharge et analyse les capacités', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(capabilitiesXml, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const capabilities = await fetchWmtsCapabilities();
    expect(fetchMock).toHaveBeenCalledWith(WMTS_CAPABILITIES_URL, {
      signal: expect.any(AbortSignal),
    });
    expect(findWmtsLayer(capabilities, planIgn)).not.toBeNull();
  });

  it('signale une réponse HTTP en erreur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(fetchWmtsCapabilities()).rejects.toThrow(/HTTP 503/);
  });

  it('abandonne une requête de capacités sans réponse', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            ),
          ),
      ),
    );
    const pending = fetchWmtsCapabilities(undefined, 5000);
    const assertion = expect(pending).rejects.toThrow(/Pas de réponse de data.geopf.fr en 5 s/);
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
    vi.useRealTimers();
  });
});
