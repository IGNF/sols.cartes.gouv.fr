/** French strings (default language). Prose marked "(texte provisoire)" is placeholder. */
const description =
  'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).';

export default {
  name: 'Observatoire des sols',
  tagline: 'Observatoire des sols de France',
  description,
  newWindow: 'nouvelle fenêtre',
  skiplinks: {
    label: 'Accès rapide',
    contenu: 'Contenu',
    menu: 'Menu',
    piedDePage: 'Pied de page',
  },
  header: {
    homeTitle: 'Accueil',
    menu: 'Menu',
    close: 'Fermer',
    navLabel: 'Menu principal',
    nav: {
      accueil: 'Accueil',
      rechercherUneDonnee: 'Rechercher une donnée',
      explorerLesCartes: 'Explorer les cartes',
    },
    tools: { gissol: 'Site du GIS Sol' },
  },
  footer: {
    description,
    homeTitle: 'Retour à l’accueil du site',
    contentLinks: {
      cartesGouv: 'cartes.gouv.fr',
      gissol: 'Site du GIS Sol',
      infoGouv: 'info.gouv.fr',
      servicePublic: 'service-public.gouv.fr',
      legifrance: 'legifrance.gouv.fr',
      dataGouv: 'data.gouv.fr',
    },
    bottomLinks: {
      accessibilite: 'Accessibilité : non conforme',
      mentionsLegales: 'Mentions légales',
      donneesPersonnelles: 'Données personnelles',
      planDuSite: 'Plan du site',
    },
    licence: {
      text: 'Sauf mention contraire, tous les contenus de ce site sont sous',
      label: 'licence etalab-2.0',
    },
  },
  breadcrumb: {
    label: 'vous êtes ici :',
    button: 'Voir le fil d’Ariane',
    accueil: 'Accueil',
    articles: 'Articles',
  },
  articles: { published: 'Publié le' },
  reroute: {
    title: 'sols.cartes.gouv.fr : choix de la langue',
    description: 'Redirection vers la version française de sols.cartes.gouv.fr.',
    heading: 'sols.cartes.gouv.fr',
    intro: 'Vous allez être redirigé vers la version française.',
    link: 'Version française',
  },
  pages: {
    accueil: { title: 'Observatoire des sols', description },
    accessibilite: {
      title: 'Accessibilité',
      description: 'Déclaration d’accessibilité de sols.cartes.gouv.fr (texte provisoire).',
      body: 'Le site n’a pas encore fait l’objet d’un audit de conformité au RGAA : il est non conforme. La déclaration d’accessibilité sera publiée ici (texte provisoire).',
    },
    mentionsLegales: {
      title: 'Mentions légales',
      description: 'Mentions légales de sols.cartes.gouv.fr (texte provisoire).',
      body: 'Les mentions légales du site (éditeur, directeur de la publication, hébergement) seront publiées ici (texte provisoire).',
    },
    donneesPersonnelles: {
      title: 'Données personnelles',
      description:
        'Politique de gestion des données personnelles de sols.cartes.gouv.fr (texte provisoire).',
      body: 'Les informations sur le traitement des données personnelles et les cookies seront publiées ici (texte provisoire).',
    },
    planDuSite: {
      title: 'Plan du site',
      description: 'Plan du site sols.cartes.gouv.fr, liste des sections et des pages.',
      body: 'Sections et pages du site (texte provisoire).',
    },
    articles: {
      title: 'Articles',
      description: 'Articles de l’Observatoire des sols (texte provisoire).',
      body: 'Articles publiés par l’Observatoire des sols (texte provisoire).',
    },
  },
  accueil: {
    hero: {
      overline: 'Portail d’accès aux données sur les sols',
      title: 'Observatoire des sols',
      intro:
        'L’Observatoire des sols rassemble en un point d’entrée unique les données sur les sols du GIS Sol, servies par la Géoplateforme (texte provisoire).',
      actions: {
        rechercherUneDonnee: 'Rechercher une donnée',
        explorerLesCartes: 'Explorer les cartes',
      },
    },
    service: {
      overline: 'Le service',
      title: 'Trouver, comprendre et utiliser les données sur les sols',
      intro: 'Présentation courte du service (texte provisoire).',
      items: {
        trouver: { title: 'Trouver les données', desc: 'Description courte (texte provisoire).' },
        comprendre: {
          title: 'Comprendre les données',
          desc: 'Description courte (texte provisoire).',
        },
        utiliser: { title: 'Utiliser les données', desc: 'Description courte (texte provisoire).' },
      },
    },
    donnees: {
      overline: 'Données disponibles',
      title: 'Les jeux de données sur les sols',
      intro: 'Présentation courte des données disponibles (texte provisoire).',
      items: {
        referentiels: {
          title: 'Référentiels territoriaux',
          desc: 'Description courte (texte provisoire).',
        },
        agricoles: { title: 'Données agricoles', desc: 'Description courte (texte provisoire).' },
        environnement: {
          title: 'Environnement et recherche',
          desc: 'Description courte (texte provisoire).',
        },
      },
      allLabel: 'Voir toutes les données',
    },
    articles: {
      overline: 'Articles',
      title: 'Derniers articles',
      allLabel: 'Voir tous les articles',
    },
    gissol: {
      title: 'Le GIS Sol',
      text: 'Présentation courte du groupement d’intérêt scientifique Sol (texte provisoire).',
      label: 'Site du GIS Sol',
    },
  },
};
