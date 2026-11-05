import { test, expect } from '@playwright/test';
import { collectConsole, GPF_WMTS, DEEP_LINK_LAYER, DEEP_LINK_URL } from './helpers';

test.describe('Carto', () => {
  test('la carte affiche un canvas, les tuiles GPF répondent 200 et le sélecteur de couches fonctionne', async ({
    page,
  }, testInfo) => {
    const c = collectConsole(page);
    const tiles: { url: string; status: number }[] = [];
    page.on('response', (r) => {
      if (r.url().includes(GPF_WMTS)) tiles.push({ url: r.url(), status: r.status() });
    });
    await page.goto('/explorer-les-cartes/');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => tiles.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const bad = tiles.filter((t) => t.status !== 200);
    testInfo.annotations.push({
      type: 'tuiles',
      description: `${tiles.length} requêtes WMTS, ${bad.length} non-200 (flake M-2 toléré)`,
    });
    expect(tiles.filter((t) => t.status === 200).length).toBeGreaterThan(0);
    expect(
      bad.length,
      `trop de tuiles non-200: ${bad
        .slice(0, 3)
        .map((b) => b.status + ' ' + b.url)
        .join(' | ')}`,
    ).toBeLessThanOrEqual(Math.ceil(tiles.length * 0.1));

    // Sélecteur de couches
    const toggle = page
      .locator(
        '.gpf-widget-button, [id^="GPshowLayersListPicto"], [id^="GPshowLayerSwitcher"], button[aria-label*="couches" i]',
      )
      .first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(
      page
        .locator('.GPlayerSwitcher, [id^="GPlayerSwitcher"], .gpf-panel__layerswitcher, .GPwidget')
        .first(),
    ).toBeVisible();
    // Tolérance documentée (question M-2) : 400/404 ponctuels de tuiles WMTS GPF, comptés ci-dessus.
    const flake =
      /Failed to load resource: the server responded with a status of (400|404).*data\.geopf\.fr\/wmts/;
    expect(c.errors.filter((e) => !flake.test(e))).toEqual([]);
  });

  test('le panneau « Fonds de carte » bascule sur les orthophotos', async ({ page }) => {
    const tiles: { url: string; status: number }[] = [];
    page.on('response', (r) => {
      if (r.url().includes(GPF_WMTS)) tiles.push({ url: r.url(), status: r.status() });
    });
    await page.goto('/explorer-les-cartes/');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Ma sélection de cartes' }).click();
    const fonds = page.getByRole('button', { name: /fonds de carte/i });
    test.skip(
      (await fonds.count()) === 0,
      'PENDING (M3) : pas de panneau « Fonds de carte » sur main (seul « Plan IGN » est listé)',
    );
    await fonds.first().click();
    const before = tiles.length;
    await page
      .getByText(/orthophoto/i)
      .first()
      .click();
    await expect
      .poll(() => tiles.slice(before).filter((t) => /ORTHOIMAGERY/i.test(t.url)).length, {
        timeout: 30_000,
      })
      .toBeGreaterThan(0);
    const ortho = tiles.filter((t) => /ORTHOIMAGERY/i.test(t.url));
    const bad = ortho.filter((t) => t.status !== 200);
    expect(bad.length).toBeLessThanOrEqual(Math.ceil(ortho.length * 0.1));
  });

  test.skip('PENDING (M4) : le lien profond ajoute la couche sols au sélecteur', async ({
    page,
  }) => {
    // Passe 2 : attendre une requête WMS réussie sur data.geopf.fr/wms-v et la couche dans le sélecteur.
    await page.goto(
      `/explorer-les-cartes/?layer=${DEEP_LINK_LAYER}&type=WMS&url=${encodeURIComponent(DEEP_LINK_URL)}`,
    );
  });
});
