import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeepLinkStatus } from '../../hooks/useDeepLink';
import type { DeepLinkRequest } from '../../map/deepLink';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import DeepLinkNotice from './DeepLinkNotice';

const status = vi.hoisted(() => ({
  current: { state: 'none' } as DeepLinkStatus,
  requests: [] as DeepLinkRequest[],
}));
vi.mock('../../hooks/useDeepLink', () => ({
  useDeepLinkLayer: (request: DeepLinkRequest) => {
    status.requests.push(request);
    return status.current;
  },
}));

/** A query string with one WMS layer: the notice follows it with the mocked hook. */
const ONE_LAYER = '?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no';

describe('DeepLinkNotice', () => {
  it('n’affiche rien sans lien', () => {
    status.current = { state: 'none' };
    const { container } = render(<DeepLinkNotice search="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('suit chaque couche d’un permalien, sans le fond de carte', () => {
    status.current = { state: 'none' };
    status.requests = [];
    render(
      <DeepLinkNotice search="?c=2.5,46.6&z=6&l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;1;1;0),a$GEOPORTAIL:OGC:WMS(1;1;1;0),b$GEOPORTAIL:OGC:WMTS(2;0.5;1;0)&permalink=yes" />,
    );
    expect(status.requests.map((request) => request.name)).toEqual(['a', 'b']);
  });

  it('annonce une couche introuvable dans une alerte nommant la couche', () => {
    status.current = { state: 'not-found', name: 'INRAE_CARTE-SOLS_WMTS' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couche introuvable');
    expect(alert).toHaveTextContent('« INRAE_CARTE-SOLS_WMTS »');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Couche introuvable' }),
    ).toBeInTheDocument();
  });

  it('informe que le format TMS n’est pas pris en charge', () => {
    status.current = { state: 'unsupported', name: 'style', type: 'TMS' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    expect(screen.getByRole('status')).toHaveTextContent('Format non pris en charge');
    expect(screen.getByRole('status')).toHaveTextContent('tuiles vectorielles (TMS)');
  });

  it('nomme le service non affichable quand ce n’est pas du TMS', () => {
    status.current = { state: 'unsupported', name: 'couche', type: 'WFS' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    expect(screen.getByRole('status')).toHaveTextContent('Le service WFS de la couche « couche »');
  });

  it('annonce la couche ajoutée et la recherche en cours', () => {
    status.current = { state: 'added', name: 'x', title: 'Couche X', key: 'wms-vector:x' };
    const { unmount } = render(<DeepLinkNotice search={ONE_LAYER} />);
    expect(screen.getByRole('status')).toHaveTextContent('Couche « Couche X » ajoutée à la carte.');
    unmount();
    status.current = { state: 'checking', name: 'x' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    expect(screen.getByRole('status')).toHaveTextContent('Recherche de la couche « x »…');
  });

  it('distingue un lien invalide (hôte refusé ou lien mal formé)', () => {
    status.current = { state: 'invalid', name: 'x' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Lien invalide');
    expect(screen.getByRole('heading', { level: 2, name: 'Lien invalide' })).toBeInTheDocument();
  });

  it('signale une couche ajoutée par lien qui ne renvoie pas d’image', () => {
    useMapStore.setState({ ...initialMapState, unavailableOverlays: ['wms-vector:rrp'] });
    status.current = { state: 'added', name: 'rrp', title: 'RRP du Loiret', key: 'wms-vector:rrp' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couche indisponible');
    expect(alert).toHaveTextContent('« RRP du Loiret »');
    useMapStore.setState(initialMapState);
  });

  it('nomme le style TMS reçu et donne le lien vers son fichier', () => {
    status.current = { state: 'unsupported', name: 'style', type: 'TMS', style: 'mon_style' };
    render(<DeepLinkNotice search={ONE_LAYER} />);
    expect(screen.getByRole('status')).toHaveTextContent('« mon_style »');
    expect(screen.getByRole('link', { name: 'fichier de style' })).toHaveAttribute(
      'href',
      'https://data.geopf.fr/annexes/gissol-osf/style/mon_style.json',
    );
  });
});
