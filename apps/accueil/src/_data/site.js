/**
 * Single source for the site URL, languages, section paths, external links and the
 * structure of the shared header / footer. Header and footer content come from
 * @sols/brand (packages/brand/brand.json); labels live in i18n/<locale>.js.
 * Section paths are language-independent: edito pages localize them (/fr/..., /en/...);
 * the catalogue and carto bricks use them as is (rerouting pages).
 */
import brand from '@sols/brand';

const sections = {
  accueil: brand.sections.home,
  rechercherUneDonnee: brand.sections.catalogue,
  explorerLesCartes: brand.sections.carto,
  aide: brand.sections.help,
  accessibilite: '/accessibilite/',
  mentionsLegales: '/mentions-legales/',
  donneesPersonnelles: '/donnees-personnelles/',
  planDuSite: '/plan-du-site/',
  articles: '/articles/',
};

const external = {
  gissol: brand.external.gissol,
  geoplateformeData: brand.external.geopf,
  licenceEtalab: brand.footer.licence.href,
};

/** Public path of the @sols/brand images (copied by eleventy.config.js). */
const BRAND_ASSETS = '/assets/brand';
const brandAsset = (path) => `${BRAND_ASSETS}/${path.replace(/^assets\//, '')}`;

export default {
  url: 'https://sols.cartes.gouv.fr',
  defaultLanguage: 'fr',
  languages: [
    { code: 'fr', label: 'Français', dateLocale: 'fr-FR' },
    { code: 'en', label: 'English', dateLocale: 'en-GB' },
  ],
  themeColor: '#000091',
  assets: { dsfr: '/dsfr', css: '/css', brand: BRAND_ASSETS },
  sections,
  /** Paths served by the other bricks: never localized, never checked against the edito dist. */
  crossBrick: [sections.rechercherUneDonnee, sections.explorerLesCartes],
  external,
  /** Main sections listed by the site map (the header has no main navigation since v1). */
  mainSections: [
    { key: 'accueil', href: sections.accueil },
    { key: 'rechercherUneDonnee', href: sections.rechercherUneDonnee },
    { key: 'explorerLesCartes', href: sections.explorerLesCartes },
    { key: 'aide', href: sections.aide },
  ],
  header: {
    brand: ['République', 'Française'],
    serviceTitle: brand.service.title,
    brandLink: brand.header.brandLink,
    /** Badge next to the service title on edito pages (`badges.edito`, none in v1). */
    badge: brand.badges.edito,
    operator: {
      logo: brandAsset(brand.header.operator.logo),
      mark: brandAsset(brand.header.operator.mark),
      markAlt: brand.header.operator.markAlt,
    },
    /** Dropdown menus of the header tools; labels per locale in i18n.header.tools.<key>. */
    tools: ['help', 'services'].map((key) => ({
      key,
      id: `menu-${key}`,
      icon: brand.header.tools[key].icon,
      items: brand.header.tools[key].items.map((item) => item.href),
    })),
  },
  footer: {
    partners: brand.footer.partners.map((partner) => ({
      ...partner,
      logo: brandAsset(partner.logo),
    })),
    contentLinks: brand.footer.contentLinks,
    bottomLinks: [
      { key: 'accessibilite', href: sections.accessibilite },
      { key: 'mentionsLegales', href: sections.mentionsLegales },
      { key: 'donneesPersonnelles', href: sections.donneesPersonnelles },
      { key: 'planDuSite', href: sections.planDuSite },
    ],
    licenceHref: external.licenceEtalab,
  },
  /** Themes of the DSFR display settings modal (footer « Paramètres d'affichage »). */
  display: {
    themes: [
      { value: 'light', pictogram: 'environment/sun.svg' },
      { value: 'dark', pictogram: 'environment/moon.svg' },
      { value: 'system', pictogram: 'system/system.svg' },
    ],
  },
  /** Placeholder contact address of the help page (to be replaced, QUESTIONS E-3). */
  contactEmail: 'contact@example.org',
};
