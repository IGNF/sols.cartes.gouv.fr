import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BRAND } from '../../config/site';
import HeaderMenu, { HEADER_MENU_ICONS } from './HeaderMenu';

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
      expect(link).toHaveAttribute('href', item.href);
      if ('description' in item && item.description)
        expect(link).toHaveTextContent(item.description);
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

  it('connaît les icônes des menus de la marque', () => {
    for (const tool of [BRAND.header.tools.help, BRAND.header.tools.services]) {
      expect(HEADER_MENU_ICONS).toContain(tool.icon);
    }
  });
});
