import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  PAGES,
  collectConsole,
  openServicesMenu,
  openAideMenu,
  waitForCatalogueResults,
} from './helpers';

const PUBLIER_URL = 'https://cartes.gouv.fr/publier-une-donnee';
const CGU_URL = 'https://cartes.gouv.fr/cgu/';
const DONNEES_PERSO_URL = 'https://cartes.gouv.fr/donnees-personnelles/';

test.describe('Carto : en-tête compact (#5)', () => {
  test('rangée unique de 56 px, sans bouton « Menu », sans débordement', async ({ page }) => {
    const c = collectConsole(page);
    await page.goto(PAGES.carto);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
    const header = page.locator('header#en-tete.fr-header--compact');
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box?.height ?? 999, 'hauteur de l’en-tête').toBeLessThanOrEqual(57);
    await expect(page.locator('header .fr-btn--menu')).toHaveCount(0);
    await expect(page.locator('header .fr-header__navbar')).toHaveCount(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'débordement horizontal').toBeLessThanOrEqual(0);
    expect(c.errors.filter((e) => !/data\.geopf\.fr/.test(e))).toEqual([]);
  });

  test('« Aide » et « Services » sont accessibles sans menu burger', async ({ page, isMobile }) => {
    await page.goto(PAGES.carto);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
    for (const nom of ['Aide', 'Services']) {
      const bouton = page
        .locator('.fr-header__tools')
        .getByRole('button', { name: nom })
        .locator('visible=true');
      await expect(bouton).toHaveCount(1);
      const box = await bouton.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(0);
      if (isMobile) expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    }
    await openAideMenu(page, isMobile);
    await expect(
      page.locator('header a[href^="https://cartes.gouv.fr/aide/"]').locator('visible=true'),
    ).toHaveCount(2);
  });

  test('le menu « Services » reste dans l’écran à l’ouverture', async ({ page, isMobile }) => {
    await page.goto(PAGES.carto);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
    await openServicesMenu(page, isMobile);
    const vw = page.viewportSize()?.width ?? 0;
    const lien = page.locator(`header a[href="${PUBLIER_URL}"]`).locator('visible=true');
    await expect(lien).toBeVisible();
    const box = await lien.boundingBox();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(vw);
  });
});

test.describe('« Publier une donnée » dans le menu Services', () => {
  const briques = {
    edito: PAGES.home,
    catalogue: PAGES.catalogue,
    carto: PAGES.carto,
  } as const;
  for (const [nom, path] of Object.entries(briques)) {
    test(`présent et externe sur ${nom}`, async ({ page, isMobile }) => {
      await page.goto(path);
      if (nom === 'catalogue') await waitForCatalogueResults(page);
      await openServicesMenu(page, isMobile);
      const lien = page
        .locator('header')
        .getByRole('link', { name: 'Publier une donnée' })
        .locator('visible=true');
      await expect(lien).toHaveCount(1);
      await expect(lien).toHaveAttribute('href', PUBLIER_URL);
      await expect(lien).toHaveAttribute('target', '_blank');
      await expect(lien).toHaveAttribute('rel', /noopener/);
    });
  }
});

test.describe('Pied de page : liens légaux', () => {
  test('CGU et données personnelles pointent vers cartes.gouv.fr', async ({ page }) => {
    await page.goto(PAGES.home);
    const footer = page.locator('footer');
    for (const [nom, href] of [
      ["Conditions générales d'utilisation", CGU_URL],
      ['Données personnelles', DONNEES_PERSO_URL],
    ]) {
      const lien = footer.getByRole('link', { name: nom });
      await expect(lien).toHaveCount(1);
      await expect(lien).toHaveAttribute('href', href);
      await expect(lien).toHaveAttribute('target', '_blank');
      await expect(lien).toHaveAttribute('rel', /noopener/);
    }
  });

  test('« Mentions légales » mène à /mentions-legales/ (h1, axe propre)', async ({
    page,
    isMobile,
  }) => {
    await page.goto(PAGES.home);
    await page.locator('footer').getByRole('link', { name: 'Mentions légales' }).click();
    await page.waitForURL('**/mentions-legales/');
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page).toHaveTitle(/Mentions légales/);
    if (!isMobile) {
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(
        violations
          .filter((v) => v.impact === 'critical' || v.impact === 'serious')
          .map((v) => `${v.id}: ${v.help}`),
      ).toEqual([]);
    }
  });
});
