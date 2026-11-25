import { describe, expect, it } from 'vitest';
import { GPF_ENDPOINTS } from '../config/urls';
import { isDisplayable, mapLinkFor, serviceEndpointUrl } from './serviceLinks';

describe('serviceLinks', () => {
  it('pointe vers le GetCapabilities de chaque service OGC et vers la ressource TileMap du TMS', () => {
    expect(
      serviceEndpointUrl({ service: 'wms-vector', name: 'x', endpoint: GPF_ENDPOINTS.wmsVector }),
    ).toBe(`${GPF_ENDPOINTS.wmsVector}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`);
    expect(
      serviceEndpointUrl({ service: 'wfs', name: 'a:b', endpoint: GPF_ENDPOINTS.wfs }),
    ).toContain('SERVICE=WFS&VERSION=2.0.0');
    expect(
      serviceEndpointUrl({ service: 'wmts', name: 'x', endpoint: GPF_ENDPOINTS.wmts }),
    ).toContain('SERVICE=WMTS&VERSION=1.0.0');
    expect(
      serviceEndpointUrl({ service: 'tms', name: 'rrp_tms', endpoint: GPF_ENDPOINTS.tms }),
    ).toBe(`${GPF_ENDPOINTS.tms}/rrp_tms`);
  });

  it('construit le lien « voir sur la carte » des seules couches affichables', () => {
    expect(isDisplayable('wmts')).toBe(true);
    expect(isDisplayable('tms')).toBe(false);
    expect(
      mapLinkFor({ service: 'wmts', name: 'INRAE_CARTE-SOLS', endpoint: GPF_ENDPOINTS.wmts }),
    ).toBe(
      '/explorer-les-cartes/?layer=INRAE_CARTE-SOLS&type=WMTS&url=https%3A%2F%2Fdata.geopf.fr%2Fwmts',
    );
    expect(
      mapLinkFor({ service: 'wms-raster', name: 'r', endpoint: GPF_ENDPOINTS.wmsRaster }),
    ).toContain('type=WMS');
    expect(mapLinkFor({ service: 'wfs', name: 'a:b', endpoint: GPF_ENDPOINTS.wfs })).toBeNull();
  });
});
