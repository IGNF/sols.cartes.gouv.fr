/**
 * Home page structure (links, keys, DSFR icons and pictograms, illustrations, data tags).
 * Strings live in i18n/<locale>.js under `accueil`; events in agenda.json.
 * Pictograms are paths under the DSFR `artwork/pictograms/` folder; icons are added to /dsfr/icons.css.
 */
import site from './site.js';

const illustration = (name) => `${site.assets.brand}/illustrations/${name}`;

export default {
  actions: [
    { key: 'rechercherUneDonnee', href: site.sections.rechercherUneDonnee, primary: true },
    { key: 'explorerLesCartes', href: site.sections.explorerLesCartes },
  ],
  figures: ['annees', 'referentiels', 'publiques'],
  frieze: {
    without: { icon: 'fr-icon-close-line', items: 4 },
    with: { icon: 'fr-icon-check-line', items: 4 },
    arrow: 'fr-icon-arrow-right-line',
  },
  service: [
    { key: 'trouver', pictogram: 'digital/search.svg' },
    { key: 'comprendre', pictogram: 'document/document-search.svg' },
    { key: 'utiliser', pictogram: 'map/map.svg' },
  ],
  /** Illustrations from @sols/brand (checked visually: 2 is the town hall, 3 the design office). */
  usages: [
    { key: 'chambres', image: illustration('cas-usage-1.jpg'), width: 1200, height: 418 },
    { key: 'bureaux', image: illustration('cas-usage-3.jpg'), width: 1200, height: 418 },
    { key: 'collectivites', image: illustration('cas-usage-2.jpg'), width: 1200, height: 417 },
  ],
  donnees: {
    items: [
      {
        key: 'referentiels',
        icon: 'fr-icon-road-map-line',
        tags: ['RPG', 'Cartes pédologiques', 'RRP 1/250 000', 'RMQS', 'BDSolU'],
      },
      {
        key: 'agricoles',
        icon: 'fr-icon-plant-line',
        tags: ['BDAT', 'Analyses sols', 'Fertilité', 'Pratiques culturales'],
      },
      {
        key: 'environnement',
        icon: 'fr-icon-microscope-line',
        tags: ['Carbone sols', 'ETM / BDETM', 'Global Soil Map', 'Érosion'],
      },
    ],
    href: site.sections.rechercherUneDonnee,
  },
  agenda: {
    /** Registration link of an event without `href` (provisional: the contact section, QUESTIONS E-4). */
    defaultHref: `${site.sections.aide}#contact`,
    icons: {
      place: 'fr-icon-map-pin-2-line',
      previous: 'fr-icon-arrow-left-line',
      next: 'fr-icon-arrow-right-line',
    },
  },
  articles: { max: 3, href: site.sections.articles },
  partners: site.footer.partners,
  gissolHref: site.external.gissol,
  contactHref: `${site.sections.aide}#contact`,
};
