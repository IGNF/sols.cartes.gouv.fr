import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FOOTER_ID, HEADER_ID } from '../../config/landmarks';
import { BRAND } from '../../config/site';
import SiteFooter from './SiteFooter';

describe('SiteFooter (compact, footer.compactOnCarto)', () => {
  it('ne garde que la barre basse : liens de la marque et « Paramètres d’affichage »', () => {
    expect(BRAND.footer.compactOnCarto).toBe(true);
    render(<SiteFooter />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveAttribute('id', FOOTER_ID);
    const list = footer.querySelector('.fr-footer__bottom-list') as HTMLElement;
    for (const link of BRAND.footer.bottomLinks) {
      expect(within(list).getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      );
    }
    expect(
      within(list).getByRole('button', { name: /paramètres d.affichage/i }),
    ).toBeInTheDocument();
    expect(
      footer.querySelector('.fr-footer__body, .fr-footer__partners, .fr-footer__content'),
    ).toBeNull();
  });

  it('propose « Haut de page » vers l’en-tête', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Haut de page' })).toHaveAttribute(
      'href',
      `#${HEADER_ID}`,
    );
  });
});
