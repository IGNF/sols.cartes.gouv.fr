/**
 * Home page structure (links, pictograms, item keys). Strings live in i18n/<locale>.js under `accueil`.
 * Pictograms are paths under the DSFR `artwork/pictograms/` folder; eleventy.config.js copies them.
 */
import site from './site.js';

export default {
  actions: [
    { key: 'rechercherUneDonnee', href: site.sections.rechercherUneDonnee, primary: true },
    { key: 'explorerLesCartes', href: site.sections.explorerLesCartes },
  ],
  service: [
    { key: 'trouver', pictogram: 'digital/search.svg' },
    { key: 'comprendre', pictogram: 'document/document-search.svg' },
    { key: 'utiliser', pictogram: 'map/map.svg' },
  ],
  donnees: {
    items: ['referentiels', 'agricoles', 'environnement'],
    href: site.sections.rechercherUneDonnee,
  },
  articles: { max: 3, href: site.sections.articles },
  gissolHref: site.external.gissol,
};
