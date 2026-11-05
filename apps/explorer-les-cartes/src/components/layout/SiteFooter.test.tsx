import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FOOTER_HOME_TITLE, SITE } from '../../config/site';
import { EXTERNAL_LINKS, FOOTER_DOMAINS, SECTION_PATHS } from '../../config/urls';
import SiteFooter from './SiteFooter';

describe('SiteFooter', () => {
  it('affiche les six liens de contenu dans l’ordre de la brique edito', () => {
    render(<SiteFooter />);
    const footer = screen.getByRole('contentinfo');
    const list = footer.querySelector('.fr-footer__content-list');
    expect(list).not.toBeNull();
    const links = within(list as HTMLElement).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(FOOTER_DOMAINS);
    expect(links[0]).toHaveAttribute('href', `https://${FOOTER_DOMAINS[0]}`);
  });

  it('affiche la mention de licence et le titre du lien d’accueil', () => {
    render(<SiteFooter />);
    expect(screen.getByText(SITE.licenceText, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: SITE.licenceLabel })).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.licenceEtalab,
    );
    expect(screen.getByTitle(FOOTER_HOME_TITLE)).toHaveAttribute('href', SECTION_PATHS.home);
  });
});
