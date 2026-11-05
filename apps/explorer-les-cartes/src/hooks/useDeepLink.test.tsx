import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GPF_ENDPOINTS } from '../config/urls';
import { initialMapState, useMapStore } from '../store/useMapStore';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper } from '../test/queryWrapper';
import useDeepLink from './useDeepLink';

const WMS_CAPABILITIES = `<WMS_Capabilities xmlns="http://www.opengis.net/wms"><Capability><Layer>
  <Layer><Name>couche_publiee</Name><Title>Couche publiée</Title></Layer></Layer></Capability></WMS_Capabilities>`;
const WMS_VECTOR_ONLY = WMS_CAPABILITIES.replace(/couche_publiee/, 'couche_vecteur').replace(
  'Couche publiée',
  'Couche vecteur',
);

function mockFetch() {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      new Response(
        url.includes('wmts')
          ? capabilitiesXml
          : url.includes('wms-v')
            ? WMS_VECTOR_ONLY
            : WMS_CAPABILITIES,
      ),
    ),
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

  it('lien `l` (format cartes.gouv.fr) : couche connue ajoutée avec son opacité', async () => {
    mockFetch();
    const l = encodeURIComponent('stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;0.5;1;0)');
    const { result } = render(`?l=${l}&permalink=no`);
    expect(result.current).toMatchObject({ state: 'added', name: 'stock_carbone_fao_fr_wmsv' });
    await waitFor(() => expect(useMapStore.getState().overlays).toHaveLength(1));
    expect(useMapStore.getState().overlays[0]).toMatchObject({
      key: 'wms-vector:stock_carbone_fao_fr_wmsv',
      opacity: 0.5,
      visible: true,
    });
  });

  it('lien `l` WMS inconnu : sonde wms-r puis wms-v et ajoute la couche trouvée sur wms-v', async () => {
    const fetchMock = mockFetch();
    const { result } = render('?l=couche_vecteur$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no');
    expect(result.current).toEqual({ state: 'checking', name: 'couche_vecteur' });
    await waitFor(() =>
      expect(result.current).toEqual({
        state: 'added',
        name: 'couche_vecteur',
        title: 'Couche vecteur',
        key: 'wms-vector:couche_vecteur',
      }),
    );
    expect(useMapStore.getState().overlays[0]).toMatchObject({
      key: 'wms-vector:couche_vecteur',
      endpoint: GPF_ENDPOINTS.wmsVector,
    });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some((u) => u.includes('wms-r'))).toBe(true);
  });

  it('lien `l` WMS publié sur wms-r : priorité au raster', async () => {
    mockFetch();
    const { result } = render('?l=couche_publiee$GEOPORTAIL:OGC:WMS(1;1;1;0)');
    await waitFor(() => expect(result.current).toMatchObject({ state: 'added' }));
    expect(useMapStore.getState().overlays[0]?.key).toBe('wms-raster:couche_publiee');
  });

  it('lien `l` WMTS Lambert-93 connu et lien `l` introuvable', async () => {
    mockFetch();
    const known = render('?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no');
    expect(known.result.current).toMatchObject({ state: 'added', name: 'INRAE_CARTE-SOLS' });
    const missing = render('?l=INRAE_CARTE-SOLS_WMTS$GEOPORTAIL:OGC:WMTS(1;1;1;0)');
    await waitFor(() =>
      expect(missing.result.current).toEqual({ state: 'not-found', name: 'INRAE_CARTE-SOLS_WMTS' }),
    );
  });

  it('lien `l` TMS : non pris en charge', () => {
    mockFetch();
    const { result } = render('?l=rrp_landes_gpkg_11-09-2026_tms$GEOPORTAIL:GPP:TMS(1;1;1;0)');
    expect(result.current).toEqual({
      state: 'unsupported',
      name: 'rrp_landes_gpkg_11-09-2026_tms',
      type: 'TMS',
    });
  });
});
