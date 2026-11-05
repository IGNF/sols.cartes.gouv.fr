/**
 * Single source for the site URL, languages, section paths, external links and the
 * structure of the shared header / footer. Labels live in i18n/<locale>.js.
 * Section paths are language-independent: edito pages localize them with `locale_url`
 * (/fr/..., /en/...); the catalogue and carto bricks use them as is (rerouting pages).
 */
const sections = {
  accueil: '/',
  rechercherUneDonnee: '/rechercher-une-donnee/',
  explorerLesCartes: '/explorer-les-cartes/',
  accessibilite: '/accessibilite/',
  mentionsLegales: '/mentions-legales/',
  donneesPersonnelles: '/donnees-personnelles/',
  planDuSite: '/plan-du-site/',
  articles: '/articles/',
};

const external = {
  gissol: 'https://www.gissol.fr/',
  /** Footer content links are domains (label = domain, target = https://<domain>), as react-dsfr renders them. */
  gissolDomain: 'https://gissol.fr',
  cartesGouv: 'https://cartes.gouv.fr',
  geoplateformeData: 'https://data.geopf.fr',
  infoGouv: 'https://info.gouv.fr',
  servicePublic: 'https://service-public.gouv.fr',
  legifrance: 'https://legifrance.gouv.fr',
  dataGouv: 'https://data.gouv.fr',
  licenceEtalab: 'https://github.com/etalab/licence-ouverte/blob/master/LO.md',
};

export default {
  url: 'https://sols.cartes.gouv.fr',
  defaultLanguage: 'fr',
  languages: [
    { code: 'fr', label: 'Français', dateLocale: 'fr-FR' },
    { code: 'en', label: 'English', dateLocale: 'en-GB' },
  ],
  themeColor: '#000091',
  assets: { dsfr: '/dsfr', css: '/css' },
  sections,
  /** Paths served by the other bricks: never localized, never checked against the edito dist. */
  crossBrick: [sections.rechercherUneDonnee, sections.explorerLesCartes],
  external,
  header: {
    brand: ['République', 'Française'],
    serviceTitle: 'sols.cartes.gouv.fr',
    nav: [
      { key: 'accueil', href: sections.accueil },
      { key: 'rechercherUneDonnee', href: sections.rechercherUneDonnee },
      { key: 'explorerLesCartes', href: sections.explorerLesCartes },
    ],
    tools: [{ key: 'gissol', href: external.gissol, external: true }],
  },
  footer: {
    contentLinks: [
      { key: 'cartesGouv', href: external.cartesGouv },
      { key: 'gissol', href: external.gissolDomain },
      { key: 'infoGouv', href: external.infoGouv },
      { key: 'servicePublic', href: external.servicePublic },
      { key: 'legifrance', href: external.legifrance },
      { key: 'dataGouv', href: external.dataGouv },
    ],
    bottomLinks: [
      { key: 'accessibilite', href: sections.accessibilite },
      { key: 'mentionsLegales', href: sections.mentionsLegales },
      { key: 'donneesPersonnelles', href: sections.donneesPersonnelles },
      { key: 'planDuSite', href: sections.planDuSite },
    ],
    licenceHref: external.licenceEtalab,
  },
};
