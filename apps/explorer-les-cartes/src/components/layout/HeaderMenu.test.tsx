import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BRAND, HEADER_MENU_ICONS, itemHref, type HeaderMenuSpec } from '../../config/site';
import HeaderMenu from './HeaderMenu';

const menu = BRAND.header.tools.services;

function setup() {
  const user = userEvent.setup();
  render(
    <>
      <HeaderMenu menu={menu} />
      <button type="button">Ailleurs</button>
    </>,
  );
  const button = screen.getByRole('button', { name: menu.label });
  const panel = () =>
    document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLElement;
  return { user, button, panel };
}

describe('HeaderMenu', () => {
  it('s’ouvre et se ferme au clavier (Entrée, Espace)', async () => {
    const { user, button, panel } = setup();
    expect(panel()).not.toBeVisible();
    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toBeVisible();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('liste les services avec leur description', async () => {
    const { user, button } = setup();
    await user.click(button);
    for (const item of menu.items) {
      const link = screen.getByRole('link', { name: new RegExp(item.label) });
      expect(link).toHaveAttribute('href', itemHref(item));
      if (item.description) expect(link).toHaveTextContent(item.description);
    }
  });

  it('se ferme avec Échap depuis un lien et rend le focus au bouton', async () => {
    const { user, button, panel } = setup();
    await user.click(button);
    await user.tab();
    expect(panel()).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(button);
  });

  it('se ferme quand le focus ou un clic sort du menu', async () => {
    const { user, button } = setup();
    await user.click(button);
    await user.click(screen.getByRole('button', { name: 'Ailleurs' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('porte le chevron DSFR piloté par aria-expanded (rotation vérifiée par check:map)', async () => {
    const { user, button } = setup();
    const chevron = button.querySelector('.header-menu__chevron');
    expect(button).toHaveClass('header-menu__btn');
    expect(chevron).toHaveClass('fr-icon-arrow-down-s-line');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button.querySelector('.header-menu__chevron')).toBe(chevron);
  });

  it('connaît les icônes des menus de la marque', () => {
    for (const tool of [BRAND.header.tools.help, BRAND.header.tools.services]) {
      expect(HEADER_MENU_ICONS).toContain(tool.icon);
    }
  });

  it('rend les items E10 : lien externe localisé, icône avant, nouvelle fenêtre ; lien interne inchangé', async () => {
    // Shape of packages/brand/brand.json on feat/E10-header-v1.1 (PR #70), plus one internal item.
    const fixture: HeaderMenuSpec = {
      label: 'Aide',
      icon: 'fr-icon-question-fill',
      items: [
        {
          label: "Centre d'aide",
          href: 'https://cartes.gouv.fr/aide/fr/',
          hrefTemplate: 'https://cartes.gouv.fr/aide/{lang}/',
          icon: 'fr-icon-question-mark',
          external: true,
        },
        { label: 'Nous contacter', href: '/fr/aide/#contact' },
        { label: 'Absolu sans drapeau', href: 'https://example.org/', icon: 'fr-icon-inconnue' },
      ],
    };
    const user = userEvent.setup();
    render(<HeaderMenu menu={fixture} />);
    await user.click(screen.getByRole('button', { name: 'Aide' }));
    const external = screen.getByRole('link', { name: "Centre d'aide" });
    expect(external).toHaveAttribute('href', 'https://cartes.gouv.fr/aide/fr/');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener external');
    expect(external).toHaveAttribute('title', "Centre d'aide - nouvelle fenêtre");
    expect(external).toHaveClass('fr-nav__link', 'fr-icon-question-mark', 'fr-link--icon-left');

    const internal = screen.getByRole('link', { name: 'Nous contacter' });
    expect(internal).toHaveAttribute('href', '/fr/aide/#contact');
    expect(internal).not.toHaveAttribute('target');
    expect(internal).not.toHaveAttribute('rel');
    expect(internal).not.toHaveAttribute('title');
    expect(internal.className).not.toMatch(/fr-icon-|fr-link--icon-left/);

    const absolute = screen.getByRole('link', { name: 'Absolu sans drapeau' });
    expect(absolute).toHaveAttribute('target', '_blank');
    expect(absolute.className).not.toMatch(/fr-icon-|fr-link--icon-left/);
  });

  it('résout le gabarit {lang} en français', () => {
    expect(
      itemHref({
        label: 'x',
        href: '/a/',
        hrefTemplate: 'https://cartes.gouv.fr/aide/{lang}/nous-ecrire/',
      }),
    ).toBe('https://cartes.gouv.fr/aide/fr/nous-ecrire/');
    expect(itemHref({ label: 'x', href: '/fr/aide/#contact' })).toBe('/fr/aide/#contact');
  });

  it('connaît les icônes des items de la marque', () => {
    for (const tool of [BRAND.header.tools.help, BRAND.header.tools.services]) {
      for (const item of tool.items as HeaderMenuSpec['items'])
        if (item.icon) expect(HEADER_MENU_ICONS).toContain(item.icon);
    }
  });
});
