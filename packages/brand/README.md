# @sols/brand : identité partagée (v1)

Source unique du contenu de l'en-tête et du pied de page des trois briques, et des images de marque. Décisions issues de `.claude/commands/refine.md` (v1) et de la maquette Figma (en-tête `8:4924`, page carto `1:10562`).

## Consommation

| Brique | Mécanisme |
|---|---|
| edito (bun workspace) | dépendance `"@sols/brand": "workspace:*"`, lecture de `brand.json` dans `src/_data/`, copie des `assets/` nécessaires par passthrough Eleventy vers `/assets/brand/` |
| carto (bun workspace) | dépendance `workspace:*`, `import brand from '@sols/brand/brand.json'`, images importées par Vite |
| catalogue (npm) | `scripts/prepare.mjs` copie `brand.json` et les `assets/` depuis `../../packages/brand/` dans l'overlay ; l'en-tête/pied de page restent générés depuis `doc/agents/edito.md` |

Les chemins d'images sont relatifs à ce paquet ; chaque brique les republie sous son propre chemin public.

## En-tête v1 (toutes briques)

Structure DSFR `fr-header` :

1. `fr-header__brand` : lien vers la page d'accueil de l'Observatoire (`header.brandLink`, jamais vers cartes.gouv.fr) ; bloc Marianne « République Française » ; `fr-header__operator` avec le logo GIS Sol (`operator.logo`) suivi de la marque Observatoire (`operator.mark`, image décorative, `alt=""`) ; `fr-header__service` avec le titre `service.title`, un badge DSFR optionnel (`badges.<brique>`, par exemple « Explorer » sur la carto, « Rechercher » sur le catalogue, aucun sur l'edito) et la tagline `service.tagline`.
2. `fr-header__tools` : deux menus déroulants « Aide » et « Services » (`header.tools.help`, `header.tools.services`), sans bouton « Se connecter » (`login: false`, pas d'authentification en v1). Le DSFR ne fournit pas de menu déroulant dans les outils ; reprendre le motif de cartes.gouv.fr : un bouton `fr-btn` avec icône, `aria-expanded`/`aria-controls`, et un `fr-collapse` contenant une liste `fr-menu__list` de liens (modèle : `apps/datahub/src/app/app.component.html` du fork IGNF/geonetwork-ui v1.6.2, lisible dans le clone `.upstream` de la brique catalogue). Le menu « Services » ne liste que nos services (`services.items`) ; « Découvrir » renvoie à l'accueil.
3. Pas de barre de navigation `fr-nav` sous l'en-tête (supprimée en v1 : elle retardait le rendu et doublonnait « Services »). La `fr-header__menu` ne contient que la copie mobile des outils.
4. Le lien « Site du GIS Sol » n'est plus dans les outils : il vit dans le pied de page (partenaires) et sur la page d'accueil.

## Pied de page v1

`fr-footer` complet (edito, catalogue) : marque + description (`footer.description`), bloc partenaires `fr-footer__partners` avec les trois logos (`footer.partners`, IGN et INRAE obligatoires, lien GIS Sol vers `external.gissol`, libellé inchangé), liens de contenu DSFR (`footer.contentLinks`), liens bas (`footer.bottomLinks`) suivis du composant « Paramètres d'affichage » (`fr-display`, modale DSFR : permet le mode clair/sombre), licence.

Variante compacte (carto, `footer.compactOnCarto`) : uniquement `fr-footer__bottom` (liens bas + « Paramètres d'affichage »), comme sur la maquette `1:10562`.

## Images

| Fichier | Usage | Origine |
|---|---|---|
| `assets/logo-gissol.png` (500×156) | opérateur en-tête, partenaire pied de page | maquette Figma / gissol.fr |
| `assets/osf-carotte.png` (240×240) | marque Observatoire dans l'en-tête | maquette Figma (export) |
| `assets/logo-ign.png` | partenaire pied de page | ign.fr |
| `assets/logo-inrae.svg` | partenaire pied de page | inrae.fr |
| `assets/illustrations/cas-usage-{1,2,3}.jpg` (1200 px) | section « Cas d'usage » de l'accueil (1 : chambres d'agriculture, 2 : bureaux d'études, 3 : collectivités ; vérifier visuellement) | maquette Figma (export) |

Les logos IGN et INRAE sont des marques de leurs titulaires, utilisés comme logos partenaires.
