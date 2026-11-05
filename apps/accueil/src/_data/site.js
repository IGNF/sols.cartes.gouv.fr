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
};

const external = {
  gissol: 'https://www.gissol.fr/',
  cartesGouv: 'https://cartes.gouv.fr',
  geoplateformeData: 'https://data.geopf.fr',
  legifrance: 'https://www.legifrance.gouv.fr',
  gouvernement: 'https://www.info.gouv.fr',
  servicePublic: 'https://www.service-public.fr',
  dataGouv: 'https://www.data.gouv.fr',
  licenceEtalab: 'https://github.com/etalab/licence-ouverte/blob/master/LO.md',
};

export default {
  url: 'https://sols.cartes.gouv.fr',
  name: 'Observatoire des sols',
  tagline: 'Les données sols de la Géoplateforme',
  lang: 'fr',
  defaultDescription:
    'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).',
  themeColor: '#000091',
  assets: { dsfr: '/dsfr' },
  sections,
  external,
  header: {
    brand: ['République', 'Française'],
    nav: [
      { label: 'Accueil', href: sections.accueil },
      { label: 'Rechercher une donnée', href: sections.rechercherUneDonnee },
      { label: 'Explorer les cartes', href: sections.explorerLesCartes },
    ],
    tools: [{ label: 'Site du GIS Sol', href: external.gissol, external: true }],
  },
  footer: {
    description:
      'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).',
    contentLinks: [
      { label: 'cartes.gouv.fr', href: external.cartesGouv },
      { label: 'Site du GIS Sol', href: external.gissol },
      { label: 'legifrance.gouv.fr', href: external.legifrance },
      { label: 'info.gouv.fr', href: external.gouvernement },
      { label: 'service-public.fr', href: external.servicePublic },
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
