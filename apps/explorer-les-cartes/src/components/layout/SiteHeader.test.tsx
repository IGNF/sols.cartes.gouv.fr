import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BRAND, SERVICE_BADGE, SERVICE_BADGE_CLASSES, itemHref } from '../../config/site';
import SiteHeader from './SiteHeader';

const { service, header } = BRAND;

describe('SiteHeader (v1, contenu issu de @sols/brand)', () => {
  it('relie la marque à l’accueil de l’Observatoire, jamais à cartes.gouv.fr', () => {
    render(<SiteHeader />);
    const homeLinks = screen.getAllByTitle(service.homeLinkTitle);
    expect(homeLinks.length).toBeGreaterThan(0);
    for (const link of homeLinks) expect(link).toHaveAttribute('href', header.brandLink);
    // Only the brand must not lead to cartes.gouv.fr; since v1.1 the « Aide » menu links to its help (E10).
    expect(document.querySelector('.fr-header__brand a[href*="cartes.gouv.fr"]')).toBeNull();
  });

  it('affiche le logo GIS Sol en opérateur, le titre et le badge « Explorer »', () => {
    render(<SiteHeader />);
    expect(screen.getAllByAltText(header.operator.logoAlt).length).toBeGreaterThan(0);
    expect(screen.getAllByText(service.title, { exact: false }).length).toBeGreaterThan(0);
    expect(SERVICE_BADGE).toBe('Explorer');
    const badge = screen.getAllByText(SERVICE_BADGE ?? '')[0];
    expect(badge).toHaveClass('fr-badge', 'fr-badge--purple-glycine', 'fr-icon-map-pin-2-fill');
    expect(SERVICE_BADGE_CLASSES).toEqual({
      color: 'fr-badge--purple-glycine',
      icon: 'fr-icon-map-pin-2-fill',
    });
  });

  it('est compact comme l’en-tête de guichet-collaboratif : une rangée, sans slogan ni menu mobile', () => {
    render(<SiteHeader />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('id', 'en-tete');
    expect(banner).toHaveClass('fr-header', 'fr-header--compact');
    expect(
      banner.querySelector('.fr-header__body-row .fr-header__brand.fr-enlarge-link'),
    ).not.toBeNull();
    expect(banner.querySelector('.fr-header__body-row .fr-header__tools-links')).not.toBeNull();
    // Slogan hidden in the compact header (guichet `.fr-header__service-tagline { display: none }`): not rendered.
    expect(screen.queryByText(service.tagline)).not.toBeInTheDocument();
    // No DSFR mobile menu: no « Menu » button, no modal, the tools stay in the row.
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect(banner.querySelector('.fr-header__navbar, .fr-modal')).toBeNull();
    // Copy target read by the DSFR header script, empty and hidden.
    const menuLinks = banner.querySelector('.fr-header__menu-links');
    expect(menuLinks).toBeEmptyDOMElement();
    expect(menuLinks).toHaveAttribute('hidden');
  });

  it('n’a qu’un lien de marque, le titre du service, étendu à tout le bloc (fr-enlarge-link)', () => {
    render(<SiteHeader />);
    const brandBlock = document.querySelector('.fr-header__brand') as HTMLElement;
    const links = within(brandBlock).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(service.title);
    expect(links[0]).toHaveAttribute('href', header.brandLink);
    expect(links[0]).toHaveAttribute('title', service.homeLinkTitle);
    // Marianne: République Française stays in the DOM (flag only, as in guichet).
    expect(brandBlock.querySelector('.fr-logo')).toHaveTextContent(/République\s*Française/);
  });

  it('monte la modale « Paramètres d’affichage » ouverte depuis le pied de page', () => {
    render(<SiteHeader />);
    const modalId = headerFooterDisplayItem.buttonProps['aria-controls'];
    const modal = document.getElementById(modalId ?? '');
    expect(modal?.tagName).toBe('DIALOG');
    expect(modal).toHaveTextContent("Paramètres d'affichage");
  });

  it('n’a ni barre de navigation ni bouton « Se connecter »', () => {
    render(<SiteHeader />);
    expect(screen.queryByRole('navigation', { name: /menu principal/i })).not.toBeInTheDocument();
    expect(document.querySelector('.fr-nav')).toBeNull();
    expect(screen.queryByText(/se connecter/i)).not.toBeInTheDocument();
    expect(header.tools.login).toBe(false);
  });

  it('propose les menus « Aide » et « Services » avec les liens de la marque', async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const tools = document.querySelector('.fr-header__tools') as HTMLElement;
    for (const menu of [header.tools.help, header.tools.services]) {
      const button = within(tools).getByRole('button', { name: menu.label });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      await user.click(button);
      const panel = document.getElementById(
        button.getAttribute('aria-controls') ?? '',
      ) as HTMLElement;
      expect(panel).toBeVisible();
      expect(
        within(panel)
          .getAllByRole('link')
          .map((link) => link.getAttribute('href')),
      ).toEqual(menu.items.map((item) => itemHref(item)));
      await user.click(button);
    }
  });
});
