/** Shared site identity, identical to the edito brick (apps/accueil/src/_data/site.js). */
export const SITE = {
  serviceTitle: 'sols.cartes.gouv.fr',
  brandTop: ['République', 'Française'],
  serviceTagline: 'Observatoire des sols de France',
  footerDescription:
    'Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).',
  licenceText: 'Sauf mention contraire, tous les contenus de ce site sont sous',
  licenceLabel: 'licence etalab-2.0',
} as const;

/** Title of the header home link. */
export const HEADER_HOME_TITLE = `Accueil - ${SITE.serviceTitle} - ${SITE.serviceTagline}`;

/** Title of the footer home link, as in the edito footer partial. */
export const FOOTER_HOME_TITLE = `Retour à l'accueil du site - ${SITE.serviceTitle} - ${SITE.brandTop.join(' ')}`;
