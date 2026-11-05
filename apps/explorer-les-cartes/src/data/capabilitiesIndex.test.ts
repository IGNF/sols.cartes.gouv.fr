import { describe, expect, it } from 'vitest';
import capabilitiesXml from '../test/fixtures/wmts-capabilities.xml?raw';
import {
  exceptionReportText,
  indexTmsTileMaps,
  indexWfsFeatureTypes,
  indexWmsLayers,
  indexWmtsLayers,
} from './capabilitiesIndex';

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'text/xml');

describe('capabilitiesIndex', () => {
  it('liste les couches WMTS avec le CRS de leurs grilles', () => {
    const index = indexWmtsLayers(parse(capabilitiesXml));
    expect(index.get('ORTHOIMAGERY.ORTHOPHOTOS')).toEqual({
      title: 'Photographies aériennes',
      crs: ['EPSG:3857'],
    });
    expect(index.has('INEXISTANTE')).toBe(false);
  });

  it('liste les couches nommées d’un WMS 1.3.0', () => {
    const xml = `<WMS_Capabilities xmlns="http://www.opengis.net/wms"><Capability><Layer><Title>Racine</Title>
      <Layer><Name>rrp_loiret_wmsv</Name><Title>RRP du Loiret</Title></Layer>
      <Layer><Name>sans_titre</Name></Layer></Layer></Capability></WMS_Capabilities>`;
    const index = indexWmsLayers(parse(xml));
    expect([...index.keys()]).toEqual(['rrp_loiret_wmsv', 'sans_titre']);
    expect(index.get('rrp_loiret_wmsv')?.title).toBe('RRP du Loiret');
    expect(index.get('sans_titre')?.title).toBe('sans_titre');
  });

  it('liste les types d’un WFS 2.0.0', () => {
    const xml = `<wfs:WFS_Capabilities xmlns:wfs="http://www.opengis.net/wfs/2.0"><wfs:FeatureTypeList>
      <wfs:FeatureType><wfs:Name>espace:type</wfs:Name><wfs:Title>Type</wfs:Title></wfs:FeatureType>
      </wfs:FeatureTypeList></wfs:WFS_Capabilities>`;
    expect(indexWfsFeatureTypes(parse(xml)).get('espace:type')?.title).toBe('Type');
  });

  it('liste les tuiles TMS par le dernier segment de leur adresse', () => {
    const xml = `<TileMapService version="1.0.0"><TileMaps>
      <TileMap title="RRP de la Gironde" href="https://data.geopf.fr/tms/1.0.0/rrp_gironde_tms"/>
      </TileMaps></TileMapService>`;
    expect(indexTmsTileMaps(parse(xml)).get('rrp_gironde_tms')?.title).toBe('RRP de la Gironde');
  });

  it('reconnaît les exceptions OGC renvoyées avec un HTTP 200', () => {
    const wms = parse(`<ServiceExceptionReport version="1.3.0" xmlns="http://www.opengis.net/ogc">
      <ServiceException>java.lang.NullPointerException</ServiceException></ServiceExceptionReport>`);
    expect(exceptionReportText(wms)).toBe('java.lang.NullPointerException');
    const ows =
      parse(`<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"><ows:Exception>
      <ows:ExceptionText>Layer unknown</ows:ExceptionText></ows:Exception></ows:ExceptionReport>`);
    expect(exceptionReportText(ows)).toBe('Layer unknown');
    expect(exceptionReportText(parse(capabilitiesXml))).toBeNull();
    expect(indexWmsLayers(wms).size).toBe(0);
  });
});
