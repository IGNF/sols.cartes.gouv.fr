import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BRAND, SERVICE_BADGE } from '../../config/site';
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

  it('affiche le logo GIS Sol en opérateur, le titre, le badge « Explorer » et le slogan', () => {
    render(<SiteHeader />);
    expect(screen.getAllByAltText(header.operator.logoAlt).length).toBeGreaterThan(0);
    expect(screen.getAllByText(service.title, { exact: false }).length).toBeGreaterThan(0);
    expect(SERVICE_BADGE).toBe('Explorer');
    const badge = screen.getAllByText(SERVICE_BADGE ?? '')[0];
    expect(badge).toHaveClass('fr-badge', 'fr-badge--purple-glycine');
    expect(screen.getAllByText(service.tagline).length).toBeGreaterThan(0);
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
      ).toEqual(menu.items.map((item) => item.href));
      await user.click(button);
    }
  });
});
