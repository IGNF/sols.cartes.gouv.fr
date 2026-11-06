/** English strings. Every prose string is placeholder text, marked "(placeholder text)". */
const description =
  'Soil observatory: portal for the GIS Sol (INRAE) soil data served by the Géoplateforme (placeholder text).';
const footerDescription =
  'Soil observatory of France: the access portal to soil data for territories, led by INRAE with the GIS Sol and served by the Géoplateforme (placeholder text).';

export default {
  name: 'Soil observatory',
  tagline: 'Soil observatory of France',
  description,
  newWindow: 'new window',
  skiplinks: { label: 'Quick access', contenu: 'Content', piedDePage: 'Footer' },
  mainSections: {
    accueil: 'Home',
    rechercherUneDonnee: 'Find data (in French)',
    explorerLesCartes: 'Explore maps (in French)',
    aide: 'Help',
  },
  header: {
    homeLinkTitle: 'Back to the home page of the Soil observatory of France - République Française',
    operatorLogoAlt: 'GIS Sol, scientific interest group on soils',
    menu: 'Menu',
    close: 'Close',
    translateTitle: 'Select a language',
    tools: {
      help: {
        label: 'Help',
        items: {
          'https://cartes.gouv.fr/aide/{lang}/': { label: 'Help centre' },
          'https://cartes.gouv.fr/aide/{lang}/nous-ecrire/': { label: 'Contact us' },
        },
      },
      services: {
        label: 'Services',
        items: {
          '/rechercher-une-donnee/': {
            label: 'Find data (in French)',
            desc: 'The soil data catalogue',
          },
          '/explorer-les-cartes/': {
            label: 'Explore maps (in French)',
            desc: 'The map viewer',
          },
          '/fr/': { label: 'Discover', desc: 'The Soil observatory of France' },
        },
      },
    },
  },
  footer: {
    description: footerDescription,
    homeLinkTitle: 'Back to the home page of the Soil observatory of France - République Française',
    partnersTitle: 'Our partners',
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
  display: {
    button: 'Display settings',
    title: 'Display settings',
    legend: 'Choose a theme to customise the look of the site.',
    light: 'Light theme',
    dark: 'Dark theme',
    system: 'System',
    systemHint: 'Uses the system settings',
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
    aide: {
      title: 'Help',
      description: 'Help centre of the Soil observatory of France (placeholder text).',
      intro:
        'Find here the answers to the most frequent questions about the Soil observatory of France (placeholder text).',
      faqTitle: 'Frequently asked questions',
      faq: [
        {
          question: 'What is the Soil observatory of France?',
          answer: 'Answer to come (placeholder text).',
        },
        { question: 'How do I find soil data?', answer: 'Answer to come (placeholder text).' },
        {
          question: 'How do I display data on the map?',
          answer: 'Answer to come (placeholder text).',
        },
      ],
      contactTitle: 'Contact us',
      contactText:
        'Help and the contact form are shared with cartes.gouv.fr: write to us with the « Nous écrire » form and mention that your question is about the Soil observatory (placeholder text).',
      contactButton: 'Write to us on cartes.gouv.fr',
      helpButton: 'cartes.gouv.fr help centre',
    },
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
      overline: 'The access portal to soil data for territories',
      title: 'All the knowledge on French soils gathered in one place',
      intro:
        'Sixty years of soil data collected across France. The Soil observatory of France lets you find them and use them in your studies and territorial decisions (placeholder text).',
      actions: {
        rechercherUneDonnee: 'Find data (in French)',
        explorerLesCartes: 'Explore maps (in French)',
      },
      figuresLabel: 'Key figures',
      figures: {
        annees: { value: '60 years', label: 'of collected data' },
        referentiels: { value: '12+', label: 'National reference datasets' },
        publiques: { value: '100%', label: 'Public data' },
      },
    },
    service: {
      overline: 'The service',
      title: 'Find, understand and use soil data',
      intro:
        'Soil data is scattered among many organisations and hard to use. The Observatory helps you find, understand and use it (placeholder text).',
      frieze: {
        without: {
          title: 'Without the Soil observatory of France',
          items: [
            'Data scattered between BRGM, INRAE, IGN, ADEME…',
            'Heterogeneous formats, incomplete metadata',
            'No way to know which data to use',
            'Long collection time before each study',
          ],
        },
        with: {
          title: 'With the Soil observatory of France',
          items: [
            'A single access point, all sources in one place',
            'Quality, source and scale documented for each dataset',
            'Data exportable to your GIS tools',
            'Immediate time savings on data collection',
          ],
        },
      },
      items: {
        trouver: {
          title: 'Find relevant data',
          desc: 'Immediately locate the relevant data available for your study area without multiplying sources, contacts or platforms (placeholder text).',
        },
        comprendre: {
          title: 'Understand data reliability',
          desc: 'See the source, scale and quality of each reference dataset and assess its reliability before using it (placeholder text).',
        },
        utiliser: {
          title: 'Use data in your tools',
          desc: 'Export data to your GIS and business software, in formats compatible with your work environment (placeholder text).',
        },
      },
    },
    usages: {
      overline: 'Use cases',
      title: 'A portal designed for your professional uses',
      intro:
        'These use cases show how the Soil observatory of France can fit into your practice. If you work with soil data, the portal is for you (placeholder text).',
      profile: 'Profile',
      items: {
        chambres: {
          title: 'Chambers of agriculture',
          lead: 'Use soil data to strengthen agricultural advice and objectify field diagnoses (placeholder text).',
          points: [
            'An advisor analyses a field, identifies soil characteristics and makes a documented recommendation.',
            'A technician prepares a diagnosis with all the data from a single point, saving collection time.',
            'Field support relies on sourced data to make exchanges with farmers more credible.',
          ],
        },
        bureaux: {
          title: 'Consultancies',
          lead: 'Quickly access soil data to make environmental, planning, regulatory and wetland studies more reliable (placeholder text).',
          points: [
            'A consultancy carries out an impact study, identifies soil constraints and secures its analysis.',
            'A project officer prepares a file with the right data from a single point, saving collection time.',
            'A development project relies on reliable data to improve the preliminary diagnosis.',
          ],
        },
        collectivites: {
          title: 'Local authorities',
          lead: 'Include soil issues in planning policies and strategic territorial decisions (placeholder text).',
          points: [
            'Identify areas with environmental, agronomic and biodiversity stakes to guide decisions',
            'Support public policies with reliable, sourced soil data',
            'Include soil constraints in planning documents (PLU, SCOT, SRADDET)',
          ],
        },
      },
      note: 'These examples are deliberately targeted. If you use soil data for other purposes, the portal can be useful to you too (placeholder text).',
    },
    donnees: {
      overline: 'Available data',
      title: 'Access structured and documented reference datasets',
      intro:
        'Access a set of national reference datasets organised by use. Some can be viewed on the map portal, all are referenced and documented (placeholder text).',
      tagsLabel: 'Reference datasets',
      usageLabel: 'Use:',
      items: {
        referentiels: {
          title: 'Territorial reference data',
          usage: 'territorial diagnosis, impact study, analysis of soil constraints.',
        },
        agricoles: {
          title: 'Agricultural data',
          usage: 'agronomic recommendations, fertility management, adapted farming practices.',
        },
        environnement: {
          title: 'Environment & research',
          usage: 'carbon assessment, pollution, environmental studies, scientific research.',
        },
      },
      banner: {
        title: 'All these datasets are referenced on the Soil observatory of France portal',
        text: 'Some can be viewed directly on the map interface, others are referenced with a link to their original source (placeholder text).',
        button: 'Go to the portal (in French)',
      },
    },
    agenda: {
      overline: 'Agenda',
      title: 'Upcoming Observatory events',
      intro:
        'Webinars, workshops, events… Let’s talk about soil data and its uses (placeholder text).',
      listLabel: 'Upcoming events',
      previous: 'Previous events',
      next: 'Next events',
      empty: 'No event is scheduled at the moment. Come back soon.',
      types: { webinaire: 'Webinar', evenement: 'Event', salon: 'Trade fair' },
      actions: { inscrire: 'Register', participer: 'Take part' },
      placeLabel: 'Place:',
    },
    articles: {
      overline: 'Articles',
      title: 'Latest articles',
      allLabel: 'See all articles',
    },
    partners: {
      overline: 'Partners & sponsors',
      title: 'A service led by INRAE with the public ecosystem',
      intro:
        'The Soil observatory of France relies on a network of public and scientific organisations to make French soil data easier to access, understand and use (placeholder text).',
      networkOverline: 'Scientific, technical and environmental partners',
      networkTitle: 'Network members',
      gissolLink: 'GIS Sol website',
      callout: {
        title: 'Do you produce soil data and want it referenced?',
        text: 'The Soil observatory of France aims to bring together soil data from public and scientific organisations. Contact us to submit your data to the catalogue (placeholder text).',
        button: 'Submit data',
      },
    },
  },
};
