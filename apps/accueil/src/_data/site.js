/**
 * Single source for the site URL, section paths, external links and the shared
 * header / footer content. Templates must read URLs from here, never inline them.
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
  cartesGouv: 'https://cartes.gouv.fr',
  geoplateformeData: 'https://data.geopf.fr',
  infoGouv: 'https://info.gouv.fr',
  servicePublic: 'https://service-public.gouv.fr',
  legifrance: 'https://legifrance.gouv.fr',
  dataGouv: 'https://data.gouv.fr',
  licenceEtalab: 'https://github.com/etalab/licence-ouverte/blob/master/LO.md',
};

const description =
  'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).';

export default {
  url: 'https://sols.cartes.gouv.fr',
  name: 'Observatoire des sols',
  lang: 'fr',
  description,
  themeColor: '#000091',
  assets: { dsfr: '/dsfr', css: '/css' },
  sections,
  external,
  header: {
    brand: ['République', 'Française'],
    serviceTitle: 'sols.cartes.gouv.fr',
    tagline: 'Observatoire des sols de France',
    nav: [
      { label: 'Accueil', href: sections.accueil },
      { label: 'Rechercher une donnée', href: sections.rechercherUneDonnee },
      { label: 'Explorer les cartes', href: sections.explorerLesCartes },
    ],
    tools: [{ label: 'Site du GIS Sol', href: external.gissol, external: true }],
  },
  footer: {
    description,
    contentLinks: [
      { label: 'cartes.gouv.fr', href: external.cartesGouv },
      { label: 'Site du GIS Sol', href: external.gissol },
      { label: 'info.gouv.fr', href: external.infoGouv },
      { label: 'service-public.gouv.fr', href: external.servicePublic },
      { label: 'legifrance.gouv.fr', href: external.legifrance },
      { label: 'data.gouv.fr', href: external.dataGouv },
    ],
    bottomLinks: [
      { label: 'Accessibilité : non conforme', href: sections.accessibilite },
      { label: 'Mentions légales', href: sections.mentionsLegales },
      { label: 'Données personnelles', href: sections.donneesPersonnelles },
      { label: 'Plan du site', href: sections.planDuSite },
    ],
    licence: {
      text: 'Sauf mention contraire, tous les contenus de ce site sont sous',
      label: 'licence etalab-2.0',
      href: external.licenceEtalab,
    },
  },
};
