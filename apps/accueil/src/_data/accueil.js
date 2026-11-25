/**
 * Home page structure (links, keys, DSFR icons and pictograms, illustrations, data tags).
 * Strings live in i18n/<locale>.js under `accueil`; events in agenda.json.
 * Pictograms are paths under the DSFR `artwork/pictograms/` folder; icons are added to /dsfr/icons.css.
 */
import site from './site.js';

const illustration = (name) => `${site.assets.brand}/illustrations/${name}`;
const partnerLogo = (file) => `${site.assets.img}/partenaires/${file}`;
/** Footer partners (brand.json) reused on the home page, with their sharper logos. */
const brandPartner = (name) => site.footer.partners.find((partner) => partner.name === name);

export default {
  actions: [
    {
      key: 'explorerLesCartes',
      href: site.sections.explorerLesCartes,
      primary: true,
      icon: 'fr-icon-arrow-right-s-line',
    },
    { key: 'rechercherUneDonnee', href: site.sections.rechercherUneDonnee },
  ],
  figures: ['annees', 'referentiels', 'publiques'],
  /**
   * Decorative map card of the hero (Figma node 1:9625), hidden from assistive technologies.
   * The two SVGs are the Figma exports; the legend colours in site.css match the soil polygons.
   */
  heroMap: {
    images: {
      contours: `${site.assets.img}/hero-carte-contours.svg`,
      sols: `${site.assets.img}/hero-carte-sols.svg`,
    },
    width: 378,
    height: 321,
    lockIcon: 'fr-icon-lock-line',
    layers: ['donneesSols', 'communes', 'rpg', 'hydro'],
    activeLayer: 'donneesSols',
    legend: ['brunsLimoneux', 'bocage', 'terresArables', 'calcaires', 'alpins', 'mediterraneens'],
  },
  frieze: {
    without: { icon: 'fr-icon-close-line', items: 4 },
    with: { icon: 'fr-icon-check-line', items: 4 },
    arrow: 'fr-icon-arrow-right-line',
  },
  /** Website screenshots (WebP, smallest first): map explorer (Figma 1:9801), GIS Sol site (122:5991). */
  apercus: {
    explorateur: {
      srcset: [
        { src: `${site.assets.img}/apercu-explorateur-800.webp`, width: 800 },
        { src: `${site.assets.img}/apercu-explorateur-1600.webp`, width: 1600 },
      ],
      width: 1600,
      height: 798,
    },
    gissol: {
      srcset: [
        { src: `${site.assets.img}/apercu-gissol-800.webp`, width: 800 },
        { src: `${site.assets.img}/apercu-gissol-1196.webp`, width: 1196 },
      ],
      width: 1196,
      height: 742,
    },
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
  /**
   * Partner logo groups (Figma 1:10344). Logos come from each organisation's website (BRGM cropped
   * to its mark), IRD from Wikimedia Commons, La Ruche numérique from the Figma export (its source
   * site timed out). Ministries have no image: `bloc` lines are rendered as the DSFR « bloc marque ».
   */
  partners: [
    {
      key: 'network',
      items: [
        brandPartner('INRAE'),
        { name: 'BRGM', href: 'https://www.brgm.fr/', logo: partnerLogo('brgm.svg') },
        { name: 'ADEME', href: 'https://www.ademe.fr/', logo: partnerLogo('ademe.svg') },
        brandPartner('IGN'),
        { name: 'OFB', href: 'https://www.ofb.gouv.fr/', logo: partnerLogo('ofb.svg') },
        { name: 'IRD', href: 'https://www.ird.fr/', logo: partnerLogo('ird.png') },
        brandPartner('GIS Sol'),
      ],
    },
    {
      key: 'sponsors',
      items: [
        {
          name: 'Ministère de l’Agriculture, de l’Agro-alimentaire et de la Souveraineté alimentaire',
          href: 'https://agriculture.gouv.fr/',
          bloc: [
            'Ministère',
            'de l’Agriculture,',
            'de l’Agro-alimentaire',
            'et de la Souveraineté',
            'alimentaire',
          ],
        },
        {
          name: 'Ministère de la Transition écologique, de l’Aménagement du territoire, des Transports, de la Ville et du Logement',
          href: 'https://www.ecologie.gouv.fr/',
          bloc: [
            'Ministères',
            'Transition écologique',
            'Aménagement du territoire',
            'Transports',
            'Ville et logement',
          ],
        },
        {
          name: 'La Ruche numérique',
          href: 'https://agriculture.gouv.fr/la-ruche-numerique-lincubateur-de-startups-detat-du-ministere-de-lagriculture',
          logo: partnerLogo('ruche.png'),
        },
        { name: 'beta.gouv.fr', href: 'https://beta.gouv.fr/', logo: partnerLogo('beta.svg') },
      ],
    },
  ],
  gissolHref: site.external.gissol,
  contactHref: `${site.sections.aide}#contact`,
  /** Icon of the green « Soumettre des données » button (Figma 1:10421). */
  calloutIcon: 'fr-icon-arrow-right-line',
};
