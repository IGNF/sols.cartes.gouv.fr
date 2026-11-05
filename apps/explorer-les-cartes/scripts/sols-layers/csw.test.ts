import { describe, expect, it } from 'vitest';
import cswXml from './fixtures/csw-extract.xml?raw';
import { parseCswRecords } from './csw';

describe('parseCswRecords', () => {
  const records = parseCswRecords(cswXml);

  it('lit chaque fiche ISO 19115-3 de la réponse', () => {
    expect(records).toHaveLength(2);
    expect(records.map((r) => r.id).sort()).toEqual([
      'osf63e6c177-455e-5805-b70b-0894ee1c7174',
      'osfd95caa37-436b-431c-9391-643164f010bb',
    ]);
  });

  it('extrait titre, résumé et organisation', () => {
    const record = records.find((r) => r.id.startsWith('osfd95caa37'));
    expect(record?.title).toMatch(/^Les sols dominants de France métropolitaine/);
    expect(record?.abstract.length).toBeGreaterThan(50);
    expect(record?.organisation).toBe('INRAE - Info&Sols');
  });

  it('extrait les liens avec protocole, adresse, nom et description', () => {
    const record = records.find((r) => r.id.startsWith('osfd95caa37'));
    const services = record?.links.filter((l) => l.protocol.startsWith('OGC:'));
    expect(services).toContainEqual(
      expect.objectContaining({
        protocol: 'OGC:WMTS',
        name: 'INRAE_CARTE-SOLS',
        linkage: 'https://data.geopf.fr/wmts',
      }),
    );
    expect(services).toContainEqual(
      expect.objectContaining({
        protocol: 'OGC:WMS',
        name: 'inrae_carte_sols_wmsr',
        linkage: 'https://data.geopf.fr/wms-r/wms',
      }),
    );
    const capabilitiesLink = record?.links.find((l) => l.name === 'GetCapabilities - WFS');
    expect(capabilitiesLink?.description).toBe('Service de diffusion WFS principal');
  });

  it('renvoie une liste vide sans fiche', () => {
    expect(
      parseCswRecords('<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"/>'),
    ).toEqual([]);
  });

  it('signale une exception OGC renvoyée avec un HTTP 200', () => {
    const exception = `<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1" version="1.2.0">
      <ows:Exception exceptionCode="NoApplicableCode"><ows:ExceptionText>Service indisponible</ows:ExceptionText></ows:Exception>
      </ows:ExceptionReport>`;
    expect(() => parseCswRecords(exception)).toThrow(/exception OGC : Service indisponible/);
  });
});
