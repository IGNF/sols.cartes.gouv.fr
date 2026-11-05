import { beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import accueil from '../src/_data/accueil.js';
import site from '../src/_data/site.js';

const APP_DIR = join(import.meta.dir, '..');
const DIST = join(APP_DIR, 'dist');
const EDITO_DOC = join(APP_DIR, '..', '..', 'doc', 'agents', 'edito.md');
const FOOTER_PAGES = [
  site.sections.accessibilite,
  site.sections.mentionsLegales,
  site.sections.donneesPersonnelles,
  site.sections.planDuSite,
];

const read = (url) => readFileSync(join(DIST, url, 'index.html'), 'utf8');
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let home = '';

beforeAll(() => {
  const build = Bun.spawnSync(['bun', 'run', 'build'], {
    cwd: APP_DIR,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (build.exitCode !== 0) throw new Error(build.stderr.toString());
  home = read('/');
});

function expectPageBasics(html) {
  expect(html).toMatch(/<html lang="fr"/);
  expect(html).toMatch(/<title>[^<]+<\/title>/);
  expect(html).toMatch(/<meta name="description" content="[^"]+">/);
  expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  expect(html).toContain('href="#contenu"');
  expect(html).toMatch(/<main id="contenu"/);
}

describe('page d’accueil générée', () => {
  test('respecte le gabarit de base', () => {
    expectPageBasics(home);
  });

  test('affiche le titre de service et la devise de l’en-tête', () => {
    expect(home).toContain(`<p class="fr-header__service-title">${site.header.serviceTitle}</p>`);
    expect(home).toContain(`<p class="fr-header__service-tagline">${site.header.tagline}</p>`);
  });

  test('contient les trois liens de navigation, Accueil étant la page courante', () => {
    for (const item of site.header.nav) {
      expect(home).toMatch(
        new RegExp(`class="fr-nav__link" href="${escape(item.href)}"[^>]*>${escape(item.label)}<`),
      );
    }
    expect(home).toMatch(/href="\/" target="_self" aria-current="page">Accueil</);
  });

  test('propose les boutons vers le catalogue et la carto', () => {
    expect(home).toContain(`href="${site.sections.rechercherUneDonnee}">Rechercher une donnée</a>`);
    expect(home).toContain(`href="${site.sections.explorerLesCartes}">Explorer les cartes</a>`);
  });

  test('contient les sections Le service, Données disponibles et GIS Sol', () => {
    expect(home.match(/class="fr-tile"/g)).toHaveLength(accueil.service.items.length);
    expect(home.match(/class="fr-card fr-enlarge-link"/g)).toHaveLength(
      accueil.donnees.items.length,
    );
    expect(home).toContain('class="fr-callout');
    expect(home).toMatch(new RegExp(`class="fr-btn" href="${escape(site.external.gissol)}"`));
  });

  test('copie les ressources DSFR et les pictogrammes référencés', () => {
    const assets = ['dsfr.min.css', 'dsfr.module.min.js', 'fonts/Marianne-Regular.woff2'];
    for (const item of accueil.service.items) assets.push(`artwork/pictograms/${item.pictogram}`);
    for (const asset of assets) expect(existsSync(join(DIST, 'dsfr', asset))).toBe(true);
    expect(existsSync(join(DIST, 'css', 'site.css'))).toBe(true);
  });
});

describe('pages du pied de page', () => {
  test.each(FOOTER_PAGES)('%s existe et respecte le gabarit', (url) => {
    const html = read(url);
    expectPageBasics(html);
    expect(html).toContain('class="fr-breadcrumb"');
  });

  test('le plan du site liste toutes les sections', () => {
    const html = read(site.sections.planDuSite);
    for (const link of [...site.header.nav, ...site.footer.bottomLinks]) {
      expect(html).toContain(`<li><a href="${link.href}"`);
    }
  });
});

describe('documentation doc/agents/edito.md', () => {
  test('chaque bloc HTML est identique octet pour octet à dist/index.html', () => {
    const blocks = [...readFileSync(EDITO_DOC, 'utf8').matchAll(/```html\n([\s\S]*?)\n```/g)];
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const [, block] of blocks) expect(home.includes(block)).toBe(true);
  });
});
