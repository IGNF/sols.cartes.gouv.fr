# Brique edito (`apps/accueil`, `@sols/accueil`)

Pages statiques servies sous `/` : Eleventy 3 (Nunjucks, Markdown) + DSFR 1.14.2 (`@gouvfr/dsfr`, version exacte,
alignée sur `config.dsfrVersion` du `package.json` racine). Deux langues : français (par défaut) sous `/fr/`, anglais
(textes provisoires) sous `/en/`.

## Commandes (dans `apps/accueil`)

| Commande              | Effet                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `bun run dev`         | serveur Eleventy avec rechargement, http://localhost:8081 (`/` renvoie vers `/fr/`)         |
| `bun run build`       | génère `apps/accueil/dist` (copié tel quel à la racine de `./dist` par `bun run build:all`) |
| `bun run lint`        | build puis `html-validate` sur `dist/**/*.html` (config `.htmlvalidate.json`)               |
| `bun run test`        | `bun test` : build puis contrôles de `dist/`, référencement, liens internes, synchro doc    |
| `bun run check-links` | vérifie seul les liens internes de `dist/` (après un build)                                  |

## Structure

```
apps/accueil/
  eleventy.config.js          plugin i18n, collections, filtres, linter seo-head, copie DSFR minimale vers /dsfr/
  .htmlvalidate.json          html-validate:recommended (voir règles désactivées ci-dessous)
  lib/i18n.js                 localeOf(url), stripLocale(url)
  src/_data/site.js           SEULE source des URL : site, langues, sections, liens externes, structure en-tête / pied
  src/_data/i18n/fr.js        toutes les chaînes françaises (interface, pages, accueil)
  src/_data/i18n/en.js        toutes les chaînes anglaises (provisoires, « (placeholder text) »)
  src/_data/accueil.js        structure de l'accueil (liens, clés, pictogrammes DSFR), sans libellé
  src/_data/eleventyComputed.js   locale, t (= i18n[locale]), heading, metaDescription de chaque page
  src/_includes/layouts/      base, page (fil d'Ariane + h1), accueil, articles (liste), article, plan-du-site
  src/_includes/partials/     skiplinks, header, footer, breadcrumb, article-card, pictogram, head-common, alternates
  src/fr/, src/en/            pages par langue : gabarits vides (front matter `layout` + `pageKey`) et articles .md
  src/reroute.njk             pages de renvoi sans langue (/, /mentions-legales/, ...) vers /fr/...
  src/partage.njk             /partage/en-tete-pied-de-page/ : référence de l'en-tête et du pied de page partagés
  src/sitemap.njk, src/robots.njk   /sitemap.xml et /robots.txt
  src/css/site.css            styles propres au site (jetons DSFR uniquement : fond du héros, surtitre)
  scripts/check-links.js      vérificateur de liens internes (module importé par les tests et script CLI)
  test/                       smoke.test.js (pages, langues, renvois, synchro doc), seo.test.js, helpers
```

## Langues (EleventyI18nPlugin)

- Plugin intégré d'Eleventy 3 (`I18nPlugin`, `defaultLanguage: 'fr'`, `errorMode: 'never'`) : la langue d'une page
  vient du premier segment de son chemin (`src/fr/...` → `/fr/...`). Filtres utilisés : `locale_url` (localise un
  chemin de `site.sections` : `/mentions-legales/` → `/fr/mentions-legales/` sur une page française) et
  `locale_links` (traductions d'une page, pour `hreflang`, le sitemap et le sélecteur de langue).
- Chaînes : une seule source par langue, `src/_data/i18n/<langue>.js`, exposée aux gabarits par la variable `t`.
  Aucune chaîne dans les gabarits.
- Chaque page porte `<html lang>` de sa langue et `<link rel="alternate" hreflang>` vers elle-même, ses traductions et
  `x-default` (le chemin sans langue, c'est-à-dire la page de renvoi).
- Sélecteur de langue : composant DSFR `fr-translate` dans les outils de l'en-tête ; chaque lien porte `hreflang` et
  `lang` et pointe vers la traduction de la page courante (accueil de la langue à défaut).
- Pages de renvoi (`src/reroute.njk`, pagination sur la collection `fr`) : chaque page française a une page à son
  chemin sans `/fr` (`/`, `/accessibilite/`, `/mentions-legales/`, `/donnees-personnelles/`, `/plan-du-site/`,
  `/articles/`, `/articles/<slug>/`) avec `<meta http-equiv="refresh" content="0; url=/fr/...">`, une canonique vers
  la page française, `lang="fr"`, et les liens visibles « Version française » / « English version ». Pas de JS. Elles
  sont exclues du sitemap.
- Liens vers les autres briques (`site.crossBrick` : `/rechercher-une-donnee/`, `/explorer-les-cartes/`) : jamais
  localisés ; sur les pages anglaises ils portent `hreflang="fr"` et un libellé « (in French) ».

### Ajouter une page traduite

1. Chaînes : ajouter `pages.<cle>` (`title`, `description`, et `body` si la page n'est qu'un paragraphe) dans
   `src/_data/i18n/fr.js` **et** `src/_data/i18n/en.js`.
2. Pages : créer `src/fr/<slug>.njk` et `src/en/<slug>.njk` avec le même nom de fichier (le plugin les apparie) :

   ```
   ---
   layout: layouts/page.njk
   pageKey: <cle>
   ---
   ```

   Un contenu propre à la page se met dans un gabarit `src/_includes/layouts/<slug>.njk` (voir `plan-du-site.njk`),
   jamais dans les deux fichiers de langue.
3. Si la page doit être liée depuis l'en-tête ou le pied de page, ajouter son chemin sans langue à `site.sections` et
   l'entrée à `site.header.nav` ou `site.footer.bottomLinks` (libellé dans `i18n/<langue>.js`).
4. La page de renvoi `/<slug>/`, le sitemap et les `hreflang` suivent sans autre modification.

Une nouvelle langue : l'ajouter à `site.languages`, créer `src/_data/i18n/<code>.js` et `src/<code>/`.

## Accueil

Ordre des sections repris de la maquette Figma (frame « 1440w light », nœud 8:4414), en composants DSFR :
héros (surtitre, `h1`, introduction, boutons « Rechercher une donnée » et « Explorer les cartes »), « Le service »
(trois tuiles non cliquables avec pictogramme), « Données disponibles » (trois cartes vers le catalogue et un lien
« Voir toutes les données », titres à valider : QUESTIONS E-1), « Derniers articles », encadré `fr-callout` vers le
site du GIS Sol. Écarts volontaires : pas de chiffres ni d'affirmations de la maquette, pas d'agenda, de partenaires,
de « Se connecter », « Aide », « Services », ni de capture d'application ; pied de page DSFR au lieu du bloc sombre
(QUESTIONS Q7).

Pages du pied de page : `layouts/page.njk` (`pageKey` + `body` dans `i18n`). Le plan du site
(`layouts/plan-du-site.njk`) liste la navigation, les articles et les liens bas de pied de page.

## Articles

Ajouter `src/fr/articles/<slug>.md` (et sa traduction `src/en/articles/<slug>.md`, même nom de fichier) ; publiés
sous `/fr/articles/<slug>/` et `/en/articles/<slug>/` :

```markdown
---
title: Titre de l'article
description: Une phrase pour la carte et la meta description.
date: 2026-11-05
---

Texte en Markdown. Intertitres à partir de `##` (le `h1` est le titre du front matter).
```

La collection `articles` (`src/*/articles/*.md`) est triée par date décroissante et filtrée par langue (`byLocale`).
La liste `/<langue>/articles/` affiche une carte par article de la langue, l'accueil les trois plus récents
(`accueil.articles.max`). Filtres de date : `dateIso` (`2026-11-05`, pour `datetime`) et `dateLong(locale)`
(« 5 novembre 2026 » / « 5 November 2026 »), en UTC. Le fil d'Ariane accepte des niveaux intermédiaires via la
variable `breadcrumb` (`[{ label, href }]`, `href` sans langue).

## Référencement et liens

- `/sitemap.xml` (`src/sitemap.njk`) : toutes les pages `/fr/` et `/en/` de `collections.all` triées par URL, chacune
  avec ses `<xhtml:link rel="alternate" hreflang>` (fr, en, x-default), plus les racines des briques catalogue et
  carto ; URL absolues construites avec `site.url`. `lastmod` seulement pour les pages datées en front matter
  (articles). Les pages de renvoi et la page de référence partagée en sont exclues.
- `/robots.txt` (`src/robots.njk`) : tout autorisé, `Sitemap: https://sols.cartes.gouv.fr/sitemap.xml`.
- Canonique et description : `layouts/base.njk` (`site.url` + `page.url` ; description de `i18n.pages[pageKey]`, du
  front matter, sinon `t.description`). Le linter Eleventy `seo-head` fait échouer le build si une page HTML n'a pas
  de meta description non vide ou de canonique exacte (celle d'une page de renvoi doit viser sa cible).
- Liens internes (`scripts/check-links.js`, lancé par `bun run test`) : chaque `href` / `src` interne de
  `dist/**/*.html` doit aboutir à un fichier ou à un dossier contenant `index.html` ; un fragment `#id` doit exister
  dans la page cible ; les chemins sous `site.crossBrick` sont admis ; les liens externes ne sont pas appelés.

## Ressources DSFR

`eleventy.config.js` copie dans `dist/dsfr/` uniquement : `dsfr.min.css`, chaque fichier que cette feuille référence
via `url()` (polices Marianne / Spectral, ~60 icônes du cœur, dont celle du sélecteur de langue), les favicons,
`dsfr.module.min.js`, `dsfr.nomodule.min.js` et les pictogrammes cités dans `src/_data/accueil.js` (~2,6 Mo au lieu
de 86 Mo). Pour utiliser une classe d'icône utilitaire (`fr-icon-*` hors cœur), ajouter la feuille de la catégorie,
par exemple `utility/icons/icons-map/icons-map.min.css`, à `DSFR_STYLESHEETS` (ses SVG sont copiés automatiquement)
et la lier dans `partials/head-common.njk`. Les classes utilitaires de couleur de fond (`fr-background-*`) ne sont pas
dans `dsfr.min.css` : utiliser les jetons (`var(--background-alt-blue-france)`) dans `site.css`.

JS : le bundle DSFR est chargé pour les composants interactifs (menu mobile de l'en-tête en modale, sélecteur de
langue, fil d'Ariane repliable, schéma clair / sombre `data-fr-scheme="system"`). Aucun autre JS client ; les pages
de renvoi n'en chargent aucun.

## Gabarit de base

`layouts/base.njk` : `<html lang>` de la page, `<title>` (« Titre - Observatoire des sols » / « Title - Soil
observatory », ou le nom seul pour l'accueil), meta description, canonique, `hreflang`, favicons, liens d'évitement,
en-tête, `<main id="contenu" tabindex="-1">` (sans conteneur : chaque page pose ses `fr-container`), pied de page.
Chaque page a un seul `<h1>`.

html-validate : `no-redundant-role` désactivée (le DSFR met `role="banner"`, `role="navigation"`,
`role="contentinfo"` explicites) ; `aria-label-misuse` désactivée (le `div.fr-modal` du menu porte
`aria-labelledby`, il devient un `dialog` via le JS DSFR en mobile).

## En-tête et pied de page partagés (à reproduire dans catalogue et carto)

Les briques catalogue et carto sont en français et utilisent les **chemins sans langue** : Accueil `/`, pages du pied
de page `/accessibilite/`, `/mentions-legales/`, `/donnees-personnelles/`, `/plan-du-site/`. Ces chemins restent
valides : ce sont les pages de renvoi vers `/fr/...` (aucun changement de lien requis dans les autres briques). Elles
n'affichent pas le sélecteur de langue.

Contenu (`src/_data/site.js` pour la structure et les URL, `src/_data/i18n/fr.js` pour les libellés) :

- Bloc marque : « République / Française ». Titre du service : « sols.cartes.gouv.fr ». Devise : « Observatoire des
  sols de France ».
- Navigation : Accueil `/`, Rechercher une donnée `/rechercher-une-donnee/`, Explorer les cartes
  `/explorer-les-cartes/`. Chaque brique met `aria-current="page"` sur sa propre entrée (la page de référence n'en
  porte aucun).
- Accès rapide : « Site du GIS Sol » → `https://www.gissol.fr/` (nouvelle fenêtre).
- Bouton « Menu » : sans `aria-haspopup`, comme l'exemple d'en-tête DSFR 1.14.2 (le JS DSFR gère la modale).
- Pied de page, description : « Observatoire des sols : portail des données sols du GIS Sol (INRAE) servies par la
  Géoplateforme (texte provisoire). »
- Pied de page, liens de contenu (nouvelle fenêtre, `rel="noopener external"` comme l'exemple DSFR 1.14.2), libellé =
  domaine, cible = `https://<domaine>` comme le rend le `Footer` de react-dsfr (QUESTIONS M-1, option b) :
  cartes.gouv.fr, gissol.fr, info.gouv.fr (au lieu de gouvernement.fr, QUESTIONS Q6), service-public.gouv.fr,
  legifrance.gouv.fr, data.gouv.fr.
- Pied de page, liens bas : Accessibilité : non conforme `/accessibilite/`, Mentions légales `/mentions-legales/`,
  Données personnelles `/donnees-personnelles/`, Plan du site `/plan-du-site/`.
- Licence : « Sauf mention contraire, tous les contenus de ce site sont sous licence etalab-2.0 », lien
  `https://github.com/etalab/licence-ouverte/blob/master/LO.md`.

Identifiants d'ancrage communs : `#contenu` (main), `#navigation-principale` (nav), `#pied-de-page` (footer),
`#menu-principal` / `#bouton-menu-principal` (modale du menu mobile).

Balisage de référence : page `/partage/en-tete-pied-de-page/` (`src/partage.njk`, `noindex`, hors sitemap), rendue
avec les mêmes partiels que le site en mode `shared` (chemins sans langue, sans sélecteur de langue). Les blocs
ci-dessous en sont copiés octet pour octet ; `test/smoke.test.js` vérifie qu'ils y figurent tels quels. Après une
modification des partiels, recopier les blocs depuis `dist/partage/en-tete-pied-de-page/index.html`.

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
            <a class="fr-nav__link" href="/" target="_self">Accueil</a>
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
        <a href="/" title="Retour à l’accueil du site - sols.cartes.gouv.fr - République Française">
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
            <a class="fr-footer__content-link" href="https://gissol.fr" target="_blank" rel="noopener external" title="gissol.fr - nouvelle fenêtre">gissol.fr</a>
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
