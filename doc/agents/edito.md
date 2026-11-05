# Brique edito (`apps/accueil`, `@sols/accueil`)

Pages statiques servies sous `/` : Eleventy 3 (Nunjucks, Markdown) + DSFR 1.14.2 (`@gouvfr/dsfr`, version exacte,
alignée sur `config.dsfrVersion` du `package.json` racine).

## Commandes (dans `apps/accueil`)

| Commande        | Effet                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| `bun run dev`   | serveur Eleventy avec rechargement, http://localhost:8081                                   |
| `bun run build` | génère `apps/accueil/dist` (copié tel quel à la racine de `./dist` par `bun run build:all`) |
| `bun run lint`  | build puis `html-validate` sur `dist/**/*.html` (config `.htmlvalidate.json`)               |
| `bun run test`  | `bun test` : test de fumée `test/smoke.test.js` (build puis contrôle de `dist/index.html`)  |

## Structure

```
apps/accueil/
  eleventy.config.js          entrée src, sortie dist, copie DSFR minimale vers /dsfr/
  .htmlvalidate.json          html-validate:recommended (voir règles désactivées ci-dessous)
  src/_data/site.js           SEULE source des URL : site, sections, liens externes, contenu en-tête / pied de page
  src/_includes/layouts/base.njk
  src/_includes/partials/{skiplinks,header,footer}.njk
  src/index.njk               accueil
  test/smoke.test.js
```

## Ressources DSFR

`eleventy.config.js` copie dans `dist/dsfr/` uniquement : `dsfr.min.css`, chaque fichier que cette feuille référence
via `url()` (polices Marianne / Spectral, ~60 icônes du cœur), les favicons, `dsfr.module.min.js` et
`dsfr.nomodule.min.js` (~2,6 Mo au lieu de 86 Mo). Pour utiliser une classe d'icône utilitaire
(`fr-icon-*` hors cœur), ajouter la feuille de la catégorie, par exemple
`utility/icons/icons-map/icons-map.min.css`, à `DSFR_STYLESHEETS` (ses SVG sont copiés automatiquement) et la lier
dans `base.njk`.

JS : le bundle DSFR est chargé pour les composants interactifs (menu mobile de l'en-tête en modale, schéma
clair / sombre `data-fr-scheme="system"`). Aucun autre JS client.

## Gabarit de base

`layouts/base.njk` : `<html lang="fr">`, `<title>` (« Titre - Observatoire des sols », ou le nom seul pour l'accueil),
`<meta name="description">` (front matter `description`, sinon `site.defaultDescription`), `<link rel="canonical">`
(`site.url` + `page.url`), favicons, liens d'évitement, en-tête, `<main id="contenu" tabindex="-1">`, pied de page.
Chaque page fournit `title`, `description` et un seul `<h1>`.

html-validate : `no-redundant-role` désactivée (le DSFR met `role="banner"`, `role="navigation"`,
`role="contentinfo"` explicites) ; `aria-label-misuse` désactivée (le `div.fr-modal` du menu porte
`aria-labelledby`, il devient un `dialog` via le JS DSFR en mobile).

## En-tête et pied de page partagés (à reproduire dans catalogue et carto)

Contenu (`src/_data/site.js`) :

- Bloc marque : « République / Française ». Titre du service : « Observatoire des sols ». Devise : « Les données sols
  de la Géoplateforme ».
- Navigation : Accueil `/`, Rechercher une donnée `/rechercher-une-donnee/`, Explorer les cartes
  `/explorer-les-cartes/`. L'entrée de la section courante porte `aria-current="page"` (Accueil : URL exacte `/` ;
  autres : préfixe d'URL).
- Accès rapide : « Site du GIS Sol » → `https://www.gissol.fr/` (nouvelle fenêtre).
- Pied de page, description : « Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la
  Géoplateforme (texte provisoire). »
- Pied de page, liens de contenu (nouvelle fenêtre) : cartes.gouv.fr `https://cartes.gouv.fr`, Site du GIS Sol
  `https://www.gissol.fr/`, legifrance.gouv.fr `https://www.legifrance.gouv.fr`, info.gouv.fr
  `https://www.info.gouv.fr` (ex gouvernement.fr, voir QUESTIONS Q6), service-public.fr
  `https://www.service-public.fr`, data.gouv.fr `https://www.data.gouv.fr`.
- Pied de page, liens bas : Accessibilité : non conforme `/accessibilite/`, Mentions légales `/mentions-legales/`,
  Données personnelles `/donnees-personnelles/`, Plan du site `/plan-du-site/`.
- Licence : « Sauf mention contraire, tous les contenus de ce site sont sous licence etalab-2.0 », lien
  `https://github.com/etalab/licence-ouverte/blob/master/LO.md`.

Identifiants d'ancrage communs : `#contenu` (main), `#navigation-principale` (nav), `#pied-de-page` (footer),
`#menu-principal` / `#bouton-menu-principal` (modale du menu mobile).

Balisage rendu (page d'accueil, section courante = Accueil) :

```html
<div class="fr-skiplinks">
  <nav class="fr-container" role="navigation" aria-label="Accès rapide">
    <ul class="fr-skiplinks__list">
      <li><a class="fr-link" href="#contenu">Contenu</a></li>
      <li><a class="fr-link" href="#navigation-principale">Menu</a></li>
      <li><a class="fr-link" href="#pied-de-page">Pied de page</a></li>
    </ul>
  </nav>
</div>
<header role="banner" class="fr-header">
  <div class="fr-header__body">
    <div class="fr-container">
      <div class="fr-header__body-row">
        <div class="fr-header__brand fr-enlarge-link">
          <div class="fr-header__brand-top">
            <div class="fr-header__logo">
              <p class="fr-logo">République<br />Française</p>
            </div>
            <div class="fr-header__navbar">
              <button
                type="button"
                class="fr-btn--menu fr-btn"
                data-fr-opened="false"
                aria-controls="menu-principal"
                aria-haspopup="dialog"
                id="bouton-menu-principal"
                title="Menu"
              >
                Menu
              </button>
            </div>
          </div>
          <div class="fr-header__service">
            <a href="/" title="Accueil - Observatoire des sols">
              <p class="fr-header__service-title">Observatoire des sols</p>
            </a>
            <p class="fr-header__service-tagline">Les données sols de la Géoplateforme</p>
          </div>
        </div>
        <div class="fr-header__tools">
          <div class="fr-header__tools-links">
            <ul class="fr-btns-group">
              <li>
                <a
                  class="fr-btn"
                  href="https://www.gissol.fr/"
                  target="_blank"
                  rel="noopener"
                  title="Site du GIS Sol - nouvelle fenêtre"
                  >Site du GIS Sol</a
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fr-header__menu fr-modal" id="menu-principal" aria-labelledby="bouton-menu-principal">
    <div class="fr-container">
      <button
        type="button"
        class="fr-btn--close fr-btn"
        aria-controls="menu-principal"
        title="Fermer"
      >
        Fermer
      </button>
      <div class="fr-header__menu-links"></div>
      <nav class="fr-nav" id="navigation-principale" role="navigation" aria-label="Menu principal">
        <ul class="fr-nav__list">
          <li class="fr-nav__item">
            <a class="fr-nav__link" href="/" target="_self" aria-current="page">Accueil</a>
          </li>
          <li class="fr-nav__item">
            <a class="fr-nav__link" href="/rechercher-une-donnee/" target="_self"
              >Rechercher une donnée</a
            >
          </li>
          <li class="fr-nav__item">
            <a class="fr-nav__link" href="/explorer-les-cartes/" target="_self"
              >Explorer les cartes</a
            >
          </li>
        </ul>
      </nav>
    </div>
  </div>
</header>

<footer class="fr-footer" role="contentinfo" id="pied-de-page">
  <div class="fr-container">
    <div class="fr-footer__body">
      <div class="fr-footer__brand fr-enlarge-link">
        <a
          href="/"
          title="Retour à l'accueil du site - Observatoire des sols - République Française"
        >
          <p class="fr-logo">République<br />Française</p>
        </a>
      </div>
      <div class="fr-footer__content">
        <p class="fr-footer__content-desc">
          Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la
          Géoplateforme (texte provisoire).
        </p>
        <ul class="fr-footer__content-list">
          <li class="fr-footer__content-item">
            <a
              class="fr-footer__content-link"
              href="https://cartes.gouv.fr"
              target="_blank"
              rel="noopener"
              title="cartes.gouv.fr - nouvelle fenêtre"
              >cartes.gouv.fr</a
            >
          </li>
          <li class="fr-footer__content-item">
            <a
              class="fr-footer__content-link"
              href="https://www.gissol.fr/"
              target="_blank"
              rel="noopener"
              title="Site du GIS Sol - nouvelle fenêtre"
              >Site du GIS Sol</a
            >
          </li>
          <li class="fr-footer__content-item">
            <a
              class="fr-footer__content-link"
              href="https://www.legifrance.gouv.fr"
              target="_blank"
              rel="noopener"
              title="legifrance.gouv.fr - nouvelle fenêtre"
              >legifrance.gouv.fr</a
            >
          </li>
          <li class="fr-footer__content-item">
            <a
              class="fr-footer__content-link"
              href="https://www.info.gouv.fr"
              target="_blank"
              rel="noopener"
              title="info.gouv.fr - nouvelle fenêtre"
              >info.gouv.fr</a
            >
          </li>
          <li class="fr-footer__content-item">
            <a
              class="fr-footer__content-link"
              href="https://www.service-public.fr"
              target="_blank"
              rel="noopener"
              title="service-public.fr - nouvelle fenêtre"
              >service-public.fr</a
            >
          </li>
          <li class="fr-footer__content-item">
            <a
              class="fr-footer__content-link"
              href="https://www.data.gouv.fr"
              target="_blank"
              rel="noopener"
              title="data.gouv.fr - nouvelle fenêtre"
              >data.gouv.fr</a
            >
          </li>
        </ul>
      </div>
    </div>
    <div class="fr-footer__bottom">
      <ul class="fr-footer__bottom-list">
        <li class="fr-footer__bottom-item">
          <a class="fr-footer__bottom-link" href="/accessibilite/">Accessibilité : non conforme</a>
        </li>
        <li class="fr-footer__bottom-item">
          <a class="fr-footer__bottom-link" href="/mentions-legales/">Mentions légales</a>
        </li>
        <li class="fr-footer__bottom-item">
          <a class="fr-footer__bottom-link" href="/donnees-personnelles/">Données personnelles</a>
        </li>
        <li class="fr-footer__bottom-item">
          <a class="fr-footer__bottom-link" href="/plan-du-site/">Plan du site</a>
        </li>
      </ul>
      <div class="fr-footer__bottom-copy">
        <p>
          Sauf mention contraire, tous les contenus de ce site sont sous
          <a
            href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
            target="_blank"
            rel="noopener"
            title="licence etalab-2.0 - nouvelle fenêtre"
            >licence etalab-2.0</a
          >
        </p>
      </div>
    </div>
  </div>
</footer>
```

Pour catalogue et carto : même contenu, `aria-current="page"` sur leur propre entrée de navigation, liens vers les
autres briques en navigation pleine page (pas de routeur client), mêmes identifiants d'ancrage.
