/**
 * French strings (default language). Prose marked "(texte provisoire)" is placeholder.
 * Header and footer labels come from @sols/brand, the content shared by the three bricks.
 */
import brand from '@sols/brand';

const description =
  'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).';

/** { href: label } (and description for services) of a brand tools menu. */
const menuItems = (items) =>
  Object.fromEntries(items.map(({ href, label, description: desc }) => [href, { label, desc }]));

export default {
  name: 'Observatoire des sols',
  tagline: 'Observatoire des sols de France',
  description,
  newWindow: 'nouvelle fenêtre',
  skiplinks: {
    label: 'Accès rapide',
    contenu: 'Contenu',
    piedDePage: 'Pied de page',
  },
  mainSections: {
    accueil: 'Accueil',
    rechercherUneDonnee: 'Rechercher une donnée',
    explorerLesCartes: 'Explorer les cartes',
    aide: 'Aide',
  },
  header: {
    homeLinkTitle: brand.service.homeLinkTitle,
    menu: 'Menu',
    close: 'Fermer',
    translateTitle: 'Sélectionner une langue',
    tools: {
      help: {
        label: brand.header.tools.help.label,
        items: menuItems(brand.header.tools.help.items),
      },
      services: {
        label: brand.header.tools.services.label,
        items: menuItems(brand.header.tools.services.items),
      },
    },
  },
  footer: {
    description: brand.footer.description,
    homeLinkTitle: brand.service.homeLinkTitle,
    partnersTitle: 'Nos partenaires',
    bottomLinks: {
      accessibilite: 'Accessibilité : non conforme',
      mentionsLegales: 'Mentions légales',
      donneesPersonnelles: 'Données personnelles',
      planDuSite: 'Plan du site',
    },
    licence: { text: brand.footer.licence.text, label: brand.footer.licence.label },
  },
  display: {
    button: brand.footer.displaySettings.label,
    title: 'Paramètres d’affichage',
    legend: 'Choisissez un thème pour personnaliser l’apparence du site.',
    light: 'Thème clair',
    dark: 'Thème sombre',
    system: 'Système',
    systemHint: 'Utilise les paramètres système',
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
  partage: {
    title: 'En-tête et pied de page partagés',
    description:
      'Référence technique : en-tête et pied de page communs aux briques de sols.cartes.gouv.fr.',
    body: 'Page technique non indexée : balisage commun repris par les briques catalogue et carto.',
  },
  pages: {
    aide: {
      title: 'Aide',
      description: 'Centre d’aide de l’Observatoire des sols de France (texte provisoire).',
      intro:
        'Retrouvez ici les réponses aux questions les plus fréquentes sur l’Observatoire des sols de France (texte provisoire).',
      faqTitle: 'Questions fréquentes',
      faq: [
        {
          question: 'Qu’est-ce que l’Observatoire des sols de France ?',
          answer: 'Réponse à venir (texte provisoire).',
        },
        {
          question: 'Comment rechercher une donnée sur les sols ?',
          answer: 'Réponse à venir (texte provisoire).',
        },
        {
          question: 'Comment afficher une donnée sur la carte ?',
          answer: 'Réponse à venir (texte provisoire).',
        },
      ],
      contactTitle: 'Nous contacter',
      contactText: 'Pour toute question sur le service, écrivez-nous à l’adresse',
      contactNote: '(adresse provisoire)',
    },
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
