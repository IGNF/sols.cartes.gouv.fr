import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FOOTER_ID } from '../../config/landmarks';
import { BRAND, FOOTER_LABELS, FOOTER_PARTNERS } from '../../config/site';
import SiteFooter from './SiteFooter';

const { footer } = BRAND;

function setup() {
  const user = userEvent.setup();
  render(<SiteFooter />);
  const root = screen.getByRole('contentinfo');
  const toggle = within(root).getByRole('button', { name: FOOTER_LABELS.expand });
  const block = (selector: string) => root.querySelector(selector) as HTMLElement;
  return { user, root, toggle, block };
}

describe('SiteFooter (pied de page extensible, M13)', () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('replié par défaut : seule la barre basse (liens de la marque, « Paramètres d’affichage ») est visible', () => {
    expect(footer.compactOnCarto).toBe(true);
    const { root, toggle, block } = setup();
    expect(root).toHaveAttribute('id', FOOTER_ID);
    expect(root).toHaveClass('compact-footer--collapsed');
    const list = block('.fr-footer__bottom-list');
    for (const link of footer.bottomLinks) {
      expect(within(list).getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      );
    }
    expect(
      within(list).getByRole('button', { name: /paramètres d.affichage/i }),
    ).toBeInTheDocument();
    for (const selector of ['.fr-footer__body', '.fr-footer__partners', '.fr-footer__bottom-copy'])
      expect(block(selector)).not.toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', FOOTER_ID);
    expect(toggle).toHaveClass('fr-btn--tertiary', 'fr-btn--sm', 'fr-icon-arrow-up-line');
  });

  it('« Haut de page » déplie le pied de page complet et fait défiler vers le bas', async () => {
    const { user, root, toggle, block } = setup();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName(FOOTER_LABELS.collapse);
    expect(toggle).toHaveClass('fr-icon-close-line');
    expect(toggle).toHaveFocus();
    expect(root).not.toHaveClass('compact-footer--collapsed');
    for (const selector of ['.fr-footer__body', '.fr-footer__partners', '.fr-footer__bottom-copy'])
      expect(block(selector)).toBeVisible();
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      }),
    );
  });

  it('« Fermer » replie le pied de page et remonte en haut de page', async () => {
    const { user, root, toggle, block } = setup();
    await user.click(toggle);
    await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(1));
    await user.click(toggle);
    await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(2));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName(FOOTER_LABELS.expand);
    expect(toggle).toHaveFocus();
    expect(root).toHaveClass('compact-footer--collapsed');
    expect(block('.fr-footer__partners')).not.toBeVisible();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
  });

  it('sans animation quand l’utilisateur préfère réduire les animations', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' })),
    );
    const { user, toggle } = setup();
    await user.click(toggle);
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' })),
    );
  });

  it('reprend le contenu du pied de page de l’accueil (marque, description, liens, partenaires, licence)', async () => {
    const { user, root, toggle } = setup();
    await user.click(toggle);
    expect(within(root).getByTitle(BRAND.service.homeLinkTitle)).toHaveAttribute(
      'href',
      BRAND.header.brandLink,
    );
    expect(root).toHaveTextContent(footer.description);
    for (const link of footer.contentLinks) {
      const anchor = within(root).getByRole('link', { name: link.label });
      expect(anchor).toHaveAttribute('href', link.href);
      expect(anchor).toHaveAttribute('target', '_blank');
      expect(anchor).toHaveAttribute('rel', 'noopener external');
      expect(anchor).toHaveAttribute('title', `${link.label} - nouvelle fenêtre`);
    }
    expect(within(root).getByRole('heading', { level: 2, name: 'Nos partenaires' })).toBeVisible();
    expect(FOOTER_PARTNERS).toHaveLength(footer.partners.length);
    for (const partner of footer.partners) {
      const logo = within(root).getByRole('img', { name: partner.name });
      expect(logo.closest('a')).toHaveAttribute('href', partner.href);
      expect(logo.closest('a')).toHaveAttribute('target', '_blank');
    }
    const licence = within(root).getByRole('link', { name: footer.licence.label });
    expect(licence).toHaveAttribute('href', footer.licence.href);
    expect(licence.closest('p')).toHaveTextContent(footer.licence.text);
  });
});
