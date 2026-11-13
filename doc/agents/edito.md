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
  src/_data/brand.js          contenu partagé @sols/brand (packages/brand/brand.json)
  src/_data/site.js           SEULE source des URL : site, langues, sections, liens externes, structure en-tête / pied
                              (dérivée de brand.json)
  src/_data/i18n/fr.js        toutes les chaînes françaises (interface, pages, accueil)
  src/_data/i18n/en.js        toutes les chaînes anglaises (provisoires, « (placeholder text) »)
  src/_data/accueil.js        structure de l'accueil (liens, clés, pictogrammes DSFR), sans libellé
  src/_data/eleventyComputed.js   locale, t (= i18n[locale]), heading, metaDescription de chaque page
  src/_includes/layouts/      base, page (fil d'Ariane + h1), accueil, aide, articles (liste), article, plan-du-site
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
  Aucune chaîne dans les gabarits, y compris la page de référence partagée (`t.partage`).
- Chaque page porte `<html lang>` de sa langue et `<link rel="alternate" hreflang>` vers elle-même, ses traductions et
  `x-default`. `x-default` vise la page canonique française (`/fr/...`, filtre `defaultLocaleUrl`), pas la page de
  renvoi : une cible `hreflang` doit être canonique, or la page de renvoi est canonicalisée vers `/fr/...`.
- Sélecteur de langue : composant DSFR `fr-translate` dans les outils de l'en-tête ; le bouton porte un `title`
  traduit (« Sélectionner une langue » / « Select a language », comme l'exemple DSFR 1.14.2) ; chaque lien porte
  `hreflang` et `lang` et pointe vers la traduction de la page courante (accueil de la langue à défaut).
- Erreur DSFR amont connue : en enchaînant très vite Échap, Entrée et Tab sur le bouton du sélecteur, le JS DSFR
  1.14.2 lève `Cannot read properties of null (reading 'node')` dans `dsfr.module.min.js` (relevée en revue lors de tests
  clavier automatisés). Elle vient du bundle DSFR, pas du balisage du site, ne bloque pas le menu et n'est pas
  reproductible en usage normal ; à signaler en amont (https://github.com/GouvernementFR/dsfr) si elle réapparaît.
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

## Accueil (v1)

Contenu repris de la maquette Figma (frame « 1440w light », nœud 8:4414 ; textes extraits par l'orchestrateur), en
composants DSFR, dans `layouts/accueil.njk`. Textes français dans `src/_data/i18n/fr.js` (`accueil`), anglais
provisoire dans `en.js` ; structure (clés, liens, icônes, pictogrammes, illustrations, étiquettes) dans
`src/_data/accueil.js` ; événements dans `src/_data/agenda.json`.

1. Héros : surtitre, `h1`, introduction, boutons réels « Rechercher une donnée » / « Explorer les cartes » (au lieu des
   boutons de lancement, G-3), trois chiffres clés (liste). Pas de capture d'application.
2. « Le service » : frise « Sans / Avec » (deux `h3` + listes, icônes DSFR décoratives `fr-icon-close-line` /
   `fr-icon-check-line`), trois tuiles à pictogramme. Pas de vidéo.
3. « Cas d'usage » : trois cartes avec illustration de `@sols/brand` (`alt=""`, décoratives : le titre porte
   l'information), badge « Profil », phrase d'accroche, trois puces, note de bas de section. Correspondance vérifiée
   à l'œil : `cas-usage-1` = chambres d'agriculture, `cas-usage-2` = collectivités (mairie),
   `cas-usage-3` = bureaux d'études (bureau) ; le README de `@sols/brand` inverse 2 et 3 (QUESTIONS E-4).
4. « Données disponibles » : trois cartes non cliquables (icône, titre, étiquettes DSFR `fr-tag` non cliquables,
   ligne « Usage : »), bandeau bleu (jetons `--background-action-high-blue-france` / `--text-inverted-blue-france`)
   avec « Accéder au portail » vers le catalogue.
5. « Agenda » : cartes d'événements dans un carrousel. La liste défile horizontalement (`overflow-x`, scroll-snap) dans
   une `section` nommée et focusable : sans JS, elle défile à la souris, au doigt et au clavier. `src/js/carousel.js`
   (module, ~30 lignes) affiche les boutons « précédent / suivant » (cachés par défaut, `hidden`), les désactive aux
   extrémités et fait défiler d'environ une largeur. Événements passés masqués **au build** (filtre `upcoming`, date du
   build en UTC) : le site doit être reconstruit pour retirer un événement passé ; phrase de repli si aucun.
   Un événement sans `href` dans `agenda.json` renvoie vers `accueil.agenda.defaultHref` (provisoire :
   `/<langue>/aide/#contact`, E-4).
6. « Derniers articles » (articles du site, conservés).
7. « Partenaires & sponsors » : titre et introduction, « Acteurs du réseau » avec les logos disponibles (IGN, INRAE,
   GIS Sol), lien « Site du GIS Sol », encadré vert « Vous produisez des données… » avec « Soumettre des données »
   vers `#contact`. La rangée « Sponsors » de la maquette (vide) n'est pas reprise.

Bandes de couleur : jetons DSFR `--background-alt-blue-france` (héros), `--background-alt-beige-gris-galet` (cas
d'usage, partenaires), `--background-alt-green-emeraude` (agenda). Non repris : CTA de lancement (G-3), vidéo.

Pages du pied de page : `layouts/page.njk` (`pageKey` + `body` dans `i18n`). Centre d'aide `/<langue>/aide/`
(`layouts/aide.njk`, `i18n.pages.aide`) : introduction, trois accordéons DSFR (FAQ provisoire), section « Nous
contacter » `#contact` qui renvoie au formulaire « Nous écrire » et au centre d'aide de cartes.gouv.fr (v1.1, E10 ; plus
d'adresse provisoire). Le menu « Aide » de l'en-tête ne pointe plus vers cette page mais vers cartes.gouv.fr ; elle reste
servie (FAQ provisoire, cible des liens « contact » de l'accueil) avec sa page de renvoi `/aide/`. Le plan du site
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
`dsfr.module.min.js`, `dsfr.nomodule.min.js` et les pictogrammes cités dans `src/_data/accueil.js` et
`site.display.themes` (~2,6 Mo au lieu de 86 Mo). Icônes utilitaires (`fr-icon-*` hors cœur) : au lieu des feuilles
par catégorie (~40 ko chacune), le build extrait la règle de chaque icône listée dans `DSFR_ICONS`
(`eleventy.config.js` : icônes des menus d'outils et de leurs entrées, icônes des badges de `brand.json`, `fr-icon-theme-fill`, icônes de l'accueil) et écrit `/dsfr/icons.css`
(3 règles) avec ses SVG ; une icône inconnue fait échouer le build. Pour une nouvelle icône, l'ajouter à
`DSFR_ICONS`. Les classes utilitaires de couleur de fond (`fr-background-*`) ne sont pas dans `dsfr.min.css` :
utiliser les jetons (`var(--background-alt-blue-france)`) dans `site.css`.

JS : en plus du carrousel de l'agenda (`/js/carousel.js`, accueil seulement) et de `/js/header.js` (Échap dans les
sous-menus du menu mobile, voir « En-tête et pied de page partagés »), le bundle DSFR est chargé pour les
composants interactifs (menu mobile de l'en-tête en modale, menus « Aide » /
« Services », sélecteur de langue, fil d'Ariane repliable, accordéons de l'aide, paramètres d'affichage et schéma
clair / sombre `data-fr-scheme="system"`). Aucun autre JS client ; les pages de renvoi n'en chargent aucun.

## Gabarit de base

`layouts/base.njk` : `<html lang>` de la page, `<title>` (« Titre - Observatoire des sols » / « Title - Soil
observatory », ou le nom seul pour l'accueil), meta description, canonique, `hreflang`, favicons, liens d'évitement,
en-tête, `<main id="contenu" tabindex="-1">` (sans conteneur : chaque page pose ses `fr-container`), pied de page.
Chaque page a un seul `<h1>`.

html-validate : `no-redundant-role` désactivée (le DSFR met `role="banner"`, `role="navigation"`,
`role="contentinfo"` explicites) ; `aria-label-misuse` désactivée (le `div.fr-modal` du menu porte
`aria-labelledby`, il devient un `dialog` via le JS DSFR en mobile).

## En-tête et pied de page partagés v1 (à reproduire dans catalogue et carto)

Source du contenu : le paquet `@sols/brand` (`packages/brand/brand.json`, spécification dans
`packages/brand/README.md`). Côté edito, `src/_data/site.js` (structure, URL, images) et `src/_data/i18n/fr.js`
(libellés français) en dérivent ; `src/_data/i18n/en.js` les traduit. Les images sont republiées sous
`/assets/brand/` (passthrough Eleventy depuis `packages/brand/assets/`).

Les briques catalogue et carto sont en français et utilisent les **chemins sans langue** (`/`, `/aide/`,
`/accessibilite/`, ...) : ce sont des pages de renvoi vers `/fr/...`. Un lien avec ancre ne peut pas passer par une page de
renvoi (le meta refresh perd l'ancre) : le balisage partagé met alors la langue par défaut (`/fr/...#ancre`). Elles n'affichent pas le sélecteur de langue.

### Ce qui change pour catalogue et carto (v1 → v1.1, E10)

- **Menu « Aide »** : liens externes vers l'aide de cartes.gouv.fr (`brand.json` : `href` en français, `hrefTemplate`
  avec `{lang}` pour une brique multilingue, sur « Centre d'aide » seulement : le formulaire « Nous écrire » n'existe
  qu'en français, `/aide/en/nous-ecrire/` répond 404 ; sur une page anglaise ce lien porte `hreflang="fr"`), nouvelle fenêtre (`target="_blank" rel="noopener external"`, `title`
  « … - nouvelle fenêtre »), icône DSFR avant (`fr-link--icon-left` + `icon` de `brand.json` : `fr-icon-question-mark`,
  `fr-icon-mail-line`) et icône « lien externe » après (`.sols-tool-menu__external::after`, icône du cœur DSFR
  `icons/system/external-link-line.svg`), comme sur cartes.gouv.fr. Les entrées « Services » gardent
  `.sols-tool-menu__described` (libellé + description empilés), sauf « Publier une donnée » (#85), lien externe vers
  cartes.gouv.fr : même balisage que les liens d'aide, sans icône avant (`fr-nav__link sols-tool-menu__external`).
- **Badge** : icône DSFR avant et couleur par brique (`brand.json` `badgeStyles.<brique>` : catalogue
  `green-menthe` + `fr-icon-search-line`, carto `purple-glycine` + `fr-icon-map-pin-2-fill`) ; balisage exact dans les
  blocs « Titre du service avec badge » en fin de document (`badges.<brique>` inchangé).
- **Alignement** : en LG, `.fr-header__tools-links` centre verticalement ses enfants (le bouton de langue fait 2 rem,
  les menus 2,5 rem).
- **Mode sombre** : plus de plaque blanche derrière le logo GIS Sol et la marque Observatoire (images transparentes
  depuis X14) ; les logos partenaires du pied de page gardent leur plaque blanche (règle DSFR).

### Ce qui change pour catalogue et carto (v0 → v1)

- **En-tête** : plus de barre `fr-nav` (`#navigation-principale` supprimé) ; le lien de marque (`fr-header__operator`)
  pointe vers `/` et contient le logo GIS Sol puis la marque Observatoire (`alt=""`), séparés par un filet
  (`.sols-operator*` dans `site.css`, à reprendre) ; le titre du service n'est plus un lien ; badge de brique dans
  `fr-header__service-title` (`<span class="fr-badge fr-badge--sm fr-badge--green-menthe">`, « Rechercher » /
  « Explorer » selon `badges`, aucun sur l'edito) ; outils : menus « Aide » et « Services » au lieu du lien « Site du
  GIS Sol » ; pas de « Se connecter ». La modale mobile `fr-header__menu` ne contient plus que
  `fr-header__menu-links` (copie des outils faite par le JS DSFR, identifiants suffixés `-mobile`).
- **Menus d'outils** : pas de composant DSFR dédié ; même motif que le sélecteur de langue `fr-translate` :
  `div.fr-nav > div.fr-nav__item > button.fr-btn.<icône>.fr-btn--icon-left[aria-expanded][aria-controls]` +
  `div.fr-collapse.fr-menu#<id> > ul.fr-menu__list > li > a.fr-nav__link`. Le JS DSFR gère l'ouverture (Entrée,
  Espace), la fermeture (Échap, clic extérieur, ouverture de l'autre menu) et rend le focus au bouton (vérifié au
  clavier). Chevron et alignement : `.sols-tool-menu*` dans `site.css`. Icônes : `fr-icon-question-fill` et
  `fr-icon-grid-fill` (`brand.json` ; `fr-icon-layout-grid-fill` existe aussi dans DSFR 1.14.2), feuilles utilitaires
  DSFR ou `/dsfr/icons.css` réduite de l'edito.
- **Pied de page** : liens de contenu = ceux de `brand.json` (legifrance, info.gouv, service-public, data.gouv ; plus
  cartes.gouv.fr ni gissol.fr) ; nouveau bloc `fr-footer__partners` (IGN, INRAE, GIS Sol → `brand.external.gissol`,
  nouvelle fenêtre, hauteur `.sols-partner-logo`) ; bouton « Paramètres d'affichage » en fin de liens bas et modale
  `fr-display` (`dialog#fr-theme-modal`, pictogrammes DSFR `environment/sun`, `environment/moon`, `system/system`)
  : bascule clair / sombre / système (le JS DSFR mémorise le choix ; `data-fr-scheme="system"` sur `<html>`).
  Variante compacte carto : seulement `fr-footer__bottom` (liens bas + paramètres d'affichage) et la modale.
  Limite DSFR 1.14.2 connue : quand le focus est sur un bouton radio de la modale, Échap ne la ferme pas (le JS DSFR
  ignore la touche dans ce cas) ; « Fermer » ou Échap depuis un autre élément la ferment.
- **Liens d'évitement** : « Contenu » et « Pied de page » seulement (plus de lien « Menu »).

Identifiants d'ancrage communs : `#contenu` (main), `#pied-de-page` (footer), `#menu-principal` /
`#bouton-menu-principal` (modale du menu mobile), `#menu-help`, `#menu-services` (menus d'outils),
`#fr-theme-modal` (paramètres d'affichage).

### Blocs à extraire (catalogue, `apps/rechercher-une-donnee/scripts/layout.mjs`)

Les blocs v0 (en-tête avec `fr-nav` et lien « Site du GIS Sol », pied de page sans partenaires) **n'existent plus**
dans ce document. Trois blocs v1 (plus deux exemples de badge, v1.1), dans cet ordre, chacun introduit par une ligne de libellé terminée par « : », suivie
d'une ligne vide, de `<!-- prettier-ignore -->` et d'un bloc ```` ```html ````. Les libellés commencent par :

1. « Liens d'évitement » : `div.fr-skiplinks`, liens `#contenu` et `#pied-de-page` (plus de `#navigation-principale`).
   À placer en premier enfant de `body`.
2. « En-tête » : `header.fr-header` complet, de `<header role="banner" class="fr-header">` à `</header>`. Il ne
   contient plus de lien `fr-nav__link` de section : la brique ne pose plus `aria-current` dans l'en-tête ; elle
   ajoute son badge dans `p.fr-header__service-title`, après le texte `sols.cartes.gouv.fr` et une espace, exactement
   comme dans le bloc « Titre du service avec badge » de la brique. `div.fr-header__menu-links` est vide : en mode Angular, la brique y recopie elle-même le
   contenu de `div.fr-header__tools-links` (deux `div.fr-nav.sols-tool-menu`, plus de `ul.fr-btns-group`) en
   suffixant `-mobile` aux `id` et aux `aria-controls` correspondants (`menu-help`, `menu-services`), comme le JS DSFR
   le fait en mode statique.
3. « Pied de page et modale « Paramètres d'affichage » » : de `<footer class="fr-footer" ...>` jusqu'à `</dialog>`
   inclus, c'est-à-dire `footer#pied-de-page` puis `dialog#fr-theme-modal`, frères, à insérer tels quels à la fin du
   `body` (avant les scripts).
4. « Titre du service avec badge, catalogue » et « …, carto » (v1.1, en fin de document) : `p.fr-header__service-title`
   avec le badge de la brique, à substituer au titre sans badge du bloc « En-tête ».

**Échap dans le menu mobile (E9, défaut D-edito-2), et dans les menus d'outils du bureau (E11)** : quand le focus est dans un menu d'outils ouvert (« Aide », « Services »,
langue), sur son bouton ou sur un lien du menu, Échap ferme ce menu et rend le focus à son bouton, en bureau comme dans
la modale mobile. DSFR 1.14.2 ne le fait lui-même qu'au point de rupture LG (`Navigation._keydown`, `hasOpenedMenu`) ;
en dessous, `Modal._escape` ferme toute la modale `#menu-principal` (défaut D-edito-2, E9). La revue C13 a signalé
qu'en bureau Échap ne refermait pas « Aide » une fois le focus sur « Centre d'aide » (E11 ; non reproduit en Chromium
sans interface) : le gestionnaire couvre désormais aussi la barre d'outils du bureau, pour ne plus dépendre du chemin
DSFR. `apps/accueil/src/js/header.js` (chargé en module après `dsfr.module.min.js` sur chaque page) écoute `keydown` en
phase de capture sur `document`, donc avant l'écouteur racine DSFR (capture sur `<html>`) : si le focus est dans un
`.fr-header .fr-nav__item` dont le bouton est ouvert, il referme le menu par son bouton (bascule DSFR), rend le focus au
bouton et arrête la propagation ; sinon il laisse passer la touche (le second Échap ferme la modale mobile, focus rendu
au bouton « Menu »). Testé par `test/header-escape.test.js` (DOM happy-dom) et au clavier dans Chromium. Les briques
qui reprennent l'en-tête doivent embarquer ce script (ou son équivalent) :

```js
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') return;
    const item = event.target.closest?.('.fr-header .fr-nav__item');
    const button = item?.querySelector('button[aria-expanded="true"]');
    if (!button) return;
    event.stopPropagation();
    event.preventDefault();
    button.click();
    button.focus();
  },
  { capture: true },
);
```

Ressources requises par ces blocs : `/assets/brand/*` (images de `@sols/brand`, copiées telles quelles depuis
`packages/brand/assets/`, sans transformation, et republiées sous le chemin public de la brique), pictogrammes DSFR `artwork/pictograms/environment/{sun,moon}.svg` et `system/system.svg`, icônes
utilitaires `fr-icon-question-fill`, `fr-icon-grid-fill`, `fr-icon-theme-fill`, `fr-icon-question-mark`, `fr-icon-mail-line`, `fr-icon-search-line` et `fr-icon-map-pin-2-fill` (badges), et les règles `.sols-operator*`,
`.sols-tool-menu*`, `.fr-header__tools-links` (alignement), `.sols-partner-logo` de `apps/accueil/src/css/site.css`.

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
            <div class="fr-header__operator">
              <a class="sols-operator" href="/" title="Retour à l&#39;accueil de l&#39;Observatoire des sols de France - République Française">
                <img class="sols-operator__logo" src="/assets/brand/logo-gissol.png" alt="GIS Sol, groupement d&#39;intérêt scientifique Sol" width="500" height="156">
                <img class="sols-operator__mark" src="/assets/brand/osf-carotte.png" alt="" width="240" height="240">
              </a>
            </div>
            <div class="fr-header__navbar">
              <button type="button" class="fr-btn--menu fr-btn" data-fr-opened="false" aria-controls="menu-principal" id="bouton-menu-principal" title="Menu">Menu</button>
            </div>
          </div>
          <div class="fr-header__service">
            <p class="fr-header__service-title">sols.cartes.gouv.fr</p>
            <p class="fr-header__service-tagline">Observatoire des sols de France</p>
          </div>
        </div>
        <div class="fr-header__tools">
          <div class="fr-header__tools-links">
            <div class="fr-nav sols-tool-menu">
              <div class="fr-nav__item">
                <button type="button" class="fr-btn fr-icon-question-fill fr-btn--icon-left sols-tool-menu__btn" aria-expanded="false" aria-controls="menu-help">Aide</button>
                <div class="fr-collapse fr-menu sols-tool-menu__menu" id="menu-help">
                  <ul class="fr-menu__list">
                    <li>
                      <a class="fr-nav__link fr-link--icon-left fr-icon-question-mark sols-tool-menu__external" href="https://cartes.gouv.fr/aide/fr/" target="_blank" rel="noopener external" title="Centre d&#39;aide - nouvelle fenêtre">Centre d&#39;aide</a>
                    </li>
                    <li>
                      <a class="fr-nav__link fr-link--icon-left fr-icon-mail-line sols-tool-menu__external" href="https://cartes.gouv.fr/aide/fr/nous-ecrire/" target="_blank" rel="noopener external" title="Nous contacter - nouvelle fenêtre">Nous contacter</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="fr-nav sols-tool-menu">
              <div class="fr-nav__item">
                <button type="button" class="fr-btn fr-icon-grid-fill fr-btn--icon-left sols-tool-menu__btn" aria-expanded="false" aria-controls="menu-services">Services</button>
                <div class="fr-collapse fr-menu sols-tool-menu__menu" id="menu-services">
                  <ul class="fr-menu__list">
                    <li>
                      <a class="fr-nav__link sols-tool-menu__described" href="/rechercher-une-donnee/">Rechercher une donnée<span class="fr-hint-text">Le catalogue des données sols</span></a>
                    </li>
                    <li>
                      <a class="fr-nav__link sols-tool-menu__described" href="/explorer-les-cartes/">Explorer les cartes<span class="fr-hint-text">Le visualiseur cartographique</span></a>
                    </li>
                    <li>
                      <a class="fr-nav__link sols-tool-menu__external" href="https://cartes.gouv.fr/publier-une-donnee" target="_blank" rel="noopener external" title="Publier une donnée - nouvelle fenêtre">Publier une donnée</a>
                    </li>
                    <li>
                      <a class="fr-nav__link sols-tool-menu__described" href="/fr/">Découvrir<span class="fr-hint-text">L&#39;Observatoire des sols de France</span></a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fr-header__menu fr-modal" id="menu-principal" aria-labelledby="bouton-menu-principal">
    <div class="fr-container">
      <button type="button" class="fr-btn--close fr-btn" aria-controls="menu-principal" title="Fermer">Fermer</button>
      <div class="fr-header__menu-links"></div>
    </div>
  </div>
</header>
```

Pied de page et modale « Paramètres d'affichage » (juste après le pied de page) :

<!-- prettier-ignore -->
```html
<footer class="fr-footer" role="contentinfo" id="pied-de-page">
  <div class="fr-container">
    <div class="fr-footer__body">
      <div class="fr-footer__brand fr-enlarge-link">
        <a href="/" title="Retour à l&#39;accueil de l&#39;Observatoire des sols de France - République Française">
          <p class="fr-logo">République<br>Française</p>
        </a>
      </div>
      <div class="fr-footer__content">
        <p class="fr-footer__content-desc">Observatoire des sols de France : le portail d&#39;accès aux données des sols pour les territoires, piloté par INRAE avec le GIS Sol et servi par la Géoplateforme (texte provisoire).</p>
        <ul class="fr-footer__content-list">
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://legifrance.gouv.fr" target="_blank" rel="noopener external" title="legifrance.gouv.fr - nouvelle fenêtre">legifrance.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://info.gouv.fr" target="_blank" rel="noopener external" title="info.gouv.fr - nouvelle fenêtre">info.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://service-public.gouv.fr" target="_blank" rel="noopener external" title="service-public.gouv.fr - nouvelle fenêtre">service-public.gouv.fr</a>
          </li>
          <li class="fr-footer__content-item">
            <a class="fr-footer__content-link" href="https://data.gouv.fr" target="_blank" rel="noopener external" title="data.gouv.fr - nouvelle fenêtre">data.gouv.fr</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="fr-footer__partners">
      <h2 class="fr-footer__partners-title">Nos partenaires</h2>
      <div class="fr-footer__partners-logos">
        <div class="fr-footer__partners-sub">
          <ul>
            <li>
              <a class="fr-footer__partners-link" href="https://www.ign.fr/" target="_blank" rel="noopener external" title="IGN - nouvelle fenêtre">
                <img class="fr-footer__logo sols-partner-logo" src="/assets/brand/logo-ign.png" alt="IGN">
              </a>
            </li>
            <li>
              <a class="fr-footer__partners-link" href="https://www.inrae.fr/" target="_blank" rel="noopener external" title="INRAE - nouvelle fenêtre">
                <img class="fr-footer__logo sols-partner-logo" src="/assets/brand/logo-inrae.svg" alt="INRAE">
              </a>
            </li>
            <li>
              <a class="fr-footer__partners-link" href="https://www.gissol.fr/observatoire-des-sols-de-france/" target="_blank" rel="noopener external" title="GIS Sol - nouvelle fenêtre">
                <img class="fr-footer__logo sols-partner-logo" src="/assets/brand/logo-gissol.png" alt="GIS Sol">
              </a>
            </li>
          </ul>
        </div>
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
        <li class="fr-footer__bottom-item">
          <button type="button" class="fr-footer__bottom-link fr-icon-theme-fill fr-btn--icon-left" aria-controls="fr-theme-modal" data-fr-opened="false">Paramètres d&#39;affichage</button>
        </li>
      </ul>
      <div class="fr-footer__bottom-copy">
        <p>Sauf mention contraire, tous les contenus de ce site sont sous <a href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" target="_blank" rel="noopener external" title="licence etalab-2.0 - nouvelle fenêtre">licence etalab-2.0</a></p>
      </div>
    </div>
  </div>
</footer>
<dialog id="fr-theme-modal" class="fr-modal" aria-labelledby="fr-theme-modal-title">
  <div class="fr-container fr-container--fluid fr-container-md">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-md-6 fr-col-lg-4">
        <div class="fr-modal__body">
          <div class="fr-modal__header">
            <button aria-controls="fr-theme-modal" title="Fermer" type="button" class="fr-btn--close fr-btn">Fermer</button>
          </div>
          <div class="fr-modal__content">
            <h2 id="fr-theme-modal-title" class="fr-modal__title">Paramètres d&#39;affichage</h2>
            <div id="fr-display" class="fr-display">
              <fieldset class="fr-fieldset" id="display-fieldset">
                <legend class="fr-fieldset__legend--regular fr-fieldset__legend" id="display-fieldset-legend">Choisissez un thème pour personnaliser l’apparence du site.</legend>
                <div class="fr-fieldset__element">
                  <div class="fr-radio-group fr-radio-rich">
                    <input value="light" type="radio" id="fr-radios-theme-light" name="fr-radios-theme">
                    <label class="fr-label" for="fr-radios-theme-light">Thème clair</label>
                    <div class="fr-radio-rich__pictogram">
                      <svg aria-hidden="true" class="fr-artwork" viewBox="0 0 80 80" width="80px" height="80px">
  <use class="fr-artwork-decorative" href="/dsfr/artwork/pictograms/environment/sun.svg#artwork-decorative"></use>
  <use class="fr-artwork-minor" href="/dsfr/artwork/pictograms/environment/sun.svg#artwork-minor"></use>
  <use class="fr-artwork-major" href="/dsfr/artwork/pictograms/environment/sun.svg#artwork-major"></use>
</svg>

                    </div>
                  </div>
                </div>
                <div class="fr-fieldset__element">
                  <div class="fr-radio-group fr-radio-rich">
                    <input value="dark" type="radio" id="fr-radios-theme-dark" name="fr-radios-theme">
                    <label class="fr-label" for="fr-radios-theme-dark">Thème sombre</label>
                    <div class="fr-radio-rich__pictogram">
                      <svg aria-hidden="true" class="fr-artwork" viewBox="0 0 80 80" width="80px" height="80px">
  <use class="fr-artwork-decorative" href="/dsfr/artwork/pictograms/environment/moon.svg#artwork-decorative"></use>
  <use class="fr-artwork-minor" href="/dsfr/artwork/pictograms/environment/moon.svg#artwork-minor"></use>
  <use class="fr-artwork-major" href="/dsfr/artwork/pictograms/environment/moon.svg#artwork-major"></use>
</svg>

                    </div>
                  </div>
                </div>
                <div class="fr-fieldset__element">
                  <div class="fr-radio-group fr-radio-rich">
                    <input value="system" type="radio" id="fr-radios-theme-system" name="fr-radios-theme">
                    <label class="fr-label" for="fr-radios-theme-system">Système<span class="fr-hint-text">Utilise les paramètres système</span></label>
                    <div class="fr-radio-rich__pictogram">
                      <svg aria-hidden="true" class="fr-artwork" viewBox="0 0 80 80" width="80px" height="80px">
  <use class="fr-artwork-decorative" href="/dsfr/artwork/pictograms/system/system.svg#artwork-decorative"></use>
  <use class="fr-artwork-minor" href="/dsfr/artwork/pictograms/system/system.svg#artwork-minor"></use>
  <use class="fr-artwork-major" href="/dsfr/artwork/pictograms/system/system.svg#artwork-major"></use>
</svg>

                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</dialog>
```

Titre du service avec badge, catalogue :

<!-- prettier-ignore -->
```html
<p class="fr-header__service-title">sols.cartes.gouv.fr <span class="fr-badge fr-badge--sm fr-badge--green-menthe fr-badge--icon-left fr-icon-search-line">Rechercher</span></p>
```

Titre du service avec badge, carto :

<!-- prettier-ignore -->
```html
<p class="fr-header__service-title">sols.cartes.gouv.fr <span class="fr-badge fr-badge--sm fr-badge--purple-glycine fr-badge--icon-left fr-icon-map-pin-2-fill">Explorer</span></p>
```
