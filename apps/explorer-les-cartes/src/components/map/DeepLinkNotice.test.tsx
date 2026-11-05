import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeepLinkStatus } from '../../hooks/useDeepLink';
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
    expect(screen.getByRole('status')).toHaveTextContent('tuiles vectorielles');
  });

  it('nomme le service non affichable quand ce n’est pas du TMS', () => {
    status.current = { state: 'unsupported', name: 'x', type: 'WFS' };
    render(<DeepLinkNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('Le service WFS de la couche « x »');
  });

  it('annonce la couche ajoutée et la recherche en cours', () => {
    status.current = { state: 'added', name: 'n', title: 'Stocks de carbone' };
    const { rerender } = render(<DeepLinkNotice />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Couche « Stocks de carbone » ajoutée à la carte.',
    );
    status.current = { state: 'checking', name: 'n' };
    rerender(<DeepLinkNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('Recherche de la couche « n »');
  });
});
