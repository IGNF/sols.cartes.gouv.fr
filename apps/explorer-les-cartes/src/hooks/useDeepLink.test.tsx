import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GPF_ENDPOINTS } from '../config/urls';
import { initialMapState, useMapStore } from '../store/useMapStore';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper } from '../test/queryWrapper';
import useDeepLink from './useDeepLink';

const WMS_CAPABILITIES = `<WMS_Capabilities xmlns="http://www.opengis.net/wms"><Capability><Layer>
  <Layer><Name>couche_publiee</Name><Title>Couche publiée</Title></Layer></Layer></Capability></WMS_Capabilities>`;

function mockFetch() {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(new Response(url.includes('wmts') ? capabilitiesXml : WMS_CAPABILITIES)),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const render = (search: string) =>
  renderHook(() => useDeepLink(search), { wrapper: createQueryWrapper() });

describe('useDeepLink', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ne fait rien sans paramètres', () => {
    mockFetch();
    const { result } = render('');
    expect(result.current).toEqual({ state: 'none' });
  });

  it('ajoute une couche connue du fichier généré sans requête de capacités WMS', async () => {
    const fetchMock = mockFetch();
    const { result } = render(
      '?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v',
    );
    expect(result.current).toMatchObject({ state: 'added', name: 'stock_carbone_fao_fr_wmsv' });
    await waitFor(() => expect(useMapStore.getState().overlays).toHaveLength(1));
    expect(useMapStore.getState().overlays[0]).toMatchObject({
      key: 'wms-vector:stock_carbone_fao_fr_wmsv',
      endpoint: GPF_ENDPOINTS.wmsVector,
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('wms-v'))).toBe(false);
  });

  it('vérifie une couche inconnue contre les capacités en direct et l’ajoute si elle est publiée', async () => {
    mockFetch();
    const { result } = render(
      '?layer=couche_publiee&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-r%2Fwms',
    );
    expect(result.current).toEqual({ state: 'checking', name: 'couche_publiee' });
    await waitFor(() =>
      expect(result.current).toEqual({
        state: 'added',
        name: 'couche_publiee',
        title: 'Couche publiée',
        key: 'wms-raster:couche_publiee',
      }),
    );
    expect(useMapStore.getState().overlays[0]).toMatchObject({
      key: 'wms-raster:couche_publiee',
      endpoint: GPF_ENDPOINTS.wmsRaster,
    });
  });

  it('signale une couche introuvable (nom du CSW absent du service)', async () => {
    mockFetch();
    const { result } = render(
      '?layer=INRAE_CARTE-SOLS_WMTS&type=WMTS&url=https%3A%2F%2Fdata.geopf.fr%2Fwmts',
    );
    await waitFor(() =>
      expect(result.current).toEqual({ state: 'not-found', name: 'INRAE_CARTE-SOLS_WMTS' }),
    );
    expect(useMapStore.getState().overlays).toEqual([]);
  });

  it('signale le format TMS (style MapLibre) comme non pris en charge', () => {
    mockFetch();
    const { result } = render(
      '?layer=style&type=TMS&url=https%3A%2F%2Fdata.geopf.fr%2Fannexes%2Fgissol-osf%2Fstyle%2Fx.json',
    );
    expect(result.current).toEqual({ state: 'unsupported', name: 'style', type: 'TMS' });
    expect(useMapStore.getState().overlays).toEqual([]);
  });

  it('refuse un point d’accès hors Géoplateforme', () => {
    mockFetch();
    const { result } = render('?layer=x&type=WMS&url=https%3A%2F%2Fexemple.fr%2Fwms-v');
    expect(result.current).toEqual({ state: 'invalid', name: 'x' });
  });
});
