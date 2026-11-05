import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeepLinkStatus } from '../../hooks/useDeepLink';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import DeepLinkNotice from './DeepLinkNotice';

const status = vi.hoisted(() => ({ current: { state: 'none' } as DeepLinkStatus }));
vi.mock('../../hooks/useDeepLink', () => ({ default: () => status.current }));

describe('DeepLinkNotice', () => {
  it('n’affiche rien sans lien', () => {
    status.current = { state: 'none' };
    const { container } = render(<DeepLinkNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('annonce une couche introuvable dans une alerte nommant la couche', () => {
    status.current = { state: 'not-found', name: 'INRAE_CARTE-SOLS_WMTS' };
    render(<DeepLinkNotice />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couche introuvable');
    expect(alert).toHaveTextContent('« INRAE_CARTE-SOLS_WMTS »');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Couche introuvable' }),
    ).toBeInTheDocument();
  });

  it('informe que le format TMS n’est pas pris en charge', () => {
    status.current = { state: 'unsupported', name: 'style', type: 'TMS' };
    render(<DeepLinkNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('Format non pris en charge');
  });

  it('annonce la couche ajoutée et la recherche en cours', () => {
    status.current = { state: 'added', name: 'n', title: 'Stocks de carbone', key: 'wms-vector:n' };
    const { rerender } = render(<DeepLinkNotice />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Couche « Stocks de carbone » ajoutée à la carte.',
    );
    status.current = { state: 'checking', name: 'n' };
    rerender(<DeepLinkNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('Recherche de la couche « n »');
  });

  it('distingue un lien invalide (hôte refusé ou lien mal formé)', () => {
    status.current = { state: 'invalid', name: 'x' };
    render(<DeepLinkNotice />);
    expect(screen.getByRole('alert')).toHaveTextContent('Lien invalide');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Couche introuvable');
  });

  it('signale une couche ajoutée par lien qui ne renvoie pas d’image', () => {
    useMapStore.setState({ ...initialMapState, unavailableOverlays: ['wms-vector:rrp_loiret'] });
    status.current = {
      state: 'added',
      name: 'rrp_loiret',
      title: 'RRP du Loiret',
      key: 'wms-vector:rrp_loiret',
    };
    render(<DeepLinkNotice />);
    expect(screen.getByRole('alert')).toHaveTextContent('Couche indisponible');
    expect(screen.getByRole('alert')).toHaveTextContent('ne renvoie pas d’image');
    useMapStore.setState(initialMapState);
  });
});
