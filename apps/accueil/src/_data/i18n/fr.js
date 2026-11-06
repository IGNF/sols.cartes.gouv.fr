/**
 * French strings (default language). Prose marked "(texte provisoire)" is placeholder.
 * Header and footer labels come from @sols/brand, the content shared by the three bricks.
 */
import brand from '@sols/brand';
import site from '../site.js';

const description =
  'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).';

/** { href: label } (and description for services) of a brand tools menu. */
const menuItems = (items) =>
  Object.fromEntries(
    items.map(({ href, hrefTemplate, label, description: desc }) => [
      hrefTemplate ?? href,
      { label, desc },
    ]),
  );

export default {
  name: 'Observatoire des sols',
  tagline: brand.service.tagline,
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
    operatorLogoAlt: brand.header.operator.logoAlt,
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
    bottomLinks: Object.fromEntries(
      brand.footer.bottomLinks.map(({ href, label }, index) => [
        site.footer.bottomLinks[index].key,
        label,
      ]),
    ),
    licence: { text: brand.footer.licence.text, label: brand.footer.licence.label },
  },
  display: {
    button: brand.footer.displaySettings.label,
    title: brand.footer.displaySettings.label,
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
    badgesTitle: 'Titre du service avec badge (catalogue, carto)',
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
      contactText:
        'L’aide et le formulaire de contact sont communs à cartes.gouv.fr : écrivez-nous depuis le formulaire « Nous écrire », en précisant que votre question porte sur l’Observatoire des sols.',
      contactButton: 'Nous écrire sur cartes.gouv.fr',
      helpButton: 'Centre d’aide de cartes.gouv.fr',
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
      overline: 'Le portail d’accès aux données des sols pour les territoires',
      title: 'Toute la connaissance des sols de France réunie en un seul endroit',
      intro:
        'Soixante ans de données pédologiques collectées sur le territoire français. L’Observatoire des Sols de France vous permet de les localiser et les mobiliser dans vos études et décisions territoriales.',
      actions: {
        rechercherUneDonnee: 'Rechercher une donnée',
        explorerLesCartes: 'Explorer les cartes',
      },
      figuresLabel: 'Chiffres clés',
      figures: {
        annees: { value: '60 ans', label: 'de données collectées' },
        referentiels: { value: '12+', label: 'Référentiels nationaux' },
        publiques: { value: '100 %', label: 'Données publiques' },
      },
    },
    service: {
      overline: 'Le service',
      title: 'Localisez, comprenez et mobilisez les données sur les sols',
      intro:
        'Les données sur les sols sont dispersées entre de nombreux acteurs et difficiles à exploiter. L’Observatoire vous permet de les trouver, les comprendre et les mobiliser.',
      frieze: {
        without: {
          title: 'Sans l’Observatoire des Sols de France',
          items: [
            'Données dispersées entre BRGM, INRAE, IGN, ADEME…',
            'Formats hétérogènes, métadonnées incomplètes',
            'Impossible de savoir quelle donnée utiliser',
            'Temps de collecte élevé avant chaque étude',
          ],
        },
        with: {
          title: 'Avec l’Observatoire des Sols de France',
          items: [
            'Un seul point d’accès, toutes sources centralisées',
            'Qualité, source et échelle documentées pour chaque donnée',
            'Données exportables dans vos outils SIG',
            'Gain de temps immédiat sur la collecte',
          ],
        },
      },
      items: {
        trouver: {
          title: 'Trouver les données pertinentes',
          desc: 'Localisez immédiatement les données pertinentes et disponibles sur votre zone d’étude sans multiplier les sources, les interlocuteurs ou les plateformes.',
        },
        comprendre: {
          title: 'Comprendre la fiabilité des données',
          desc: 'Accédez à la source, l’échelle et la qualité de chaque référentiel. Évaluez la fiabilité avant d’intégrer les données à vos analyses et rapports.',
        },
        utiliser: {
          title: 'Mobiliser dans vos outils',
          desc: 'Exportez les données dans vos outils SIG et logiciels métier, dans des formats compatibles avec vos environnements de travail.',
        },
      },
    },
    usages: {
      overline: 'Cas d’usage',
      title: 'Un portail conçu pour vos usages métier',
      intro:
        'Ces cas d’usage illustrent comment l’Observatoire des Sols de France peut s’intégrer dans vos pratiques. Si vous travaillez avec des données des sols, le portail est fait pour vous.',
      profile: 'Profil',
      items: {
        chambres: {
          title: 'Chambres d’agriculture',
          lead: 'Mobiliser les données des sols pour renforcer le conseil agricole et objectiver les diagnostics parcellaires.',
          points: [
            'Un conseiller analyse une parcelle, identifie les caractéristiques des sols et formule une recommandation agronomique documentée.',
            'Un technicien prépare un diagnostic en accédant à toutes les données depuis un seul point, réduisant le temps de collecte.',
            'Un accompagnement terrain s’appuie sur des données sourcées pour crédibiliser les échanges avec l’agriculteur.',
          ],
        },
        bureaux: {
          title: 'Bureaux d’études',
          lead: 'Accéder rapidement aux données des sols pour fiabiliser les études environnementales, d’aménagement, réglementaires et de délimitation de zones humides.',
          points: [
            'Un bureau d’études réalise une étude d’impact, identifie les contraintes des sols et sécurise son analyse documentaire.',
            'Un chargé d’étude prépare un dossier en accédant aux bonnes données en un seul point, réduisant le temps de collecte.',
            'Un projet d’aménagement s’appuie sur des données fiables pour améliorer la qualité du diagnostic préalable.',
          ],
        },
        collectivites: {
          title: 'Collectivités territoriales',
          lead: 'Intégrer les enjeux sols dans les politiques d’aménagement et les décisions stratégiques du territoire.',
          points: [
            'Identifier les zones à enjeux environnementaux, agronomiques et de biodiversité pour orienter les décisions',
            'Appuyer les politiques publiques avec des données pédologiques fiables et sourcées',
            'Intégrer les contraintes sols dans les documents d’urbanisme (PLU, SCOT, SRADDET)',
          ],
        },
      },
      note: 'Ces exemples sont délibérément ciblés. Si vous travaillez avec des données des sols pour d’autres usages, le portail peut également vous être utile.',
    },
    donnees: {
      overline: 'Données disponibles',
      title: 'Accédez à des référentiels structurés et documentés',
      intro:
        'Accédez à un ensemble de référentiels nationaux organisés par usage. Certaines données sont visualisables sur le portail cartographique, toutes sont référencées et documentées.',
      tagsLabel: 'Référentiels',
      usageLabel: 'Usage :',
      items: {
        referentiels: {
          title: 'Référentiels territoriaux',
          usage: 'diagnostic territorial, étude d’impact, analyse des contraintes pédologiques.',
        },
        agricoles: {
          title: 'Données agricoles',
          usage:
            'recommandations agronomiques, gestion de la fertilité, pratiques culturales adaptées.',
        },
        environnement: {
          title: 'Environnement & recherche',
          usage: 'bilan carbone, pollution, études environnementales, recherche scientifique.',
        },
      },
      banner: {
        title:
          'Toutes ces données sont référencées sur le portail de l’Observatoire des Sols de France',
        text: 'Certaines sont visualisables directement sur l’interface cartographique, d’autres référencées avec un lien vers leur source d’origine.',
        button: 'Accéder au portail',
      },
    },
    agenda: {
      overline: 'Agenda',
      title: 'Les prochains rendez-vous de l’Observatoire',
      intro:
        'Webinaires, ateliers, événements… Échangeons autour des données sur les sols et de leurs usages.',
      listLabel: 'Événements à venir',
      previous: 'Événements précédents',
      next: 'Événements suivants',
      empty: 'Aucun rendez-vous n’est programmé pour le moment. Revenez bientôt.',
      types: { webinaire: 'Webinaire', evenement: 'Événement', salon: 'Salon' },
      actions: { inscrire: 'S’inscrire', participer: 'Participer' },
      placeLabel: 'Lieu :',
    },
    articles: {
      overline: 'Articles',
      title: 'Derniers articles',
      allLabel: 'Voir tous les articles',
    },
    partners: {
      overline: 'Partenaires & sponsors',
      title: 'Un service piloté par l’INRAE avec l’écosystème public',
      intro:
        'L’Observatoire des Sols de France s’appuie sur un réseau d’acteurs publics et scientifiques pour faciliter l’accès, la compréhension et l’usage des données pédologiques françaises.',
      networkOverline: 'Partenaires scientifiques, techniques et environnementaux',
      networkTitle: 'Acteurs du réseau',
      gissolLink: 'Site du GIS Sol',
      callout: {
        title: 'Vous produisez des données sur les sols et souhaitez les référencer ?',
        text: 'L’Observatoire des Sols de France a vocation à centraliser les données sur les sols des acteurs publics et scientifiques. Contactez-nous pour soumettre vos données au catalogue.',
        button: 'Soumettre des données',
      },
    },
  },
};
