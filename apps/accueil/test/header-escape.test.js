import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

const HEADER_JS = join(import.meta.dir, '..', 'src', 'js', 'header.js');

/** Minimal header: one tool menu on the desktop bar and its copy in the mobile menu. */
const MARKUP = `
<header class="fr-header">
  <div class="fr-header__tools-links">
    <div class="fr-nav"><div class="fr-nav__item">
      <button type="button" aria-expanded="false" aria-controls="menu-help">Aide</button>
      <div class="fr-collapse fr-menu" id="menu-help"><ul class="fr-menu__list">
        <li><a class="fr-nav__link" href="https://cartes.gouv.fr/aide/fr/" target="_blank">Centre d'aide</a></li>
      </ul></div>
    </div></div>
  </div>
  <div class="fr-header__menu fr-modal" id="menu-principal"><div class="fr-header__menu-links">
    <div class="fr-nav"><div class="fr-nav__item">
      <button type="button" aria-expanded="false" aria-controls="menu-help-mobile">Aide</button>
      <div class="fr-collapse fr-menu" id="menu-help-mobile"><ul class="fr-menu__list">
        <li><a class="fr-nav__link" href="https://cartes.gouv.fr/aide/fr/" target="_blank">Centre d'aide</a></li>
      </ul></div>
    </div></div>
  </div></div>
</header>
<a id="ailleurs" href="#">Ailleurs</a>`;

let reachedRoot = 0;

beforeAll(async () => {
  GlobalRegistrator.register();
  // Stand-in for DSFR's root listener (capture on <html>): counts the events it would see.
  document.documentElement.addEventListener('keydown', () => (reachedRoot += 1), { capture: true });
  await import(HEADER_JS);
});
afterAll(() => GlobalRegistrator.unregister());

beforeEach(() => {
  reachedRoot = 0;
  document.body.innerHTML = MARKUP;
  // Stand-in for the DSFR disclosure: a click toggles aria-expanded.
  for (const button of document.querySelectorAll('button[aria-controls]')) {
    button.addEventListener('click', () =>
      button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true')),
    );
  }
});

const escape = (element) =>
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );

describe.each([
  ['bureau', 'menu-help'],
  ['mobile', 'menu-help-mobile'],
])('Échap dans un menu d’outils ouvert (%s)', (_, id) => {
  test('depuis un lien du menu : ferme le menu, focus sur le bouton, DSFR ne voit pas la touche', () => {
    const button = document.querySelector(`[aria-controls="${id}"]`);
    button.click();
    const link = document.querySelector(`#${id} a`);
    link.focus();
    escape(link);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
    expect(reachedRoot).toBe(0);
  });

  test('depuis le bouton : ferme le menu', () => {
    const button = document.querySelector(`[aria-controls="${id}"]`);
    button.click();
    button.focus();
    escape(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(reachedRoot).toBe(0);
  });
});

describe('Échap sans menu ouvert', () => {
  test('laisse passer la touche (DSFR ferme alors la modale mobile)', () => {
    const button = document.querySelector('[aria-controls="menu-help-mobile"]');
    button.focus();
    escape(button);
    expect(reachedRoot).toBe(1);
    escape(document.getElementById('ailleurs'));
    expect(reachedRoot).toBe(2);
  });
});
