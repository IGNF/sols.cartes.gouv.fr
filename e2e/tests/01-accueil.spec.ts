import { test, expect } from '@playwright/test';
import { collectConsole } from './helpers';

test.describe('Accueil', () => {
  test('/ redirige vers /fr/', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/fr/');
    expect(new URL(page.url()).pathname).toBe('/fr/');
  });

  test('/fr/ charge avec un seul h1 et sans erreur console', async ({ page }) => {
    const c = collectConsole(page);
    await page.goto('/fr/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header[role="banner"], header').first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();
    expect(c.errors).toEqual([]);
  });

  for (const [href, nom] of [
    ['/rechercher-une-donnee/', 'catalogue'],
    ['/explorer-les-cartes/', 'carto'],
  ]) {
    test(`le lien d'en-tête vers ${nom} répond 200 et affiche un h1`, async ({ page, request, isMobile }) => {
      await page.goto('/fr/');
      const link = page.locator(`header a[href="${href}"], header a[href="${href.replace(/\/$/, '')}"]`).first();
      await expect(link, `lien ${href} absent de l'en-tête`).toHaveCount(1);
      const resp = await request.get(href);
      expect(resp.status()).toBe(200);
      if (isMobile) await page.locator('header .fr-btn--menu').click();
      await link.click();
      await page.waitForURL(new RegExp(`${href.replace(/\/$/, '')}`), { waitUntil: 'commit' });
      await expect(page.locator('main h1').first()).toBeVisible({ timeout: 30_000 });
      // Un seul h1 par page (RGAA) ; le h1 de la modale DSFR « Paramètres d'affichage » compte comme second.
      expect.soft(await page.locator('h1').count(), 'nombre de h1 dans la page').toBe(1);
    });
  }

  test('le sélecteur de langue atteint /en/', async ({ page, isMobile }) => {
    await page.goto('/fr/');
    if (isMobile) await page.locator('header .fr-btn--menu').click();
    await page.locator('.fr-translate__btn:visible').click();
    await page.locator('.fr-translate__menu a[hreflang="en"]:visible').click();
    await page.waitForURL('**/en/');
    await expect(page.locator('h1')).toHaveCount(1);
  });
});
