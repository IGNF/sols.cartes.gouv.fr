# Catalogue : Changement enviseagable dans le geonetwork-ui

Objectif : lister précisément apporté pour arriver à une brique catalogue exploitable en dehors du 
scope de cartes.gouv et voir ce qu'il est enviseagable dans rendre configurable en no code directement via la presta C2C. 

- **C2C** : Camptocamp, mainteneur de [`geonetwork/geonetwork-ui`](https://github.com/geonetwork/geonetwork-ui).
  Grosse partie de la config via `conf/default.toml` mais cela reste très générique.
- **IGNF** : le fork [`IGNF/geonetwork-ui`](https://github.com/IGNF/geonetwork-ui), qui ajoute l'habillage et les
  services cartes.gouv.fr. Une demande IGNF porte sur du code présent **uniquement** dans le fork (maintenu par CDB).

## Situation relevée (2026-11-24)

| | Valeur |
|---|---|
| Ref utilisée par le projet | `IGNF/geonetwork-ui` `v1.6.2` (`72b9eb4`), voir `apps/rechercher-une-donnee/upstream.json` |
| Point de départ du fork dans l'amont | `57f4be358` (2026-09-28, merge de la PR amont #1743 « Config: Add support for custom filters ») |
| Écart du fork | 304 commits propres à l'IGNF au-dessus de ce point |
| Amont comparé | `geonetwork/geonetwork-ui` `main` `55f3852c7` (2026-11-23) |

Ce que le fork ajoute à l'amont (diff `57f4be358..72b9eb4`, `apps/datahub`, `libs`, `conf`) : en-tête et pied de page
DSFR cartes.gouv.fr codés en dur dans `app.component.html`, modale d'accueil, Keycloak, Matomo, DSFR analytics, motif
de titre `| cartes.gouv.fr`, composant `gpf-api-dl` (téléchargement GPF), bouton visionneuse externe IGN
(`openInIgnExternalViewer`, variables `${geop_type}`, `${tms_style}`), logos IGN et ministères.

Le datahub amont n'a **ni en-tête ni pied de page** : `app.component.html` ne contient que le `router-outlet`.

C'est un peu tout ça qu'on retir / modfie.

## Synthèse : à qui demander quoi

| # | Point | Patch actuel | Demander à | Demande |
|---|---|---|---|---|
| 1 | Filtre de périmètre permanent (« sols ») | 0001, 0005 | **C2C** | Option `[search]` de filtre permanent appliqué à toutes les requêtes ES |
| 2 | Mots-clés en puces à bascule | 0007 | **C2C** | Mode « bascule » des `[[search_preset]]` + rendu accessible |
| 3 | En-tête | 0003 | **IGNF** (puis C2C en option) | Rendre l'en-tête du fork configurable, ou le désactiver |
| 4 | Pied de page | 0003 | **IGNF** (puis C2C en option) | Idem pour le pied de page et le bandeau « lettre d'information » |
| 5 | Modale d'accueil, Keycloak, Matomo, DSFR analytics | 0003 | **IGNF** | Interrupteurs de configuration |
| 6 | Motif du titre d'onglet | 0003 | **IGNF** | Ne plus coder `| cartes.gouv.fr` en dur |
| 7 | Langue par défaut de l'interface | 0003 (`index.html`) | **C2C** | Option `[global] default_language` |
| 8 | Page « organisations » désactivable | 0003 (routeur) | **C2C** | Option pour masquer la page et son lien |
| 9 | Libellés accessibles (RGAA) | 0004 | **C2C** | `aria-label` traduits sur les boutons icône |
| 10 | Lien « Voir sur la carte » sur la fiche | 0006 | **IGNF** (+ C2C pour le rendu lien) | Lien texte réutilisant `external_viewer_url_template` |
| 11 | `baseHref` du serveur de dev | 0002 | **C2C** (faible priorité) | `nx serve` qui suit `--base-href` |
| 12 | Sous-portail GeoNetwork `gissol-osf_c` | 0001, 0005 | **GPF / IGNF** (pas C2C) | Router l'API du sous-portail dans la passerelle GPF |

Priorités suggérées : 1 et 2 (C2C, ce sont les points « filtre de données » et « mot-clé »), puis 3 et 4 (IGNF).

---

## 1. Filtre de données permanent (C2C)

**Aujourd'hui dans l'amont `main`.**
- `SetConfigFilters` / `SearchFacade.setConfigFilters()` existent dans `libs/feature/search`, mais seul le web
  component `gn-results-list` les appelle (attribut `filter`). Le datahub n'a **aucune option** pour s'en servir.
- `[[custom_filter]]` (PR #1743) avec `include_values` / `exclude_values` ne limite que les **valeurs proposées dans un
  filtre avancé** (agrégation), pas les résultats.
- Les agrégations, l'autocomplétion, les fiches similaires (`more_like_this`) et la lecture d'une fiche par
  identifiant ne passent pas par les filtres d'état : même avec `setConfigFilters`, elles restent hors périmètre.

**Ce que fait le projet.** Option `[search] config_filters` (ex. `config_filters.groupPublished = ['gissol-osf_g']`),
lue par 0001 (`SetConfigFilters` sur `mainSearch` et `organization-page`) et par 0005 (filtre `terms` ajouté dans
`ElasticsearchService` : `buildPayloadQuery`, `getMetadataByIdsPayload`, `getRelatedRecordPayload`,
`buildAutocompletePayload`).

**Demande précise à C2C.**
1. Ajouter une option de configuration `[search]` de filtre permanent, par exemple
   `scope_filters.<champ ES> = ['valeur', ...]` (nom à leur convenance), documentée dans `conf/default.toml`.
2. L'appliquer **dans `ElasticsearchService`** (couche repository), pas seulement dans l'état NgRx, pour couvrir :
   recherche, agrégations des filtres et de la liste d'organisations, autocomplétion, fiches similaires, lecture
   par identifiant (une fiche hors périmètre doit répondre « introuvable »).
3. Tests unitaires sur les payloads ES générés.

Notre patch 0005 (21 lignes) peut servir de base de PR. Cas d'usage générique : tout portail thématique adossé à un
GeoNetwork partagé (groupe, catalogue source, mot-clé…).

## 2. Mots-clés (C2C)

**Aujourd'hui dans l'amont `main`.** Les `[[search_preset]]` s'affichent sous la barre de recherche en boutons
`badge-btn` ; un clic appelle `clearSearchAndFilterAndSort` : il **remplace** la recherche et tous les filtres. Pas
d'état « sélectionné », pas de `aria-pressed`, pas de nom de groupe.

**Ce que fait le projet (0007).** Puces DSFR `button.fr-tag[aria-pressed]` dans `ul.fr-tags-group`, rangée
`role="group"` « Mots-clés suggérés » ; un clic **ajoute** le mot-clé au filtre courant, un second le retire ; les
autres filtres et le texte cherché sont conservés ; plusieurs puces se cumulent (OU).

**Demande précise à C2C.**
1. Une option, par exemple `[search] search_preset_mode = 'replace' | 'toggle'` (défaut `replace`, comportement
   actuel), où `toggle` ajoute/retire les filtres du préréglage sans effacer le reste.
2. En mode `toggle` : état sélectionné calculé depuis l'URL, `aria-pressed` sur le bouton, groupe nommé
   (`role="group"` + `aria-label` traduit, clé i18n du type `search.presets.label`).
3. Garder le balisage stylable par thème (classe CSS dédiée), pour que l'IGNF/DSFR puisse appliquer `fr-tag` par CSS
   au lieu de modifier le gabarit.

Option bonus : un filtre `[[custom_filter]]` `base_filter = 'keyword'` avec `include_values` couvre déjà la liste de
mots-clés autorisés dans le filtre avancé ; rien à demander là-dessus.

## 3. En-tête (IGNF, puis C2C en option)

**Constat.** L'en-tête cartes.gouv.fr (`dsfr-header`, menus « Aide » et « Services », bouton « Se connecter »
Keycloak, liens `https://cartes.gouv.fr/...`) est **codé en dur dans le fork** (`apps/datahub/src/app/app.component.html`).
L'amont n'a pas d'en-tête : la demande ne peut pas être faite à C2C telle quelle.

**Ce que fait le projet (0003).** Supprime le bloc et le remplace par `sols-header` (overlay
`apps/datahub/src/app/sols-layout/sols-header.component.ts`, gabarit généré depuis la brique édito).

**Demande précise à l'IGNF.**
1. Section de configuration, par exemple `[layout] header = 'cartes-gouv' | 'none'` ; avec `none`, le fork n'affiche
   pas son en-tête et un projet hôte peut injecter le sien.
2. Ou mieux, paramètres : `service_title`, `service_tagline`, `logo_link`, `operator_image`, liste de liens d'outils
   (`[[header_tool_link]]` : `label`, `url`, `icon`), `show_login = false`.
3. Bouton « Se connecter » conditionné à la configuration Keycloak (point 5).

**Demande possible à C2C (générique).** Un point d'extension de mise en page dans le datahub : par exemple
`[theme] header_html_url` / `footer_html_url` (fragment HTML chargé au démarrage), ou un slot Angular documenté.
Utile à tous les intégrateurs qui veulent l'en-tête de leur charte (DSFR, geOrchestra…).

## 4. Pied de page (IGNF, puis C2C en option)

**Constat.** Bandeau « lettre d'information / communauté » (`fr-follow`) et `dsfr-footer` (texte de présentation,
liens institutionnels, liens obligatoires `plan-du-site`, `accessibilite`, `mentions-legales`, `cgu`, logos
IGN / ministères / CNIG servis par `data.geopf.fr/annexes`) codés en dur dans le fork.

**Ce que fait le projet (0003).** Remplacés par `sols-footer` (overlay), sans le bandeau `fr-follow`.

**Demande précise à l'IGNF.**
1. `[layout] footer = 'cartes-gouv' | 'none'` et `show_follow_banner = false`.
2. Ou paramètres : `footer_description`, `[[footer_partner_logo]]` (`image`, `alt`, `url`),
   `[[footer_mandatory_link]]` (`label`, `url`) — les liens obligatoires (accessibilité, mentions légales) diffèrent
   d'un site à l'autre.

**C2C.** Même demande générique que l'en-tête (point 3).

## 5. Modale d'accueil, Keycloak, Matomo, DSFR analytics (IGNF)

Codés en dur dans le fork (`app.component.ts`, `index.html`) : modale « Bienvenue sur cartes.gouv.fr »
(`welcomeModalGeoservices`), `keycloakCheckAuth`, script Matomo (`matomo.ign.fr`, `siteId` 11), `window.dsfr.analytics`
(domaine `acwg.cartes.gouv.fr`), réécriture DOM du badge « RECHERCHER ».

**Demande à l'IGNF.** Interrupteurs : `[layout] welcome_modal = false`, `[auth] keycloak_url = ''` (vide = désactivé),
`[analytics] matomo_url`, `matomo_site_id`, `dsfr_analytics_domain` (vides = désactivés). Sans eux, tout sous-site
réutilisant le fork envoie ses visites dans les statistiques de cartes.gouv.fr.

## 6. Titre d'onglet (IGNF)

Le fork remplace le défaut amont `{pageTitle} | Datahub` par `{pageTitle} | cartes.gouv.fr` en dur
(`datahub-page-title-strategy.service.ts`). L'amont lit déjà un motif via la plateforme (`titlePattern`). **Demande
IGNF** : revenir au mécanisme amont (motif fourni par la configuration/traduction), pour poser
`{pageTitle} - Observatoire des sols` sans patch. Même chose pour `<title>` et `<html lang="en">` de `index.html`.

## 7. Langue par défaut (C2C)

L'amont propose `[global] languages = [...]` (liste du sélecteur) mais pas de langue **par défaut** : l'interface suit
la langue du navigateur. Le projet force le français en écrivant `localStorage['geonetwork-ui-language'] = 'fr'` dans
`index.html` (0003). **Demande C2C** : option `[global] default_language = 'fr'` (utilisée quand l'utilisateur n'a pas
choisi), et `lang` de `<html>` mis à jour en conséquence (RGAA 8.3).

## 8. Page « organisations » (C2C)

Avec un seul producteur, la page n'apporte rien et sa liste vient d'agrégations non filtrées. Le projet redirige
`organisations` vers la recherche (0003, routeur). **Demande C2C** : option `[search] show_organizations_page = false`
(masque l'onglet et la route). Devient moins nécessaire si le point 1 est livré (liste alors filtrée).

## 9. Accessibilité (C2C)

0004 ajoute des noms accessibles en français codés en dur sur des boutons icône amont : `dropdown-multiselect`,
`dropdown-selector`, `button` (nouvelle entrée `aria-label`), `autocomplete` (« Effacer la recherche », « Lancer la
recherche »), `copy-text-button`, `pagination-dots` (« Page n »), `previous-next-buttons`, `api-card`,
`image-overlay-preview`, `record-api-form`, `map-view` (« Fermer la légende »), `navigation-bar` (« Retour », « Menu
de la fiche »), `record-data-preview`, `search-filters` (« Afficher plus de filtres »), `notify-reuse-form` ;
`aria-owns` sur les listes déroulantes ouvertes.

**Demande C2C.** Reprendre ces libellés **via des clés i18n** (pas du texte en dur), plus l'entrée `aria-label` sur
`gn-ui-button`. Joindre le rapport axe : restent amont `heading-order` (titres de résultats en `h4` dans
`libs/ui/search`, `h4.geosdk--legend-layer-label` de `@geospatial-sdk/legend`) et `empty-heading` sur une légende vide.

## 10. Lien « Voir sur la carte » sur la fiche (IGNF, + C2C)

`openInIgnExternalViewer` et les variables `${geop_type}` / `${tms_style}` n'existent que dans le fork ; l'amont a
`openInExternalViewer` (variables `${layer_name}`, `${service_url}`, `${service_type}`, `${mime_type}`).

**Demande IGNF.** Accepter 0006 tel quel : URL extraite en accesseur `ignExternalViewerUrl`, entrée `label` pour
rendre un `<a href>` (vrai lien, ouvrable dans un onglet, lisible par les lecteurs d'écran) au lieu d'un bouton
`window.open`, et liste de liens WMS/WMTS sous « Téléchargements et flux ».

**Demande C2C (générique).** Même rendu « lien » (`<a href>`) pour `gn-ui-external-viewer-button` amont : un bouton
qui fait `window.open` n'est pas un lien au sens RGAA.

## 11. Serveur de développement sous un sous-chemin (C2C, faible priorité)

`nx serve` ignore `--base-href` et `--serve-path` laisse `<base href="/">` ; le projet patche `baseHref` dans
`apps/datahub/project.json` (0002). **Demande C2C** : documenter ou permettre le lancement du datahub de dev sous un
sous-chemin. N'affecte pas la production.

## 12. Hors C2C : sous-portail `gissol-osf_c` (GPF / IGNF)

La vraie sortie des points 1 et 8 côté projet : que la passerelle `data.geopf.fr` route l'API du sous-portail
GeoNetwork `gissol-osf_c` (question C-1 de `doc/agents/QUESTIONS.md`). `geonetwork4_api_url` pointerait dessus, le
serveur filtrerait, et 0001 + 0005 seraient retirés. À demander à l'équipe Géoplateforme, pas à C2C.

---

## Fichiers modifiés et changements clés

Tout est appliqué par `apps/rechercher-une-donnee/scripts/prepare.mjs` sur le clone `.upstream/` (non versionné) :
copie de `config/default.toml`, copie de `overlay/`, puis `git apply` des patchs dans l'ordre.

### Fichiers du projet (`apps/rechercher-une-donnee/`)

| Fichier | Changements clés |
|---|---|
| `upstream.json` | Dépôt `IGNF/geonetwork-ui`, ref `v1.6.2`, commit `72b9eb4`, `baseHref` `/rechercher-une-donnee/`, port 4200 |
| `config/default.toml` | `[global]` API `data.geopf.fr/catalog` ; `[theme]` couleurs DSFR (`#000091`…), police Marianne, favicon DSFR, vignette `sols-placeholder.svg` ; `[search]` `record_kind_quick_filter = false`, `advanced_filters = ['topic', 'keyword']`, `config_filters.groupPublished = ['gissol-osf_g']`, 5 `[[search_preset]]` mots-clés (RRP, pédologie, carte des sols, RMQS, Carbone organique) ; `[metadata-quality] enabled = false` ; `[map]` fond Plan IGN v2 WMTS, `external_viewer_url_template` vers `/explorer-les-cartes/`, même onglet ; `[translations.fr]` titres, h1, libellés de filtres et messages d'accès restreint |
| `overlay/apps/datahub/src/app/sols-layout/sols-header.component.ts` | En-tête DSFR « Observatoire des sols » (remplace celui de cartes.gouv.fr) |
| `overlay/apps/datahub/src/app/sols-layout/sols-footer.component.ts` | Pied de page DSFR du projet |
| `overlay/apps/datahub/src/app/sols-layout/sols-skiplinks.component.ts` | Liens d'évitement (RGAA) vers `#contenu` |
| `overlay/apps/datahub/src/sols-overrides.css` | Corrections de contraste des couleurs amont (gris des cartes, badges de format, champ de copie, `bg-primary/50`) |
| `overlay/apps/datahub/src/assets/img/sols-placeholder.svg` | Vignette par défaut aux couleurs DSFR |
| `patches/0001` à `0007` | Voir ci-dessous |
| `scripts/*.mjs`, `test/*.test.mjs` | Préparation du clone, build, dev, lint (vérifie que chaque patch est listé dans `doc/catalogue-patches.md`), tests |

### Fichiers amont modifiés par patch

| Patch | Fichiers amont | Changement clé | Retirable si |
|---|---|---|---|
| `0001-search-config-filters` | `libs/util/app-config/src/lib/{model,app-config}.ts`, `apps/datahub/src/app/app.component.ts` | Nouvelle option `[search] config_filters` ; `SetConfigFilters` sur `mainSearch` et `organization-page` au démarrage | C2C point 1, ou GPF point 12 |
| `0002-datahub-base-href` | `apps/datahub/project.json` | `baseHref: "/rechercher-une-donnee/"` pour le serveur de dev | C2C point 11 |
| `0003-sols-layout` | `apps/datahub/src/app/app.component.{html,ts}`, `index.html`, `project.json`, `styles.css`, `home/home-header/home-header.component.html`, `home/home-page/home-page.component.html`, `router/datahub-page-title-strategy.service.ts`, `router/datahub-router.service.ts` | En-tête, pied de page, modale cartes.gouv.fr remplacés par `sols-*` ; `<main id="contenu">` ; Keycloak, Matomo, DSFR analytics retirés ; titre `- Observatoire des sols`, `lang="fr"`, meta description, français forcé ; CSS DSFR (skiplink, radio, display, tag, pictogrammes, favicon) ; lien « producteurs partenaires » retiré ; en-tête de recherche réduit (260 → 160 px) ; `organisations` redirigé vers la recherche | IGNF points 3, 4, 5, 6 ; C2C points 7, 8 |
| `0004-upstream-a11y` | 16 gabarits `libs/ui/{inputs,elements,layout}`, `libs/feature/{record,notify-reuse}`, `apps/datahub/.../{search-filters,navigation-bar,record-data-preview}` | `aria-label` en français, entrée `aria-label` sur `gn-ui-button`, `aria-owns` sur les listes ouvertes | C2C point 9 |
| `0005-elasticsearch-scope` | `libs/api/repository/src/lib/gn4/elasticsearch/elasticsearch.service.ts` | Filtre `terms` de `config_filters` dans toutes les requêtes ES (recherche, agrégations, autocomplétion, similaires, lecture par id) | C2C point 1, ou GPF point 12 |
| `0006-record-map-links` | `apps/datahub/src/app/record/record-apis/record-apis.component.{ts,html}`, `libs/feature/record/src/lib/external-viewer-button/external-viewer-button.component.{ts,html}` | Liens texte « Voir sur la carte » (WMS/WMTS) sous les cartes de flux ; URL IGN extraite dans `ignExternalViewerUrl` ; entrée `label` → `<a href class="fr-link">` | IGNF point 10 |
| `0007-keyword-chips-toggle` | `apps/datahub/src/app/home/home-header/home-header.component.{ts,html}` | Préréglages en tags DSFR à bascule (`aria-pressed`, ajout/retrait du mot-clé via `RouterFacade.updateSearch`), groupe « Mots-clés suggérés » | C2C point 2 |
