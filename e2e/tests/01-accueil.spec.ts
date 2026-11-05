import { test, expect } from '@playwright/test';
import { collectConsole, openServicesMenu, GISSOL_URL } from './helpers';

test.describe('Accueil et en-tête v1', () => {
  test('/ redirige vers /fr/', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/fr/');
    expect(new URL(page.url()).pathname).toBe('/fr/');
  });

  test('/fr/ charge avec un seul h1 visible et sans erreur console', async ({ page }) => {
    const c = collectConsole(page);
    await page.goto('/fr/');
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();
    expect(c.errors).toEqual([]);
  });

  test("l'en-tête v1 : pas de barre de navigation, pas de connexion, marque vers l'accueil, logo GIS Sol", async ({
    page,
  }) => {
    await page.goto('/fr/');
    const header = page.locator('header');
    await expect(
      header.locator('#navigation-principale, nav[aria-label="Menu principal"]'),
    ).toHaveCount(0);
    await expect(header.getByText('Se connecter')).toHaveCount(0);
    await expect(header.locator('button', { hasText: 'Aide' }).first()).toBeAttached();
    const hrefs = await header
      .locator('a')
      .evaluateAll((a) => a.map((x) => x.getAttribute('href') ?? ''));
    expect(
      hrefs.filter((h) => /cartes\.gouv\.fr/.test(h)),
      'aucun lien vers cartes.gouv.fr',
    ).toEqual([]);
    await expect(header.locator('img[alt*="GIS Sol"]').first()).toBeVisible();
    await expect(header.locator('.fr-badge')).toHaveCount(0); // pas de badge sur l'edito
  });

  test('le pied de page v1 : partenaires, GIS Sol corrigé, paramètres d\u2019affichage', async ({
    page,
  }) => {
    await page.goto('/fr/');
    const footer = page.locator('footer');
    for (const nom of ['IGN', 'INRAE', 'GIS Sol'])
      await expect(footer.getByRole('link', { name: nom, exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'GIS Sol', exact: true })).toHaveAttribute(
      'href',
      GISSOL_URL,
    );
    await expect(footer.getByRole('button', { name: "Paramètres d'affichage" })).toBeVisible();
    const hrefs = await footer
      .locator('a')
      .evaluateAll((a) => a.map((x) => x.getAttribute('href') ?? ''));
    expect(hrefs.filter((h) => /cartes\.gouv\.fr/.test(h))).toEqual([]);
  });

  test('le menu « Services » ouvre, au clavier aussi, et se ferme avec Échap', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/fr/');
    if (isMobile) await page.locator('header .fr-btn--menu').click();
    const button = page
      .locator('header')
      .getByRole('button', { name: 'Services' })
      .locator('visible=true');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page
        .getByRole('link', { name: /^Rechercher une donnée/ })
        .locator('visible=true')
        .first(),
    ).toBeVisible();
    // Sur mobile, Échap ferme toute la modale du menu burger (comportement DSFR), pas seulement le sous-menu.
    test.skip(
      isMobile,
      'Échap du sous-menu : vérifié sur desktop (la modale mobile se ferme en entier)',
    );
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  const liens: [string, string][] = [
    ['/rechercher-une-donnee/', 'catalogue'],
    ['/explorer-les-cartes/', 'carto'],
  ];
  for (const [href, nom] of liens) {
    test(`le menu « Services » mène à ${nom} : 200 et un h1`, async ({
      page,
      request,
      isMobile,
    }) => {
      await page.goto('/fr/');
      expect((await request.get(href)).status()).toBe(200);
      await openServicesMenu(page, isMobile);
      await page.locator(`header a[href="${href}"]`).locator('visible=true').first().click();
      await page.waitForURL(new RegExp(href.replace(/\/$/, '')), { waitUntil: 'commit' });
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeAttached({
        timeout: 30_000,
      });
      // Un seul h1 visible (sr-only compte comme visible) ; le h1 masqué de la modale DSFR est toléré.
      expect(await page.locator('h1:visible').count(), 'nombre de h1 visibles').toBe(1);
    });
  }

  test('la page Aide existe, avec #contact', async ({ page }) => {
    await page.goto('/fr/aide/');
    await expect(page.getByRole('heading', { level: 1, name: 'Aide' })).toBeVisible();
    await expect(page.locator('#contact')).toBeAttached();
    await page.goto('/fr/aide/#contact');
    await expect(page.locator('#contact')).toBeInViewport();
  });

  test('les paramètres d\u2019affichage appliquent le thème sombre sur /fr/', async ({ page }) => {
    await page.goto('/fr/');
    await page.locator('footer').getByRole('button', { name: "Paramètres d'affichage" }).click();
    const dialog = page.getByRole('dialog', { name: "Paramètres d'affichage" });
    await expect(dialog).toBeVisible();
    await dialog.locator('label', { hasText: 'Sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-fr-theme', 'dark');
    await dialog.getByRole('button', { name: 'Fermer' }).click();
    // Remise à l'état clair pour ne pas polluer le stockage du contexte.
    await page.locator('footer').getByRole('button', { name: "Paramètres d'affichage" }).click();
    await dialog.locator('label', { hasText: 'Clair' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-fr-theme', 'light');
  });

  test('la page d\u2019accueil v1 contient ses sections', async ({ page }) => {
    await page.goto('/fr/');
    const titres = await page.getByRole('heading', { level: 2 }).allInnerTexts();
    for (const t of [
      /Localisez, comprenez/,
      /usages métier/,
      /référentiels structurés/,
      /prochains rendez-vous/,
      /partenaires/i,
    ])
      expect(
        titres.some((x) => t.test(x)),
        `h2 ${t}`,
      ).toBe(true);
    await expect(page.getByRole('link', { name: /Accéder au portail/ })).toBeVisible();
  });

  test('le sélecteur de langue atteint /en/', async ({ page, isMobile }) => {
    await page.goto('/fr/');
    if (isMobile) await page.locator('header .fr-btn--menu').click();
    await page.locator('.fr-translate__btn:visible').click();
    await page.locator('.fr-translate__menu a[hreflang="en"]:visible').click();
    await page.waitForURL('**/en/');
    await expect(page.locator('h1:visible')).toHaveCount(1);
  });
});
