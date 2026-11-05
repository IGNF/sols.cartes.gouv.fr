/**
 * Home page content (placeholder prose, marked "(texte provisoire)").
 * Pictograms are paths under the DSFR `artwork/pictograms/` folder; eleventy.config.js copies them.
 */
import site from './site.js';

export default {
  hero: {
    overline: 'Portail d’accès aux données sur les sols',
    title: 'Observatoire des sols',
    intro:
      'L’Observatoire des sols rassemble en un point d’entrée unique les données sur les sols du GIS Sol, servies par la Géoplateforme (texte provisoire).',
    actions: [
      { label: 'Rechercher une donnée', href: site.sections.rechercherUneDonnee, primary: true },
      { label: 'Explorer les cartes', href: site.sections.explorerLesCartes },
    ],
  },
  service: {
    overline: 'Le service',
    title: 'Trouver, comprendre et utiliser les données sur les sols',
    intro: 'Présentation courte du service (texte provisoire).',
    items: [
      {
        title: 'Trouver les données',
        desc: 'Description courte (texte provisoire).',
        pictogram: 'digital/search.svg',
      },
      {
        title: 'Comprendre les données',
        desc: 'Description courte (texte provisoire).',
        pictogram: 'document/document-search.svg',
      },
      {
        title: 'Utiliser les données',
        desc: 'Description courte (texte provisoire).',
        pictogram: 'map/map.svg',
      },
    ],
  },
  donnees: {
    overline: 'Données disponibles',
    title: 'Les jeux de données sur les sols',
    intro: 'Présentation courte des données disponibles (texte provisoire).',
    items: [
      { title: 'Référentiels territoriaux', desc: 'Description courte (texte provisoire).' },
      { title: 'Données agricoles', desc: 'Description courte (texte provisoire).' },
      { title: 'Environnement et recherche', desc: 'Description courte (texte provisoire).' },
    ],
    href: site.sections.rechercherUneDonnee,
    allLabel: 'Voir toutes les données',
  },
  gissol: {
    title: 'Le GIS Sol',
    text: 'Présentation courte du groupement d’intérêt scientifique Sol (texte provisoire).',
    label: 'Site du GIS Sol',
    href: site.external.gissol,
  },
};
