import { beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import accueil from '../src/_data/accueil.js';
import agenda from '../src/_data/agenda.json';
import i18n from './i18n.js';
import brand from '@sols/brand';
import site from '../src/_data/site.js';
import {
  APP_DIR,
  DIST,
  FOOTER_PATHS,
  LOCALES,
  SHARED_PAGE,
  articleSlugs,
  build,
  escape,
  html,
  read,
} from './helpers.js';

const EDITO_DOC = join(APP_DIR, '..', '..', 'doc', 'agents', 'edito.md');
const headerOf = (html) => html.slice(html.indexOf('<header'), html.indexOf('</header>'));

beforeAll(build);

function expectPageBasics(html, locale) {
  expect(html).toContain(`<html lang="${locale}"`);
  expect(html).toMatch(/<title>[^<]+<\/title>/);
  expect(html).toMatch(/<meta name="description" content="[^"]+">/);
  expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  expect(html).toContain('href="#contenu"');
  expect(html).toMatch(/<main id="contenu"/);
}

describe.each(LOCALES)('accueil /%s/', (locale) => {
  const t = i18n[locale];
  const home = () => read(`/${locale}/`);

  test('respecte le gabarit de base dans la bonne langue', () => {
    expectPageBasics(home(), locale);
  });

  test('affiche le titre de service et la devise', () => {
    expect(home()).toContain(`<p class="fr-header__service-title">${site.header.serviceTitle}</p>`);
    expect(home()).toContain(`<p class="fr-header__service-tagline">${t.tagline}</p>`);
  });

  test('en-tête v1 : pas de barre de navigation, marque et logos vers l’accueil', () => {
    const header = headerOf(home());
    expect(header).not.toContain('fr-nav__list');
    expect(header).not.toContain('navigation-principale');
    expect(header).not.toMatch(/Se connecter|Log in/);
    expect(header).toContain(`<a class="sols-operator" href="/${locale}/"`);
    expect(header).toContain(
      `src="${site.header.operator.logo}" alt="${html(t.header.operatorLogoAlt)}"`,
    );
    expect(header).toContain(`src="${site.header.operator.mark}" alt=""`);
    expect(header).not.toContain('class="fr-badge');
  });

  test('menus Aide et Services avec leurs entrées', () => {
    const header = headerOf(home());
    for (const tool of site.header.tools) {
      expect(header).toContain(
        `class="fr-btn ${tool.icon} fr-btn--icon-left sols-tool-menu__btn" aria-expanded="false" aria-controls="${tool.id}">${t.header.tools[tool.key].label}</button>`,
      );
      expect(header).toContain(
        `<div class="fr-collapse fr-menu sols-tool-menu__menu" id="${tool.id}">`,
      );
      for (const entry of tool.items) {
        expect(t.header.tools[tool.key].items[entry.key]).toBeDefined();
        expect(header).toContain(`>${html(t.header.tools[tool.key].items[entry.key].label)}`);
      }
    }
    // « Centre d'aide » follows the page language; « Nous contacter » exists only in French
    // (cartes.gouv.fr/aide/en/nous-ecrire/ is a 404), hence hreflang="fr" on English pages.
    // Both open in a new window, with the DSFR icon before and the external-link icon after.
    const contactHreflang =
      locale === site.defaultLanguage ? '' : ` hreflang="${site.defaultLanguage}"`;
    for (const [path, hreflang] of [
      [`https://cartes.gouv.fr/aide/${locale}/`, ''],
      ['https://cartes.gouv.fr/aide/fr/nous-ecrire/', contactHreflang],
    ]) {
      expect(header).toMatch(
        new RegExp(
          `class="fr-nav__link fr-link--icon-left fr-icon-[a-z-]+ sols-tool-menu__external" href="${escape(path)}"${escape(hreflang)} target="_blank" rel="noopener external"`,
        ),
      );
    }
    expect(header).not.toContain('/aide/en/nous-ecrire/');
    expect(header).not.toContain(`href="/${locale}${site.sections.aide}`);
    for (const path of site.crossBrick) expect(header).toContain(`href="${path}"`);
  });

  test('pied de page v1 : partenaires, paramètres d’affichage', () => {
    const html = home();
    expect(html).toContain('class="fr-footer__partners"');
    for (const partner of site.footer.partners) {
      expect(html).toContain(`href="${partner.href}"`);
      expect(html).toContain(`src="${partner.logo}" alt="${partner.name}"`);
      expect(existsSync(join(DIST, partner.logo))).toBe(true);
    }
    expect(html).toContain('aria-controls="fr-theme-modal" data-fr-opened="false">');
    expect(html).toContain('<dialog id="fr-theme-modal" class="fr-modal"');
    for (const theme of site.display.themes) {
      expect(html).toContain(`id="fr-radios-theme-${theme.value}" name="fr-radios-theme"`);
    }
  });

  test('sélecteur de langue DSFR avec chaque langue', () => {
    expect(home()).toContain('class="fr-translate fr-nav"');
    expect(home()).toContain(
      `title="${t.header.translateTitle}" type="button" class="fr-translate__btn fr-btn"`,
    );
    for (const code of LOCALES) {
      const current = code === locale ? ' aria-current="true"' : '';
      expect(home()).toContain(`hreflang="${code}" lang="${code}" href="/${code}/"${current}>`);
    }
  });

  test('héros : textes de la maquette, deux boutons réels, trois chiffres clés', () => {
    expect(home()).toContain(`<h1>${html(t.accueil.hero.title)}</h1>`);
    for (const action of accueil.actions) {
      expect(home()).toContain(`href="${action.href}"`);
      expect(home()).toContain(`>${html(t.accueil.hero.actions[action.key])}</a>`);
    }
    for (const key of accueil.figures) {
      expect(home()).toContain(`>${html(t.accueil.hero.figures[key].value)}</span>`);
    }
  });

  test('plan des titres : un h1, un h2 par section dans l’ordre de la maquette', () => {
    const h2 = [...home().matchAll(/<h2[^>]*id="(titre-[a-z]+)"/g)].map(([, id]) => id);
    expect(h2).toEqual([
      'titre-service',
      'titre-usages',
      'titre-donnees',
      'titre-agenda',
      'titre-articles',
      'titre-partenaires',
    ]);
    const main = home().slice(home().indexOf('<main'), home().indexOf('</main>'));
    const levels = [...main.matchAll(/<h([1-6])[\s>]/g)].map(([, level]) => Number(level));
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('« Le service » : frise Sans / Avec et trois tuiles', () => {
    for (const side of ['without', 'with']) {
      const column = t.accueil.service.frieze[side];
      expect(home()).toContain(
        `<h3 class="sols-frieze__title fr-text--sm">${html(column.title)}</h3>`,
      );
      for (const item of column.items) expect(home()).toContain(html(item));
    }
    expect(home().match(/class="sols-frieze__item"/g)).toHaveLength(8);
    expect(home().match(/class="fr-tile"/g)).toHaveLength(accueil.service.length);
  });

  test('« Cas d’usage » : trois cartes illustrées avec trois puces chacune', () => {
    for (const usage of accueil.usages) {
      expect(home()).toContain(
        `src="${usage.image}" alt="" width="${usage.width}" height="${usage.height}"`,
      );
      expect(existsSync(join(DIST, usage.image))).toBe(true);
      expect(home()).toContain(html(t.accueil.usages.items[usage.key].title));
    }
    expect(home().match(/<ul class="sols-usage__points">/g)).toHaveLength(accueil.usages.length);
  });

  test('« Données disponibles » : étiquettes, ligne Usage et bandeau vers le catalogue', () => {
    const tags = accueil.donnees.items.reduce((total, item) => total + item.tags.length, 0);
    expect(home().match(/<p class="fr-tag fr-tag--sm">/g)).toHaveLength(tags);
    expect(home().match(/class="fr-tags-group sols-data-tags"/g)).toHaveLength(3);
    expect(home()).toMatch(
      new RegExp(`class="fr-btn sols-banner__btn" href="${escape(accueil.donnees.href)}"`),
    );
  });

  test('« Agenda » : événements à venir seulement, carrousel avec boutons et script', () => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = agenda.events.filter((event) => event.date >= today);
    const cards = home().match(/class="fr-card sols-event"/g) ?? [];
    expect(cards).toHaveLength(upcoming.length);
    for (const event of agenda.events) {
      const shown = home().includes(`datetime="${event.date}T${event.time}"`);
      expect(shown).toBe(event.date >= today);
    }
    if (upcoming.length > 0) {
      expect(home()).toContain('data-sols-carousel-previous');
      expect(home()).toContain('data-sols-carousel-next');
      expect(home()).toContain(`src="${site.assets.js}/carousel.js"`);
      expect(home()).toContain(`href="/${locale}${site.sections.aide}#contact"`);
    } else {
      expect(home()).toContain(html(t.accueil.agenda.empty));
    }
  });

  test('« Partenaires » : logos, lien GIS Sol et encadré vers le contact', () => {
    for (const partner of accueil.partners)
      expect(home()).toContain(`src="${partner.logo}" alt="${partner.name}"`);
    expect(home()).toContain(`href="${site.external.gissol}"`);
    expect(home()).toContain('class="fr-callout fr-callout--green-emeraude');
    expect(home()).toContain(`href="/${locale}${site.sections.articles}"`);
  });
});

describe.each(LOCALES)('pages du pied de page /%s/', (locale) => {
  test.each(FOOTER_PATHS)(`/${locale}%s existe, avec fil d’Ariane`, (path) => {
    const html = read(`/${locale}${path}`);
    expectPageBasics(html, locale);
    expect(html).toContain('class="fr-breadcrumb"');
    expect(html).toContain(
      `<a class="fr-footer__bottom-link" href="/${locale}${path}" aria-current="page">`,
    );
  });

  test('le plan du site lie les pages du pied de page, la navigation et les articles', () => {
    const html = read(`/${locale}${site.sections.planDuSite}`);
    for (const path of [
      ...FOOTER_PATHS,
      site.sections.articles,
      site.sections.accueil,
      site.sections.aide,
    ]) {
      expect(html).toContain(`<li><a href="/${locale}${path}"`);
    }
    for (const path of site.crossBrick) expect(html).toContain(`<li><a href="${path}"`);
  });
});

describe.each(LOCALES)('aide /%s/', (locale) => {
  test('centre d’aide : trois accordéons et section #contact avec mailto', () => {
    const html = read(`/${locale}${site.sections.aide}`);
    expectPageBasics(html, locale);
    expect(html.match(/class="fr-accordion"/g)).toHaveLength(i18n[locale].pages.aide.faq.length);
    expect(html).toContain(`<h2 id="contact"`);
    expect(html).toContain(
      `href="https://cartes.gouv.fr/aide/fr/nous-ecrire/"${locale === site.defaultLanguage ? '' : ` hreflang="${site.defaultLanguage}"`} target="_blank"`,
    );
  });
});

describe.each(LOCALES)('articles /%s/', (locale) => {
  const slugs = articleSlugs(locale);

  test('la liste contient une carte datée par article de la langue', () => {
    expect(slugs.length).toBeGreaterThan(0);
    const html = read(`/${locale}${site.sections.articles}`);
    expectPageBasics(html, locale);
    for (const slug of slugs) {
      expect(html).toContain(`<a href="/${locale}${site.sections.articles}${slug}/">`);
    }
    expect(html.match(/class="fr-card fr-enlarge-link"/g)).toHaveLength(slugs.length);
    expect(html.match(/<time datetime="\d{4}-\d{2}-\d{2}">/g)).toHaveLength(slugs.length);
  });

  test.each(slugs)('l’article %s a un h1, le fil d’Ariane et sa date', (slug) => {
    const html = read(`/${locale}${site.sections.articles}${slug}/`);
    expectPageBasics(html, locale);
    expect(html).toContain(
      `<a class="fr-breadcrumb__link" href="/${locale}${site.sections.articles}">${i18n[locale].breadcrumb.articles}</a>`,
    );
    expect(html).toMatch(/<time datetime="\d{4}-\d{2}-\d{2}">[^<]+<\/time>/);
  });
});

describe('pages de renvoi sans langue', () => {
  const paths = [
    site.sections.accueil,
    ...FOOTER_PATHS,
    site.sections.articles,
    site.sections.aide,
  ];

  test.each(paths)('%s renvoie vers la version française, sans JS', (path) => {
    const html = read(path);
    expect(html).toContain(`<html lang="${site.defaultLanguage}">`);
    expect(html).toContain(
      `<meta http-equiv="refresh" content="0; url=/${site.defaultLanguage}${path}">`,
    );
    expect(html).not.toContain('<script');
    for (const code of LOCALES) {
      expect(html).toContain(
        `<a href="/${code}${path}" hreflang="${code}" lang="${code}">${i18n[code].reroute.link}</a>`,
      );
    }
  });
});

describe('@sols/brand', () => {
  test('les liens bas du pied de page sont ceux de brand.json', () => {
    expect(site.footer.bottomLinks.map((link) => link.href)).toEqual(
      brand.footer.bottomLinks.map((link) => link.href),
    );
  });

  test.each(LOCALES)('chaque entrée des menus a un libellé en %s', (locale) => {
    for (const tool of site.header.tools) {
      expect(Object.keys(i18n[locale].header.tools[tool.key].items).sort()).toEqual(
        tool.items.map((entry) => entry.key).sort(),
      );
    }
  });

  test('icônes DSFR des menus publiées dans /dsfr/icons.css', () => {
    const css = readFileSync(join(DIST, 'dsfr', 'icons.css'), 'utf8');
    for (const tool of site.header.tools) expect(css).toContain(`.${tool.icon}::before`);
    for (const [, svg] of css.matchAll(/url\(([^)]+)\)/g)) {
      expect(existsSync(join(DIST, 'dsfr', svg))).toBe(true);
    }
  });
});

describe('menu mobile : Échap dans un sous-menu', () => {
  test('le script header.js est publié et chargé par chaque page HTML', () => {
    expect(existsSync(join(DIST, 'js', 'header.js'))).toBe(true);
    for (const path of [`/${site.defaultLanguage}/`, '/en/aide/', SHARED_PAGE]) {
      expect(read(path)).toContain(
        `<script type="module" src="${site.assets.js}/header.js"></script>`,
      );
    }
  });

  test('le code reproduit dans doc/agents/edito.md est celui de header.js', () => {
    const [, snippet] = readFileSync(EDITO_DOC, 'utf8').match(/```js\n([\s\S]*?)\n```/);
    const source = readFileSync(join(APP_DIR, 'src', 'js', 'header.js'), 'utf8');
    expect(source).toContain(snippet);
  });
});

describe('ressources', () => {
  test('ressources DSFR, pictogrammes et feuille du site copiés', () => {
    const assets = ['dsfr.min.css', 'dsfr.module.min.js', 'fonts/Marianne-Regular.woff2'];
    for (const item of accueil.service) assets.push(`artwork/pictograms/${item.pictogram}`);
    for (const asset of assets) expect(existsSync(join(DIST, 'dsfr', asset))).toBe(true);
    expect(existsSync(join(DIST, 'css', 'site.css'))).toBe(true);
  });
});

describe('page de référence partagée et doc/agents/edito.md', () => {
  test('liens sans langue, sans sélecteur de langue, noindex', () => {
    const html = read(SHARED_PAGE);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).not.toContain('fr-translate');
    expect(html).toContain(`<a class="sols-operator" href="${site.header.brandLink}"`);
    expect(html).toContain(`href="https://cartes.gouv.fr/aide/${site.defaultLanguage}/"`);
    expect(html).toContain(
      `href="https://cartes.gouv.fr/aide/${site.defaultLanguage}/nous-ecrire/"`,
    );
    for (const badge of site.header.brickBadges) {
      expect(html).toContain(
        `<p class="fr-header__service-title">${site.header.serviceTitle} <span class="fr-badge fr-badge--sm fr-badge--${badge.color} fr-badge--icon-left ${badge.icon}">${badge.label}</span></p>`,
      );
    }
    for (const path of FOOTER_PATHS)
      expect(html).toContain(`class="fr-footer__bottom-link" href="${path}"`);
    expect(html).toContain('<dialog id="fr-theme-modal"');
  });

  test('chaque bloc HTML de la doc est identique octet pour octet à la page de référence', () => {
    const html = read(SHARED_PAGE);
    const blocks = [...readFileSync(EDITO_DOC, 'utf8').matchAll(/```html\n([\s\S]*?)\n```/g)];
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const [, block] of blocks) expect(html.includes(block)).toBe(true);
  });
});
