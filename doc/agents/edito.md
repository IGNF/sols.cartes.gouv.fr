# Brique edito (`apps/accueil`, `@sols/accueil`)

Pages statiques servies sous `/` : Eleventy 3 (Nunjucks, Markdown) + DSFR 1.14.2 (`@gouvfr/dsfr`, version exacte,
alignée sur `config.dsfrVersion` du `package.json` racine).

## Commandes (dans `apps/accueil`)

| Commande        | Effet                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| `bun run dev`   | serveur Eleventy avec rechargement, http://localhost:8081                                   |
| `bun run build` | génère `apps/accueil/dist` (copié tel quel à la racine de `./dist` par `bun run build:all`) |
| `bun run lint`  | build puis `html-validate` sur `dist/**/*.html` (config `.htmlvalidate.json`)               |
| `bun run test`  | `bun test` : build puis contrôles de `dist/` et synchronisation de ce document              |

## Structure

```
apps/accueil/
  eleventy.config.js          entrée src, sortie dist, copie DSFR minimale vers /dsfr/, src/css vers /css/
  .htmlvalidate.json          html-validate:recommended (voir règles désactivées ci-dessous)
  src/_data/site.js           SEULE source des URL : site, sections, liens externes, contenu en-tête / pied de page
  src/_data/accueil.js        contenu de l'accueil (textes provisoires, pictogrammes DSFR)
  src/_includes/layouts/base.njk   squelette commun
  src/_includes/layouts/page.njk   page simple : conteneur, fil d'Ariane, h1
  src/_includes/partials/{skiplinks,header,footer,breadcrumb,pictogram}.njk
  src/css/site.css            styles propres au site (jetons DSFR uniquement : fond du héros, surtitre)
  src/index.njk               accueil
  src/_includes/layouts/article.njk  article : fil d'Ariane Accueil > Articles > titre, h1, date <time>
  src/_includes/partials/article-card.njk  carte d'article (headingLevel à fixer avant l'include)
  src/articles/*.md           articles (collection « articles »), articles.11tydata.js : gabarit et permalink
  src/pages/*.njk             accessibilité, mentions légales, données personnelles, plan du site, liste des articles
  test/smoke.test.js
```

## Accueil

Ordre des sections repris de la maquette Figma (frame « 1440w light », nœud 8:4414), en composants DSFR :
héros (surtitre, `h1`, introduction, boutons « Rechercher une donnée » et « Explorer les cartes »), « Le service »
(trois tuiles non cliquables avec pictogramme), « Données disponibles » (trois cartes vers le catalogue et un lien
« Voir toutes les données »), encadré `fr-callout` vers le site du GIS Sol. Écarts volontaires : pas de chiffres ni
d'affirmations de la maquette, pas d'agenda, de partenaires, de « Se connecter », « Aide », « Services », ni de
capture d'application ; pied de page DSFR au lieu du bloc sombre (QUESTIONS Q7).

Pages du pied de page : `layouts/page.njk`, `permalink` tiré de `site.sections`. Le plan du site liste la
navigation principale et les liens bas de pied de page.

## Articles

Ajouter un fichier `apps/accueil/src/articles/<slug>.md` ; il est publié sous `/articles/<slug>/` :

```markdown
---
title: Titre de l'article
description: Une phrase pour la carte et la meta description.
date: 2026-11-05
---

Texte en Markdown. Intertitres à partir de `##` (le `h1` est le titre du front matter).
```

La collection `articles` (`eleventy.config.js`) est triée par date décroissante. La liste `/articles/`
(`src/pages/articles.njk`) affiche une carte par article, l'accueil les trois plus récents
(`accueil.articles.max`). Filtres de date : `dateIso` (`2026-11-05`, pour `datetime`) et `dateFr`
(« 5 novembre 2026 »), en UTC. Le fil d'Ariane accepte des niveaux intermédiaires via la variable `breadcrumb`
(`[{ label, href }]`).

## Ressources DSFR

`eleventy.config.js` copie dans `dist/dsfr/` uniquement : `dsfr.min.css`, chaque fichier que cette feuille référence
via `url()` (polices Marianne / Spectral, ~60 icônes du cœur), les favicons, `dsfr.module.min.js`,
`dsfr.nomodule.min.js` et les pictogrammes cités dans `src/_data/accueil.js` (~2,6 Mo au lieu de 86 Mo). Pour
utiliser une classe d'icône utilitaire (`fr-icon-*` hors cœur), ajouter la feuille de la catégorie, par exemple
`utility/icons/icons-map/icons-map.min.css`, à `DSFR_STYLESHEETS` (ses SVG sont copiés automatiquement) et la lier
dans `base.njk`. Les classes utilitaires de couleur de fond (`fr-background-*`) ne sont pas dans `dsfr.min.css` :
utiliser les jetons (`var(--background-alt-blue-france)`) dans `site.css`.

JS : le bundle DSFR est chargé pour les composants interactifs (menu mobile de l'en-tête en modale, fil d'Ariane
repliable, schéma clair / sombre `data-fr-scheme="system"`). Aucun autre JS client.

## Gabarit de base

`layouts/base.njk` : `<html lang="fr">`, `<title>` (« Titre - Observatoire des sols », ou le nom seul pour l'accueil),
`<meta name="description">` (front matter `description`, sinon `site.description`), `<link rel="canonical">`
(`site.url` + `page.url`), favicons, liens d'évitement, en-tête, `<main id="contenu" tabindex="-1">` (sans
conteneur : chaque page pose ses `fr-container`), pied de page. Chaque page fournit `title`, `description` et un
seul `<h1>`.

html-validate : `no-redundant-role` désactivée (le DSFR met `role="banner"`, `role="navigation"`,
`role="contentinfo"` explicites) ; `aria-label-misuse` désactivée (le `div.fr-modal` du menu porte
`aria-labelledby`, il devient un `dialog` via le JS DSFR en mobile).

## En-tête et pied de page partagés (à reproduire dans catalogue et carto)

Contenu (`src/_data/site.js`) :

- Bloc marque : « République / Française ». Titre du service : « sols.cartes.gouv.fr ». Devise : « Observatoire des
  sols de France ».
- Navigation : Accueil `/`, Rechercher une donnée `/rechercher-une-donnee/`, Explorer les cartes
  `/explorer-les-cartes/`. L'entrée de la section courante porte `aria-current="page"` (Accueil : URL exacte `/` ;
  autres : préfixe d'URL).
- Accès rapide : « Site du GIS Sol » → `https://www.gissol.fr/` (nouvelle fenêtre).
- Bouton « Menu » : sans `aria-haspopup`, comme l'exemple d'en-tête DSFR 1.14.2 (le JS DSFR gère la modale).
- Pied de page, description : `site.description` (« Observatoire des sols : portail des données sols du GIS Sol
  (INRAE) servies par la Géoplateforme (texte provisoire). »).
- Pied de page, liens de contenu (nouvelle fenêtre, `rel="noopener external"` comme l'exemple DSFR 1.14.2) :
  cartes.gouv.fr `https://cartes.gouv.fr`, Site du GIS Sol `https://www.gissol.fr/`, info.gouv.fr
  `https://info.gouv.fr` (au lieu de gouvernement.fr, QUESTIONS Q6), service-public.gouv.fr
  `https://service-public.gouv.fr`, legifrance.gouv.fr `https://legifrance.gouv.fr`, data.gouv.fr
  `https://data.gouv.fr`.
- Pied de page, liens bas : Accessibilité : non conforme `/accessibilite/`, Mentions légales `/mentions-legales/`,
  Données personnelles `/donnees-personnelles/`, Plan du site `/plan-du-site/`.
- Licence : « Sauf mention contraire, tous les contenus de ce site sont sous licence etalab-2.0 », lien
  `https://github.com/etalab/licence-ouverte/blob/master/LO.md`.

Identifiants d'ancrage communs : `#contenu` (main), `#navigation-principale` (nav), `#pied-de-page` (footer),
`#menu-principal` / `#bouton-menu-principal` (modale du menu mobile).

Balisage rendu, copié octet pour octet depuis `apps/accueil/dist/index.html` (section courante = Accueil). Le test
`test/smoke.test.js` vérifie que chaque bloc ci-dessous figure tel quel dans la page générée ; après une
modification des partiels, recopier les blocs depuis `dist/index.html`.

Liens d'évitement (premier enfant de `body`) :

<!-- prettier-ignore -->
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
```

En-tête :

<!-- prettier-ignore -->
```html
<header role="banner" class="fr-header">
  <div class="fr-header__body">
    <div class="fr-container">
      <div class="fr-header__body-row">
        <div class="fr-header__brand fr-enlarge-link">
          <div class="fr-header__brand-top">
            <div class="fr-header__logo">
              <p class="fr-logo">République<br>Française</p>
            </div>
            <div class="fr-header__navbar">
              <button type="button" class="fr-btn--menu fr-btn" data-fr-opened="false" aria-controls="menu-principal" id="bouton-menu-principal" title="Menu">Menu</button>
            </div>
          </div>
          <div class="fr-header__service">
            <a href="/" title="Accueil - sols.cartes.gouv.fr - Observatoire des sols de France">
              <p class="fr-header__service-title">sols.cartes.gouv.fr</p>
            </a>
            <p class="fr-header__service-tagline">Observatoire des sols de France</p>
          </div>
        </div>
        <div class="fr-header__tools">
          <div class="fr-header__tools-links">
            <ul class="fr-btns-group">
              <li>
                <a class="fr-btn" href="https://www.gissol.fr/" target="_blank" rel="noopener external" title="Site du GIS Sol - nouvelle fenêtre">Site du GIS Sol</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fr-header__menu fr-modal" id="menu-principal" aria-labelledby="bouton-menu-principal">
    <div class="fr-container">
      <button type="button" class="fr-btn--close fr-btn" aria-controls="menu-principal" title="Fermer">Fermer</button>
      <div class="fr-header__menu-links"></div>
      <nav class="fr-nav" id="navigation-principale" role="navigation" aria-label="Menu principal">
        <ul class="fr-nav__list">
          <li class="fr-nav__item">
            <a class="fr-nav__link" href="/" target="_self" aria-current="page">Accueil</a>
          </li>
          <li class="fr-nav__item">
            <a class="fr-nav__link" href="/rechercher-une-donnee/" target="_self">Rechercher une donnée</a>
          </li>
          <li class="fr-nav__item">
            <a class="fr-nav__link" href="/explorer-les-cartes/" target="_self">Explorer les cartes</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</header>
```

Pied de page :

<!-- prettier-ignore -->
```html
<footer class="fr-footer" role="contentinfo" id="pied-de-page">
  <div class="fr-container">
    <div class="fr-footer__body">
      <div class="fr-footer__brand fr-enlarge-link">
        <a href="/" title="Retour à l'accueil du site - sols.cartes.gouv.fr - République Française">
          <p class="fr-logo">République<br>Française</p>
        </a>
      </div>
      <div class="fr-footer__content">
        <p class="fr-footer__content-desc">Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la Géoplateforme (texte provisoire).</p>
        <ul class="fr-footer__content-list">
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://cartes.gouv.fr" target="_blank" rel="noopener external" title="cartes.gouv.fr - nouvelle fenêtre">cartes.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://www.gissol.fr/" target="_blank" rel="noopener external" title="Site du GIS Sol - nouvelle fenêtre">Site du GIS Sol</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://info.gouv.fr" target="_blank" rel="noopener external" title="info.gouv.fr - nouvelle fenêtre">info.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://service-public.gouv.fr" target="_blank" rel="noopener external" title="service-public.gouv.fr - nouvelle fenêtre">service-public.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://legifrance.gouv.fr" target="_blank" rel="noopener external" title="legifrance.gouv.fr - nouvelle fenêtre">legifrance.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://data.gouv.fr" target="_blank" rel="noopener external" title="data.gouv.fr - nouvelle fenêtre">data.gouv.fr</a>
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
        <p>Sauf mention contraire, tous les contenus de ce site sont sous <a href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" target="_blank" rel="noopener external" title="licence etalab-2.0 - nouvelle fenêtre">licence etalab-2.0</a></p>
      </div>
    </div>
  </div>
</footer>
```

Pour catalogue et carto : même contenu, `aria-current="page"` sur leur propre entrée de navigation (à la place
de celui d'Accueil), liens vers les autres briques en navigation pleine page (pas de routeur client), mêmes
identifiants d'ancrage.
