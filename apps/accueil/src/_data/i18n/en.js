/** English strings. Every prose string is placeholder text, marked "(placeholder text)". */
const description =
  'Soil observatory: portal for the GIS Sol (INRAE) soil data served by the Géoplateforme (placeholder text).';

export default {
  name: 'Soil observatory',
  tagline: 'Soil observatory of France',
  description,
  newWindow: 'new window',
  skiplinks: { label: 'Quick access', contenu: 'Content', menu: 'Menu', piedDePage: 'Footer' },
  header: {
    homeTitle: 'Home',
    menu: 'Menu',
    close: 'Close',
    navLabel: 'Main menu',
    nav: {
      accueil: 'Home',
      rechercherUneDonnee: 'Find data (in French)',
      explorerLesCartes: 'Explore maps (in French)',
    },
    tools: { gissol: 'GIS Sol website' },
  },
  footer: {
    description,
    homeTitle: 'Back to the home page',
    contentLinks: {
      cartesGouv: 'cartes.gouv.fr',
      gissol: 'gissol.fr',
      infoGouv: 'info.gouv.fr',
      servicePublic: 'service-public.gouv.fr',
      legifrance: 'legifrance.gouv.fr',
      dataGouv: 'data.gouv.fr',
    },
    bottomLinks: {
      accessibilite: 'Accessibility: not compliant',
      mentionsLegales: 'Legal notice',
      donneesPersonnelles: 'Personal data',
      planDuSite: 'Site map',
    },
    licence: {
      text: 'Unless otherwise stated, all content on this site is available under',
      label: 'licence etalab-2.0',
    },
  },
  breadcrumb: {
    label: 'you are here:',
    button: 'See breadcrumb',
    accueil: 'Home',
    articles: 'Articles',
  },
  articles: { published: 'Published on' },
  reroute: {
    link: 'English version',
  },
  pages: {
    accueil: { title: 'Soil observatory', description },
    accessibilite: {
      title: 'Accessibility',
      description: 'Accessibility statement of sols.cartes.gouv.fr (placeholder text).',
      body: 'The site has not been audited against the RGAA yet: it is not compliant. The accessibility statement will be published here (placeholder text).',
    },
    mentionsLegales: {
      title: 'Legal notice',
      description: 'Legal notice of sols.cartes.gouv.fr (placeholder text).',
      body: 'The legal notice (publisher, publication director, hosting) will be published here (placeholder text).',
    },
    donneesPersonnelles: {
      title: 'Personal data',
      description: 'Personal data policy of sols.cartes.gouv.fr (placeholder text).',
      body: 'Information about personal data processing and cookies will be published here (placeholder text).',
    },
    planDuSite: {
      title: 'Site map',
      description: 'Site map of sols.cartes.gouv.fr, list of sections and pages.',
      body: 'Sections and pages of the site (placeholder text).',
    },
    articles: {
      title: 'Articles',
      description: 'Articles of the soil observatory (placeholder text).',
      body: 'Articles published by the soil observatory (placeholder text).',
    },
  },
  accueil: {
    hero: {
      overline: 'Access portal to soil data',
      title: 'Soil observatory',
      intro:
        'The soil observatory gathers in a single entry point the GIS Sol soil data served by the Géoplateforme (placeholder text).',
      actions: {
        rechercherUneDonnee: 'Find data (in French)',
        explorerLesCartes: 'Explore maps (in French)',
      },
    },
    service: {
      overline: 'The service',
      title: 'Find, understand and use soil data',
      intro: 'Short presentation of the service (placeholder text).',
      items: {
        trouver: { title: 'Find data', desc: 'Short description (placeholder text).' },
        comprendre: { title: 'Understand data', desc: 'Short description (placeholder text).' },
        utiliser: { title: 'Use data', desc: 'Short description (placeholder text).' },
      },
    },
    donnees: {
      overline: 'Available data',
      title: 'Soil datasets',
      intro: 'Short presentation of the available data (placeholder text).',
      items: {
        referentiels: {
          title: 'Territorial reference data',
          desc: 'Short description (placeholder text).',
        },
        agricoles: { title: 'Agricultural data', desc: 'Short description (placeholder text).' },
        environnement: {
          title: 'Environment and research',
          desc: 'Short description (placeholder text).',
        },
      },
      allLabel: 'See all data (in French)',
    },
    articles: {
      overline: 'Articles',
      title: 'Latest articles',
      allLabel: 'See all articles',
    },
    gissol: {
      title: 'The GIS Sol',
      text: 'Short presentation of the GIS Sol scientific interest group (placeholder text).',
      label: 'GIS Sol website',
    },
  },
};
