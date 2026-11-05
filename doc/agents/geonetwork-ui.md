# geonetwork-ui pour la brique catalogue (`apps/rechercher-une-donnee`)

Investigation C1, menée par l'agent `catalogue-dev` le 2026-11-05. Toutes les affirmations renvoient à un fichier du fork **à la ref épinglée** ou à une sortie de commande rejouable (§7). Les numéros de ligne sont ceux de la ref épinglée.

## 0. En bref

| Question                        | Réponse                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ref épinglée                    | Tag `v1.6.2` du fork `IGNF/geonetwork-ui`, commit `72b9eb4e81b813330a3323503afebc0d1c622a4d` (2026-10-27). C'est **exactement** ce que sert la prod (§4).                                                                                                                                                                                                                   |
| Filtre « sols » de la prod      | Paramètre d'URL `?organization=INRAE - Info&Sols` sur la route `search`, converti en `query_string` ES sur `OrgForResourceObject.default` (§1).                                                                                                                                                                                                                             |
| Périmètre                       | CSW `gissol-osf_c`, filtre `groupPublished:gissol-osf_g` et filtre organisation renvoient **les 7 mêmes identifiants** (§3).                                                                                                                                                                                                                                                |
| Mécanisme « sols seulement »    | Aucune option de config ne force un filtre à v1.6.2. Cible : le sous-portail GeoNetwork `gissol-osf_c` (filtre serveur), aujourd'hui **non routé** par la passerelle GPF (question C-1). Défaut v0 : patch minimal appliquant `groupPublished:gissol-osf_g` comme filtre de configuration de la recherche (mécanisme amont `setConfigFilters`) + lien d'entrée filtré (§2). |
| Lien « Voir sur la carte » (C4) | Possible par configuration : `external_viewer_url_template` accepte un chemin relatif `/explorer-les-cartes/...` et les variables `${layer_name}`, `${service_url}`, `${service_type}`, `${mime_type}`, `${geop_type}`, `${tms_style}` (§2.4).                                                                                                                              |
| Construction (C2)               | Clone superficiel du tag + `npm ci` + `nx build datahub`, piloté par un script npm dans `apps/rechercher-une-donnee`, avec superposition de nos fichiers (config, traductions, assets) et patchs rejoués. L'archive de release seule ne suffit pas car l'en-tête/pied de page cartes.gouv.fr est codé en dur (§5).                                                          |
| Versions                        | Node `>=24` (`.nvmrc` = 24, CI en Node 24) ; testé avec Node 26.5.0 et npm 12.0.2 : OK, avec `--allow-remote=all` obligatoire en npm 12 (§6).                                                                                                                                                                                                                               |

## 1. Comment l'instance générique applique `organization=INRAE - Info&Sols`

URL de départ : `https://cartes.gouv.fr/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols`.

1. **Route.** `apps/datahub/src/app/router/datahub-router.service.ts:49-86` : la route `''` (`HomePageComponent`) a pour enfants `''` → redirection vers `search` (l. 57-61) et `search` → `SearchPageComponent` (l. 70-77). La route `news` est commentée par IGN (l. 62-69) : la page d'accueil du datahub mène directement à la recherche. `organisations` (l. 78-85) et `organization/:name` (l. 103-110) restent actives.
2. **Paramètres d'URL → état.** `libs/feature/router/src/lib/default/state/router.facade.ts:32-38` : `searchParams$` lit les `queryParams` de la route dont le chemin commence par `search`. `libs/feature/router/src/lib/default/state/router.effects.ts:51-107` (`syncSearchState$`) les passe à `FieldsService.buildFiltersFromFieldValues` puis émet `SetFilters` (et `SetSortBy`, `Paginate`) sur l'état de recherche NgRx `mainSearch` (`apps/datahub/src/app/app.component.html:2`, `gnUiSearchRouterContainer="mainSearch"`).
3. **Champ `organization`.** `libs/feature/search/src/lib/utils/service/fields.service.ts:71` associe `organization` à `OrganizationSearchField` (`libs/feature/search/src/lib/utils/service/fields.ts:372-414`), qui retrouve l'organisation par son **nom exact** dans `orgsService.organisations$` (l. 378-383) ; un nom inconnu est ignoré silencieusement.
4. **Service d'organisations.** Stratégie par défaut `metadata` (`libs/api/repository/src/lib/gn4/organizations/organization-strategy.token.ts:5-10`) → `OrganizationsFromMetadataService`. La liste vient d'une agrégation ES sur `contactForResource.organisationObject.default.keyword` et `OrgForResourceObject.default` (`organizations-from-metadata.service.ts:160-212`, pour GN ≠ 4.2.2). Le filtre produit est `{ "OrgForResourceObject.default": { "INRAE - Info&Sols": true } }` (`organizations-from-metadata.service.ts:247-261`).
5. **Requête ES.** `libs/api/repository/src/lib/gn4/elasticsearch/elasticsearch.service.ts:352-430` (`filtersToQuery`) transforme ce filtre en `query_string` `OrgForResourceObject.default:("INRAE - Info&Sols")`, ajouté au `bool.filter` avec `isTemplate:n` (l. 433-466). Requête envoyée en `POST {geonetwork4_api_url}/search/records/_search?bucket=bucket`.

Version de GeoNetwork côté GPF : `curl -s -H 'Accept: application/json' https://data.geopf.fr/catalog/site` → `"system/platform/version":"4.4.5"`. D'où le champ `OrgForResourceObject.default` (et non `OrgForResource`, réservé à 4.2.2) : un `term` sur `OrgForResource` renvoie 0 résultat, un `term` sur `OrgForResourceObject.default` en renvoie 7 (§7, commande C).

Vérification dans un navigateur (build local de v1.6.2 servi sous `/rechercher-une-donnee/`, Playwright) : la page affiche « 7 résultats. » et la requête ES interceptée contient exactement
`[{"terms":{"isTemplate":["n"]}},{"query_string":{"query":"OrgForResourceObject.default:(\"INRAE - Info&Sols\")"}}]`.

**Limite :** ce filtre n'est qu'un paramètre d'URL. L'utilisateur peut le retirer (badge de filtre, champ « Producteur »), et les pages `organisations`, `organization/:name`, `dataset/:uuid` donnent accès à tout le catalogue cartes.gouv.fr.

## 2. Mécanisme « sols seulement » pour notre instance

### 2.1 Candidats examinés à v1.6.2

| Candidat                                       | Existe ?                | Preuve                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Verdict                                |
| ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Filtre forcé dans `default.toml`               | **Non**                 | `libs/util/app-config/src/lib/model.ts:70-82` (`SearchConfig`) : `RECORD_KIND_QUICK_FILTER`, `FILTER_GEOMETRY_*`, `DO_NOT_USE_DEFAULT_SEARCH_PRESET`, `SEARCH_PRESET`, `ADVANCED_FILTERS`, `CUSTOM_FILTERS`, `LIMIT`, `SPATIAL_EXTENT_MAX_FILE_SIZE`, `GEOCODING_PROVIDER*`. Aucun filtre permanent. `filter_geometry_*` ne fait que **booster** (commentaire de `conf/default.toml`, section `[search]`).                                                                                                                                                                                                                                                                                                         | Écarté                                 |
| `[[search_preset]]`                            | Oui                     | `model.ts:54-60` ; badges proposés sous la barre de recherche, l'utilisateur les choisit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Ne limite rien                         |
| `[[custom_filter]]` avec `include_values`      | Oui                     | `model.ts:62-68` ; restreint les **valeurs proposées** d'un filtre, pas les résultats. `base_filter` n'accepte pas `organization`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Ne limite rien                         |
| Lien d'entrée avec le filtre dans l'URL        | Oui                     | §1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Contournable : complément seulement    |
| Sous-portail GeoNetwork                        | **Oui, côté serveur**   | `curl https://data.geopf.fr/catalog/sources` : `{"uuid":"gissol-osf_c","type":"subportal","filter":"groupPublished:gissol-osf_g","groupOwner":689}` (le CSW `csw/gissol-osf_c` est ce sous-portail). Mais `https://data.geopf.fr/geonetwork/gissol-osf_c/api/...` répond `404 {"message":"no Route matched with those values"}` (passerelle), et `https://data.geopf.fr/catalog/gissol-osf_c/api/...` répond 403 (URI interne `/geonetwork/srv/api/gissol-osf_c/api/...`), alors que `https://data.geopf.fr/geonetwork/srv/api/...` répond 200. `https://data.geopf.fr/catalog/` est câblé sur `/geonetwork/srv/api` (une 404 de `catalog/srv/api/site` affiche l'URI interne `/geonetwork/srv/api/srv/api/site`). | Meilleure option, **bloquée** côté GPF |
| Filtre de configuration de l'état de recherche | Oui, dans le code amont | `libs/feature/search/src/lib/state/effects.ts:158-161` fusionne `state.config.filters` dans chaque recherche ; posé par `SearchFacade.setConfigFilters` (`libs/feature/search/src/lib/state/search.facade.ts:135-137`). Utilisé tel quel par le web component `gn-results-list` (`apps/webcomponents/src/app/components/gn-results-list/gn-results-list.component.ts:55-58`, attribut `filter`). Le datahub ne l'expose pas en config.                                                                                                                                                                                                                                                                             | Faisable par **patch minimal**         |

### 2.2 Choix

- **Cible (recommandée) : sous-portail `gissol-osf_c`**, en pointant `geonetwork4_api_url` vers son API. Pure configuration, filtre appliqué **par le serveur** à toutes les requêtes ES (résultats et agrégations : listes de producteurs, thèmes, etc.), même définition que le CSW qui fait foi (`doc/agents/gpf-sols-data.md` §1). Bloqué tant que la passerelle GPF ne route pas `/geonetwork/gissol-osf_c/api`, et le comportement de `/records/{uuid}` hors périmètre reste à vérifier une fois la route ouverte. Question C-1 dans `doc/agents/QUESTIONS.md` : `/catalog` répond déjà `access-control-allow-origin: *`, la demande à l'équipe GPF est donc « router le chemin du sous-portail avec la même politique CORS ».
- **Défaut appliqué en v0 (C3) : patch minimal + lien d'entrée.** Un patch (rejoué par script, consigné dans `doc/catalogue-patches.md`) appelle `setConfigFilters({ groupPublished: { 'gissol-osf_g': true } })` sur l'état `mainSearch` au démarrage, avec la valeur lue dans **notre** `default.toml` (pas de valeur en dur). C'est le mécanisme amont du web component, appliqué au datahub. Les liens de l'edito pointent vers `/rechercher-une-donnee/search`.
  - Filtre retenu : `groupPublished:gissol-osf_g` plutôt que le nom d'organisation, car c'est la définition exacte du sous-portail et du CSW. Si INRAE - Info&Sols publie un jour hors de ce groupe, le nom d'organisation ne suffirait plus. Les deux renvoient aujourd'hui les mêmes 7 fiches (§3).
  - Limites connues : les agrégations ne sont **pas** filtrées (`libs/api/repository/src/lib/gn4/gn4-repository.ts:294-303`, `getSearchRequestBody(aggregations)` sans filtre). Les listes de valeurs des filtres avancés montreraient donc tout le catalogue. À compenser en C3 par `advanced_filters` réduit au strict utile et par la désactivation des pages `organisations` (même patch). Une fiche hors périmètre reste visible si on tape son URL `dataset/<uuid>` : acceptable pour v0, résolu par le sous-portail.
  - Complément de configuration seule (à poser en C3) : retirer `organization` de `advanced_filters` masque le filtre « Producteur », donc aussi le seul moyen offert dans l'interface de retirer un filtre `organization` posé par l'URL. Sans lui, un lien d'entrée `?organization=...` devient un filtre que l'utilisateur ne peut plus enlever (en plus du filtre permanent du patch).
- Écarté : forker le code à la main, les web components seuls (plus d'application datahub : pages fiche, carte, téléchargements à recomposer).

### 2.3 En-tête et pied de page (pour C3)

À v1.6.2, l'en-tête et le pied de page DSFR **ne sont pas configurables** : ils sont écrits en dur dans `apps/datahub/src/app/app.component.html`. On y trouve `dsfr-header` avec `serviceTitle 'cartes.gouv.fr'`, le slogan « Notre territoire commun » et des menus cartes.gouv.fr (l. 5-13 et suivantes), `#header-auth` (l. 109), `dsfr-footer` (l. 166) avec les liens obligatoires `https://cartes.gouv.fr/...` (l. 196-213), et une modale « Bienvenue sur cartes.gouv.fr » (l. 246-320). La section `[theme]` ne règle que des couleurs, polices et favicon (`model.ts:40-52`). La clé de traduction `datahub.header.title.html` concerne l'en-tête de recherche, pas la barre DSFR. Pour avoir « Observatoire des sols » et les liens de l'edito, il faut donc un **patch** de `app.component.html` (à consigner dans `doc/catalogue-patches.md`). Autres points codés en dur à connaître :

- Keycloak : `app.component.ts:112-235` initialise toujours un `check-sso` sur `sso_url`/`client_id`, avec `cartes-gouv-public` et `https://sso.geopf.fr` par défaut si absents. L'URL silencieuse est `/rechercher-une-donnee/assets/silent-check-sso.html` (l. 201-205), ce qui tombe juste avec notre chemin. Le client `cartes-gouv-public` n'autorise probablement pas `sols.cartes.gouv.fr` en redirection. En local, la console affiche une erreur CSP `frame-ancestors` sur `sso.geopf.fr`. Le patch C3 doit retirer le bloc d'authentification de l'en-tête (`keycloakCheckAuth` sort si `#header-auth` est absent, l. 113-114).
- `index.html` : titre « Catalogue | cartes.gouv.fr », Matomo IGN (site 11) et DSFR analytics `acwg.cartes.gouv.fr` (`apps/datahub/src/index.html:5,19`). Fichier à superposer.
- Titre des pages : motif `{pageTitle} | cartes.gouv.fr` (`apps/datahub/src/app/router/datahub-page-title-strategy.service.ts:42`), surchargeable par le motif traduit s'il existe (l. 39-45, à vérifier en C3).
- DSFR : le fork embarque `@gouvfr/dsfr` **1.15.3** (`package.json:67`, `package-lock.json` l. 6199) et `@edugouvfr/ngx-dsfr` 1.20.0, copiés dans `assets/dsfr/` et `styles` (`apps/datahub/project.json:34-65`). Le projet épingle 1.14.2 (`config.dsfrVersion`). Rétrograder casserait potentiellement `ngx-dsfr` (`peerDependencies` `~1.15.0`). Défaut appliqué : garder 1.15.3 dans le catalogue seulement (question C-2, validé par l'orchestrateur).

### 2.4 Lien « Voir sur la carte » (C4)

`libs/feature/record/src/lib/external-viewer-button/external-viewer-button.component.ts` :

- Le bouton apparaît si `external_viewer_url_template` est défini et si le lien sélectionné dans l'aperçu carte est WMS, WFS, WMTS, `maplibre-style` (rendu `tms`) ou un GeoJSON téléchargeable (l. 50-76). Il est placé dans `libs/feature/record/src/lib/map-view/map-view.component.html:27-32`, donc **par lien de service** et non par fiche. Les liens WFS sont désactivés avec un message (`external-viewer-button.component.html`).
- Le datahub IGN appelle `openInIgnExternalViewer()` (l. 95-133). Variables remplacées : `${layer_name}`, `${service_url}` (encodé), `${service_type}` (en **majuscules** : `WMS`, `WMTS`, `TMS`, `GEOJSON`), `${geop_type}` (`OGC`, ou `GPP` pour TMS), `${tms_style}`. `String.replace` ne remplace **que la première occurrence** de chaque variable. Aucune variable pour l'UUID de la fiche.
- Ouverture par `window.open(url, ...)` : un chemin relatif à la racine `/explorer-les-cartes/?...` est résolu sur l'origine courante, donc pas de domaine en dur.

Conclusion : C4 se fait **par configuration**. Format décidé (question C-3) : la brique carto lit `/explorer-les-cartes/?layer=<nom de couche>&type=<wms|wmts|wfs|tms>&url=<URL du service>`. Template à poser en C4 :

```toml
external_viewer_url_template = '/explorer-les-cartes/?layer=${layer_name}&type=${service_type}&url=${service_url}'
external_viewer_open_new_tab = false
```

Le lecteur carto doit accepter `type` en majuscules (`WMS`, `WMTS`, `TMS`, `GEOJSON` ; le bouton est désactivé pour WFS) et un `layer` non encodé (seul `${service_url}` passe par `encodeURIComponent`). Le format de la prod (`l=${layer_name}$GEOPORTAIL:${geop_type}:${service_type}(1;1;1;0${tms_style})`) est celui de cartes.gouv.fr/explorer-les-cartes, pas le nôtre.

## 3. Équivalence CSW / filtre organisation / groupe

| Identifiant                               | CSW `gissol-osf_c`           | GN `OrgForResourceObject.default` = `INRAE - Info&Sols` | GN `groupPublished:gissol-osf_g` |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------- | -------------------------------- |
| `osf63e6c177-455e-5805-b70b-0894ee1c7174` | oui                          | oui                                                     | oui                              |
| `osff858525a-9fea-5ae3-93ab-43afab78483f` | oui                          | oui                                                     | oui                              |
| `osfde26f53e-5c29-5320-b53c-e38abea75fb5` | oui                          | oui                                                     | oui                              |
| `osfd95b355a-dbb8-52f2-bb54-c99ad98c7bd3` | oui                          | oui                                                     | oui                              |
| `1b464210-8702-5296-b738-25978d5d4806`    | oui                          | oui                                                     | oui                              |
| `osfc9008138-f56a-5b19-9cd4-25398dcb4d62` | oui                          | oui                                                     | oui                              |
| `osfd95caa37-436b-431c-9391-643164f010bb` | oui                          | oui                                                     | oui                              |
| **Total**                                 | `numberOfRecordsMatched="7"` | `hits.total.value = 7`                                  | `hits.total.value = 7`           |

Aucune différence (`diff` des listes triées : identiques). Tous sont de type `dataset`, publiés dans les groupes `all` et `gissol-osf_g`. Pour mémoire, `groupPublished:inrae_g` (sous-portail `inrae_c`) contient 2 autres fiches, hors périmètre, et `gissol-osf_a` en contient 0.

## 4. Ref à épingler

| Ref                      | Commit, date             | `version`  | Node | Angular | Remarque                                                                                                |
| ------------------------ | ------------------------ | ---------- | ---- | ------- | ------------------------------------------------------------------------------------------------------- |
| `main`                   | `bdbff98775`, 2026-10-27 | 2.11.0-dev | >=24 | 20.3.19 | Amont + modèles d'issues, **sans** les personnalisations IGN                                            |
| `datahub-ign-dev-latest` | `eef887260f`, 2025-06-05 | 2.6.0-dev  | >=20 | 18.2.13 | Ancien                                                                                                  |
| `datahub-ign-dev-1507`   | `b7be65c20a`, 2025-12-10 | 2.7.0-dev  | >=20 | 18.2.13 | Ancien                                                                                                  |
| `datahub-ign-2905-dev`   | `1831fd8ca1`, 2026-06-03 | 2.9.0-dev  | >=20 | 20.3.15 | Ancien                                                                                                  |
| **`v1.6.2`**             | `72b9eb4e81`, 2026-10-27 | 2.11.0-dev | >=24 | 20.3.19 | **Servi en prod**                                                                                       |
| `datahub-ign-2905`       | `84744f00d1`, 2026-11-02 | 2.11.0-dev | >=24 | 20.3.19 | `v1.6.2` + 104 commits ; dernier commit « premières corrections dsfr (to continue) » : travail en cours |

Preuves que la prod sert `v1.6.2` :

- `curl -sI https://cartes.gouv.fr/rechercher-une-donnee/main.a309dd9117c837a3.js` : `last-modified: Tue, 27 Oct 2026 13:37:03 GMT`. Le bundle contient `{rE:"2.11.0-dev"}` et le motif de titre `{pageTitle} | cartes.gouv.fr`, introduit justement par `v1.6.2` : le compare `v1.6.1...v1.6.2` compte un seul commit, qui touche deux fichiers (`apps/datahub/src/app/record/record-page/record-page.component.ts`, balise meta description, et `apps/datahub/src/app/router/datahub-page-title-strategy.service.ts`, motif de titre).
- La release GitHub `v1.6.2` publie `datahub-1.6.2.zip` (4,4 Mo, sha256 `f2fd6d94…af850f`). Son `main.a309dd9117c837a3.js` a **le même sha256** que celui de la prod (`4e67cac17a10…`). Son `index.html` ne diffère de la prod que par `<base href="/">` (prod : `/rechercher-une-donnee/`), et sa config que par `client_id` (`cartes-gouv-public-dev` contre `cartes-gouv-public`).
- Notre build local de `v1.6.2` produit lui aussi `main.a309dd9117c837a3.js`, avec le même sha256 : **le build est reproductible**.

Choix : **`v1.6.2` (`72b9eb4e81b813330a3323503afebc0d1c622a4d`)**. C'est un tag immuable, déjà en prod et doté d'une release, avec la pile de `main` (Angular 20, Node >= 24). `datahub-ign-2905` est une branche mouvante et en cours de travail. `main` n'a pas les personnalisations IGN (DSFR, GPF, visualiseur externe). La ref ne doit apparaître qu'à un seul endroit (C2) ; monter de version = changer cette valeur et rejouer les patchs.

## 5. Construction en C2 sans modifier l'amont

| Option                                                                                                                      | Coût mesuré                                                                                                                                                                                            | Personnalisation possible                                                                                 | Verdict                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A. Clone superficiel du tag + `npm ci` + `nx build datahub`, superposition de nos fichiers et patchs, piloté par script npm | clone 1,4 s / 35 Mo ; `npm ci` 20,6 s (cache chaud ; ~45 s à froid) / `node_modules` 2,0 Go, 2677 paquets ; build 56 s, **pic mémoire 4,9 Go**, `dist` 14 Mo / 1117 fichiers (machine 22 cœurs, 30 Go) | Totale : config, traductions, `index.html`, en-tête/pied (patch)                                          | **Retenue**                                                                      |
| B. Archive de release `datahub-1.6.2.zip` + réécriture de `<base href>` + notre `default.toml`                              | 4,4 Mo, 0,6 s, pas de `npm ci`                                                                                                                                                                         | Config et traductions seulement ; en-tête/pied cartes.gouv.fr, Matomo IGN et Keycloak **non modifiables** | Insuffisante pour C3 ; possible repli si l'en-tête reste celui de cartes.gouv.fr |
| C. Sous-module git                                                                                                          | Mêmes coûts que A, plus une entrée `.gitmodules` à la racine (hors périmètre de la brique) et un `git submodule update` dans tous les clones                                                           | Comme A                                                                                                   | Écartée : A fait la même chose sans toucher la racine                            |
| D. Web components (`wc-dist-v1.6.2` : `gn-wc.js` 6,7 Mo, `gn-standalone-search.js` 1,8 Mo)                                  | Pas de build                                                                                                                                                                                           | Uniquement des blocs (liste de résultats, recherche, fiche) à composer nous-mêmes ; filtre `filter` natif | Écartée : il faudrait réécrire le datahub (pages fiche, carte, téléchargements)  |

Le workflow `.github/workflows/artifacts.yml` (l. 65-79) produit les archives de release avec `nx run-many --target=build` puis `tools/make-archive.sh`. Il construit aussi des images Docker (hors périmètre v0). Il n'y a pas de paquet npm du datahub construit.

Esquisse pour C2 (option A), entièrement dans `apps/rechercher-une-donnee/` :

- `upstream.json` (ou un champ de `package.json`) : `repo` + `ref` + `sha`. C'est le seul endroit où figure la ref.
- `scripts/prepare.mjs` : `git clone --depth 1 --branch <ref>` dans `.upstream/` (ignoré par git) si absent ou si le SHA diffère, puis `npm ci --allow-remote=all`, application de `patches/*.patch` (`git apply --check` puis `git apply`), copie de `overlay/` sur `.upstream/` : `conf/default.toml`, `apps/datahub/src/index.html`, assets.
- `build` : `prepare`, puis `npx nx build datahub --configuration=production --base-href=/rechercher-une-donnee/`, puis copie de `.upstream/dist/apps/datahub` vers `dist/`.
- `dev` : `prepare`, puis `npx nx serve datahub --port 4200 --base-href=/rechercher-une-donnee/` (vérifier en C2 que le proxy de dev et le chemin Keycloak `localhost` restent cohérents).
- `lint` : `taplo`/validation TOML de notre config + `git apply --check` des patchs ; `test` : test de fumée sur `dist/` (présence de `<base href="/rechercher-une-donnee/">`, config copiée, filtre « sols » présent). Le lint et les tests amont ne nous concernent pas.
- `.gitignore` local : `.upstream/`, `dist/`.

## 6. Versions et prérequis

- Node : `engines.node = ">=24"` (`package.json:4-6`), `.nvmrc` = `24`, CI en `NODE_VERSION: 24` (`.github/workflows/artifacts.yml:21`). Testé ici avec **Node 26.5.0** : build OK, un simple avertissement `EBADENGINE` de `@edugouvfr/ngx-dsfr@1.20.0` (déclare `^20.19 || ^22.12 || ^24`). Node 24 LTS est conseillé pour la CI.
- npm : testé avec **npm 12.0.2**. Deux comportements par défaut de npm 12 comptent :
  - `allow-remote = "none"` : `npm ci` échoue avec `EALLOWREMOTE ... Refusing to fetch "xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` (dépendance `package.json:98`). Il faut `npm ci --allow-remote=all`.
  - `allow-scripts` vide : 12 scripts d'installation sont bloqués (`esbuild`, `nx`, `@gouvfr/dsfr` preinstall, `cypress`, `@parcel/watcher`...). Le build `datahub` passe quand même ; ne pas les autoriser sans besoin.
- Mémoire : prévoir **au moins 6 Go** libres pour le build (pic mesuré 4,9 Go).
- Le build produit des avertissements de budget (`initial` 5,37 Mo pour 2 Mo budgétés) et `NG8113` ; ce n'est pas bloquant, c'est déjà le cas en prod.

## 7. Commandes rejouables

```bash
# A. Prod : config, index, bundle
curl -s https://cartes.gouv.fr/rechercher-une-donnee/assets/configuration/default.toml
curl -s https://cartes.gouv.fr/rechercher-une-donnee/ | grep -oE '<script[^>]*src="main[^"]*"'
curl -s https://cartes.gouv.fr/rechercher-une-donnee/main.a309dd9117c837a3.js | grep -oE 'rE:"[^"]+"'

# B. Refs du fork
git ls-remote --heads --tags https://github.com/IGNF/geonetwork-ui.git | grep -E 'datahub-ign|v1\.6|wc-dist-v1\.6|heads/main'
gh api repos/IGNF/geonetwork-ui/compare/v1.6.1...v1.6.2 --jq '.files[].filename'
curl -sLO https://github.com/IGNF/geonetwork-ui/releases/download/v1.6.2/datahub-1.6.2.zip

# C. API GeoNetwork (GN 4.4.5)
API=https://data.geopf.fr/catalog
curl -s -H 'Accept: application/json' $API/site
curl -s -H 'Accept: application/json' $API/sources   # chercher "gissol-osf_c"
q() { curl -s -X POST "$API/search/records/_search?bucket=bucket" -H 'Content-Type: application/json' -H 'Accept: application/json' -d "$1"; }
q '{"size":0,"track_total_hits":true,"query":{"term":{"OrgForResource":"INRAE - Info&Sols"}}}'                 # 0
q '{"size":0,"track_total_hits":true,"query":{"term":{"OrgForResourceObject.default":"INRAE - Info&Sols"}}}'   # 7
q '{"size":50,"_source":["uuid"],"track_total_hits":true,"query":{"bool":{"filter":[{"term":{"isTemplate":"n"}},{"query_string":{"query":"groupPublished:\"gissol-osf_g\""}}]}}}'  # 7
curl -s -X POST 'https://data.geopf.fr/geonetwork/gissol-osf_c/api/search/records/_search?bucket=bucket' -H 'Content-Type: application/json' -d '{"size":0}'   # 404 no Route matched

# D. Clone, install, build (dossier jetable)
git clone -q --depth 1 --branch v1.6.2 https://github.com/IGNF/geonetwork-ui.git gnui && cd gnui
npm ci --no-audit --no-fund --allow-remote=all
NX_DAEMON=false NX_NO_CLOUD=true npx nx build datahub --configuration=production --base-href=/rechercher-une-donnee/
sha256sum dist/apps/datahub/main.*.js
```

La vérification navigateur (§1) a servi `dist/apps/datahub` sous `/rechercher-une-donnee/` avec un petit serveur statique à repli SPA. Playwright (Chromium sans interface) a ouvert `search?organization=INRAE%20-%20Info%26Sols` et intercepté les `POST .../_search`.

## 8. La brique `apps/rechercher-une-donnee` (C2)

Construite selon l'option A du §5 : rien du dépôt amont n'est copié dans notre dépôt, tout est rejoué depuis la ref épinglée.

| Fichier                                           | Rôle                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `upstream.json`                                   | **Seul endroit** de la ref : dépôt, `ref` (`v1.6.2`), `commit` (SHA complet vérifié après clonage), `app`, `baseHref`, `devPort`.                                                                                                                                                                                                                                                |
| `config/default.toml`                             | Notre configuration, copiée sur `.upstream/conf/default.toml` (que le build publie en `assets/configuration/default.toml`).                                                                                                                                                                                                                                                      |
| `patches/*.patch`                                 | Patchs rejoués dans l'ordre lexical, listés dans `doc/catalogue-patches.md` (le lint échoue sinon).                                                                                                                                                                                                                                                                              |
| `scripts/prepare.mjs`                             | Clone superficiel (`git clone --depth 1 --branch <ref>`) dans `.upstream/`, contrôle du SHA, remise à zéro (`git checkout -- .` puis `git clean -fd`, sans toucher `node_modules`), `npm ci` seulement si `package-lock.json` amont a changé (empreinte dans `node_modules/.sols-install-stamp`), patchs (`git apply --check` puis `git apply`), copie de la config. Idempotent. |
| `scripts/build.mjs`, `scripts/dev.mjs`            | `nx build datahub --configuration=production` puis copie vers `dist/` ; `nx serve datahub --port=4200`. Le base href `/rechercher-une-donnee/` vient de `project.json` (patch 0002), commun au build et au serveur de dev.                                                                                                                                                       |
| `scripts/lint.mjs`, `scripts/checks.mjs`, `test/` | Vérifications hors ligne de ce que la brique possède : syntaxe des scripts, `upstream.json`, config (clés obligatoires, `datahub_url`, `config_filters`, guillemets), patchs documentés, `baseHref` du patch 0002 égal à `upstream.json`. Le code amont n'est ni linté ni testé ici.                                                                                             |
| `.gitignore`                                      | `.upstream/` (~2 Go avec `node_modules`) et `dist/`.                                                                                                                                                                                                                                                                                                                             |
| `package-lock.json`                               | Lockfile vide (aucune dépendance propre), commité pour activer le job `ci-catalogue.yml`.                                                                                                                                                                                                                                                                                        |

Commandes (dans `apps/rechercher-une-donnee`, avec **npm**, hors workspace bun) :

```bash
npm run dev               # prépare .upstream puis http://localhost:4200/rechercher-une-donnee/
npm run build             # prépare puis build de production dans dist/ (base href /rechercher-une-donnee/)
npm run lint              # hors ligne, < 1 s
npm test                  # node --test, hors ligne
npm run prepare-upstream  # clone + install + patchs + config seulement ; --no-install pour sauter npm ci
```

Depuis la racine : `bun run dev:catalogue`, `bun run lint`, `bun run test`, `bun run build:all` (registre `scripts/apps.ts`).

Mesures (Node 26.5.0, npm 12.0.2, 22 cœurs, 30 Go) : premier `npm run build` (clone + `npm ci` + build) 80 s, pic mémoire
4,9 Go ; builds suivants 39 s (pas de nouvel `npm ci`) ; `dev` répond sur le port 4200 après une compilation d'environ une minute.

Versions et options npm :

- Node >= 24 (`engines`, contrôlé par `prepare.mjs`), npm >= 10. Construire et tester avec le **majeur de `.nvmrc`
  (24)**, celui de la CI : `npm run lint` avertit (sans échouer) si le Node courant a un autre majeur. Exemple : avant
  la correction, `cpSync(..., { errorOnExist: true })` passait en Node 26 et échouait en Node 24 (`ERR_FS_CP_EEXIST`) ;
  l'overlay est désormais copié fichier par fichier avec `COPYFILE_EXCL`. Vérifié en Node 24.18.0 / npm 11.16.0.
- `npm ci --allow-remote=all` est passé par `prepare.mjs` : npm 12 refuse par défaut le tarball distant `xlsx` du lockfile
  amont (`EALLOWREMOTE`). npm 10 et 11 autorisent déjà ces tarballs et signalent seulement l'option inconnue.
- npm 12 bloque aussi les scripts d'installation (`allow-scripts`) : on ne les autorise pas, le build n'en a pas besoin.

Configuration retenue (`config/default.toml`) :

- `[global]` : `geonetwork4_api_url = "https://data.geopf.fr/catalog"`, `datahub_url = "/rechercher-une-donnee"`. `sso_url`
  et `client_id` sont retirés, mais le code IGN initialise Keycloak avec ses valeurs par défaut (§2.3) : C3 retire ce bloc.
- `[search]` : `config_filters.groupPublished = ['gissol-osf_g']` (patch 0001, décision C-1), `advanced_filters` sans
  `organization` (§2.2). Les recherches `mainSearch` et `organization-page` sont filtrées ; la liste `/organisations`
  (agrégation) ne l'est pas, voir `doc/catalogue-patches.md`.
- `[map]` : pas encore de `external_viewer_url_template` (C4, décision C-3) ; fond `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2`.
- `[translations.fr]` : libellés IGN repris. La langue de l'interface suit encore le navigateur (repli `en`,
  `libs/util/i18n/src/lib/i18n.providers.ts:35`) : le forçage du français est traité en C3.
- DSFR : 1.15.3 embarqué par le fork, conservé dans le catalogue seulement (décision C-2).

Vérification navigateur du build (Playwright, `doc/screenshots/C2/`) : `/rechercher-une-donnee/` sans paramètre affiche
« 7 résultats. », la requête de résultats porte `query_string` `groupPublished:("gissol-osf_g")` ; `search?q=route`
(9 fiches sans le filtre, même requête `query_string` sur l'API) affiche « Aucun résultat. ». Les requêtes d'agrégation (`size: 0`) ne
portent pas le filtre, conformément à la limite du patch 0001. Deux erreurs console viennent du code IGN (iframe Keycloak
bloquée par la CSP de `sso.geopf.fr`, une 400) et seront traitées en C3 avec l'en-tête.

Contenu d'en-tête et pied de page prévu pour C3 (orchestrateur) : titre de service « sols.cartes.gouv.fr », slogan
« Observatoire des sols de France », navigation Accueil `/`, Rechercher une donnée `/rechercher-une-donnee/`, Explorer les
cartes `/explorer-les-cartes/`, lien rapide « Site du GIS Sol » ; balisage de référence dans `doc/agents/edito.md`.

## 9. Interface française, en-tête et pied de page, périmètre (C3)

Référence d'en-tête et de pied de page : `doc/agents/edito.md` tel que sur `origin/main` au début de C3 (merge `94fb97f`,
dernier commit du fichier `96723edc`), section « En-tête et pied de page partagés ».

Langue :

- Aucune option de config ne fixe la langue par défaut à v1.6.2. `[global] languages` n'affiche qu'un sélecteur
  (`showLanguageSwitcher = getGlobalConfig().LANGUAGES?.length > 0`, `home-header.component.ts:91`). L'initialiseur i18n
  choisit `localStorage['geonetwork-ui-language']`, puis la langue du navigateur, puis `en`
  (`libs/util/i18n/src/lib/i18n.providers.ts:26-36`, clé dans `i18n.constants.ts:17`).
- Mécanisme retenu (patch 0003, `index.html`) : un script en ligne écrit `geonetwork-ui-language = fr` avant le démarrage.
  Sans `localStorage` (navigation privée stricte), la langue du navigateur s'applique. `languages` reste absent : pas de
  sélecteur. `<html lang="fr">`.

En-tête et pied de page :

- `scripts/layout.mjs` extrait les trois blocs HTML (liens d'évitement, en-tête, pied de page) de `doc/agents/edito.md`,
  déplace `aria-current="page"` sur « Rechercher une donnée » (`upstream.json` `baseHref`) et recopie le lien « Site du GIS
  Sol » dans `fr-header__menu-links`. En mode `angular`, le JS DSFR ne fait pas cette copie et l'annonce en console. Les
  gabarits sont écrits dans `.upstream/apps/datahub/src/app/sols-layout/` à chaque `prepare`, à côté des trois composants
  autonomes de `overlay/` (sélecteurs `sols-skiplinks`, `sols-header`, `sols-footer`, `:host { display: contents }`).
  Seule source : un changement des partiels edito (E5 : sélecteur de langue, pages sous `/fr/`) est repris au build
  suivant. Le job `ci-catalogue.yml` ne se déclenche pas sur `doc/agents/edito.md` : relancer `npm test` dans la brique
  après une modification des partiels.
- Le patch 0003 branche ces composants dans `app.component.html` (`<main id="contenu" tabindex="-1">` autour du routeur) et
  retire l'habillage cartes.gouv.fr, Keycloak, Matomo et DSFR analytics (détail dans `doc/catalogue-patches.md`).
- Configuration seule : polices Marianne (`[theme] main_font`, `title_font`), favicon DSFR
  (`/rechercher-une-donnee/assets/dsfr/favicon/favicon.ico`, copié par le patch 0003), `record_kind_quick_filter = false`
  (toutes les fiches sont des jeux de données), `[metadata-quality] enabled = false` (indicateur absent des fiches GPF,
  avertissement console sinon), titres d'onglet et `h1` unique de la page de recherche (`[translations.fr]`
  `datahub.pageTitle.*`, `datahub.header.title.html`).
- DSFR : 1.15.3 du fork (décision C-2) ; les classes de l'en-tête et du pied de page edito sont identiques en 1.14.2 et
  1.15.3.

Périmètre (voir aussi `doc/catalogue-patches.md`, « Limites connues ») :

| Route ou bloc                                            | État                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Recherche (`search`)                                     | Filtrée (patch 0001, `mainSearch`)                                                     |
| `organization/<nom>`                                     | Filtrée (patch 0001, `organization-page`) : 0 fiche pour l'IGN (87 fiches hors filtre) |
| `organisations`                                          | Redirigée vers la recherche (patch 0003)                                               |
| Fiche : « Explorez le catalogue » (fiches similaires)    | Masquée (patch 0003) ; avant : 1 fiche hors périmètre sur `osf63e6c177-…`              |
| Fiche hors périmètre saisie à la main (`dataset/<uuid>`) | Non filtrée (le sous-portail C-1 le réglerait)                                         |
| Fiches associées déclarées dans la métadonnée            | Non filtrées (liens explicites du producteur)                                          |
| Listes de valeurs des filtres avancés                    | Non filtrées (agrégations)                                                             |

Vérification (Playwright, aperçu complet `PORT=8091 bun run preview:all`, contexte navigateur `en-US` sans stockage) :
titre « Rechercher une donnée - Observatoire des sols », `lang="fr"`, aucune chaîne anglaise repérée, en-tête
« sols.cartes.gouv.fr » / « Observatoire des sols de France », `aria-current` sur `/rechercher-une-donnee/`, 4 liens bas de
pied de page, « 7 résultats. », **aucune erreur ni avertissement console** sur la recherche (bureau 1280×900 et mobile
393×851). Messages restants, hors périmètre de C3 :

- Fiche `osf63e6c177-…` : `error: Invalid layer for legend creation` (légende de l'aperçu carte, geospatial-sdk).
- Fiche `osfd95caa37-…` : `Error creating legend for layer INRAE_CARTE-SOLS_WMTS: ... was not found in the endpoint
capabilities`. Le nom WMTS publié dans le CSW n'existe pas (cf. `doc/agents/gpf-sols-data.md` §5), c'est une donnée à
  corriger côté producteur.

Captures : `doc/screenshots/C3/` (recherche bureau et mobile, menu mobile, pied de page, fiche).

## 10. Lien « Voir sur la carte » (C4, format cartes.gouv.fr depuis C6)

Configuration seule, aucun patch (`config/default.toml`, section `[map]`). Décision humaine sur C-3 (C6) : même format
que cartes.gouv.fr, pour l'homogénéité ; seul le domaine est retiré (chemin relatif, même origine) :

```toml
external_viewer_url_template = '/explorer-les-cartes/?l=${layer_name}$GEOPORTAIL:${geop_type}:${service_type}(1;1;1;0${tms_style})&permalink=no'
external_viewer_open_new_tab = false
```

- Même onglet (`window.open(url, '_self')`) : la carte est une autre page du même site.
- `[translations.fr] record.externalViewer.open = "Voir sur la carte"` : nom accessible (`title`) du bouton icône.
- `npm test` et `npm run lint` vérifient la valeur exacte du template (`EXTERNAL_VIEWER_TEMPLATE` dans
  `scripts/checks.mjs`) et `external_viewer_open_new_tab = false`.

Remplacement des variables (`openInIgnExternalViewer`,
`libs/feature/record/src/lib/external-viewer-button/external-viewer-button.component.ts` l. 95-133 à v1.6.2, appelé par
le gabarit du bouton ; `String.replace` : première occurrence seulement, aucune valeur encodée) :

| Variable | Lien WMS, WMTS (`else`, l. 120-130) | Lien `maplibre-style`, affiché TMS (l. 103-118) |
| --- | --- | --- |
| `${layer_name}` | nom du lien (`link.name`), sinon la traduction `externalviewer.dataset.unnamed` | avant-dernier segment de l'URL du lien (`url.href.split('/')`), ici toujours `style` |
| `${geop_type}` | `OGC` | `GPP` |
| `${service_type}` | `WMS`, `WMTS` (majuscules) | `TMS` |
| `${tms_style}` | vide | `;` + la partie après « ` - ` » du nom du lien (`name.split(' - ')[1]`) |
| `${service_url}`, `${mime_type}` | non utilisés par ce template | non utilisés |

WFS : bouton désactivé par le gabarit amont (« Impossible d'ouvrir ce type de service sur le visualiseur externe »),
aucune URL. GeoJSON : `openInIgnExternalViewer` le traiterait comme `OGC:GEOJSON`, cas absent des 7 fiches.

Grammaire du paramètre `l`, telle que le lecteur de cartes.gouv.fr la décode (dépôt `IGNF/cartes.gouv.fr-entree-carto`,
`src/stores/mapStore.js` au commit `f291ae69bc`, commentaire l. 58-67 et `getLayerProperty` l. 483-498) :

```
l=<identifiant>(<position>;<opacité>;<visible>;<niveaux de gris>[;<style>])[,<couche suivante>...]
<identifiant> = <nom>$GEOPORTAIL:<OGC|GPP>:<WMS|WMTS|TMS>
```

Avec le template : position `1`, opacité `1`, visible `1`, niveaux de gris `0`, et pour TMS un cinquième champ `style`.
`permalink=no` (`src/composables/urlParams.js` l. 90-96, valeurs `yes|no|short`) demande de ne pas réécrire l'URL en
permalien. Le template ne transmet **pas** l'URL du service : le lecteur doit retrouver la couche par son nom et son type
dans les services GPF (GetCapabilities).

URL observées (build C6, aperçu complet servi localement, Playwright avec interception de `window.open`, chaque entrée de
la liste des couches de l'aperçu carte sélectionnée tour à tour, 2026-11-05). Les noms viennent du CSW sans validation :

| Fiche | Entrée de la liste | URL ouverte |
| --- | --- | --- |
| `osf63e6c177-…` | `vibrisses_rmqs_gpkg_03-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=vibrisses_rmqs_gpkg_03-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| `osff858525a-…` | `stock_carbone_fao_fr_wmsv (WMS)` | `/explorer-les-cartes/?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| `osfde26f53e-…` | `cartogrammes_gpkg_11-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=cartogrammes_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| | `cartogrammes_gpkg_11-09-2026_tms (TMS)` | `/explorer-les-cartes/?l=style$GEOPORTAIL:GPP:TMS(1;1;1;0;fca2b3ec-0d23-4dfd-baa8-15c10db4bc14_pb_ext_1)&permalink=no` |
| `osfd95b355a-…` | `rrp_landes_gpkg_11-09-2026_tms (TMS)` | pas de bouton (aucun style MapLibre JSON dans la fiche) |
| | `rrp_landes_gpkg_11-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=rrp_landes_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| `1b464210-…` | `rrp_gironde_gpkg_03-09-2026_tms (TMS)` | `/explorer-les-cartes/?l=style$GEOPORTAIL:GPP:TMS(1;1;1;0;c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde)&permalink=no` |
| | `etude_30110_gpkg_03-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=etude_30110_gpkg_03-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| `osfc9008138-…` | `rrp_dept_loiret_gpkg_11-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=rrp_dept_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| | `rrp_loiret_gpkg_11-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| `osfd95caa37-…` | `INRAE_CARTE-SOLS_WMTS (WMTS)` | `/explorer-les-cartes/?l=INRAE_CARTE-SOLS_WMTS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no` |
| | `inrae_carte_sols_wmsr (WMS)` | `/explorer-les-cartes/?l=inrae_carte_sols_wmsr$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| | `INRAE_CARTE-SOLS (WMTS)` | `/explorer-les-cartes/?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no` |
| | `INRAE_CARTE-SOLS (WMS)` | `/explorer-les-cartes/?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |
| | `etude_34015_gpkg_04-09-2026_wmsv (WMS)` | `/explorer-les-cartes/?l=etude_34015_gpkg_04-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` |

Liens WFS (11 au total) : bouton désactivé. 14 URL émises.

Trois exemples pour le lecteur carto (M4), un par type :

- WMS : `/explorer-les-cartes/?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no`
- WMTS : `/explorer-les-cartes/?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no`
- TMS : `/explorer-les-cartes/?l=style$GEOPORTAIL:GPP:TMS(1;1;1;0;c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde)&permalink=no`

Points d'attention pour le lecteur carto :

- `$` et `:` ne sont pas encodés ; `URLSearchParams` les rend tels quels. Un nom de couche n'est jamais encodé.
- WMS : sans URL de service, le même nom peut exister sur `wms-v` et `wms-r`. Exemple réel : `INRAE_CARTE-SOLS (WMS)`, dont
  le lien CSW pointe sur `wms-v` alors que la couche n'existe que sur `wms-r` (`doc/agents/gpf-sols-data.md` §5). Chercher
  le nom dans les capacités des deux services.
- Noms absents des capacités (`INRAE_CARTE-SOLS_WMTS`, `inrae_carte_sols_wmsr`) : afficher un message plutôt qu'une carte vide.
- TMS : `layer` vaut toujours `style` (avant-dernier segment de `.../annexes/gissol-osf/style/<fichier>.json`) et le
  cinquième champ (partie après « - » du nom du lien dans la fiche) vaut ici, pour les deux liens, le nom du fichier de style sans `.json`. Le style MapLibre se trouve donc à
  `https://data.geopf.fr/annexes/gissol-osf/style/<cinquième champ>.json` (vérifié pour les deux liens TMS) ; le nom de
  couche TMS du CSW (`*_tms`) n'est pas transmis.
- Landes, lien TMS : pas de bouton, la fiche n'a qu'un style `.sld` ; le lien WMS de la même fiche fonctionne.

## 11. Corrections de la passe e2e (C5)

Source : `doc/e2e/REPORT.md` (branche `feat/T1-e2e-playwright`), défauts D-cat-1 à D-cat-6. Mesures sur l'aperçu complet
(`PORT=8103 bun run preview:all`), Playwright + `@axe-core/playwright`, bureau 1280×900 et mobile 393×851.

| Défaut | Cause | Correction | Résultat |
| --- | --- | --- | --- |
| D-cat-2 `aria-valid-attr-value` (3) | amont : `aria-owns` vers la liste d'un menu déroulant fermé (Thèmes, Année, Trier par) | patch 0004 | 0 |
| D-cat-3 `button-name` (4) | amont : 2 boutons « effacer » vides dans les filtres, loupe de la recherche et bouton « … » (`gn-ui-button` ignorait `aria-label`) | patch 0004 | 0 |
| D-cat-4 `nested-interactive` (2) | amont : bouton « effacer » dans le bouton du filtre | patch 0004 (`span`) | 0 |
| 3 violations de repères (`main`) | notre `<main id="contenu">` (0003) + `<main>` de `home-page.component.html` | 0003 : le `main` amont devient `div` | 1 `main` partout |
| D-cat-6 menu décalé (x = 148 contre 24) | `apps/datahub/src/styles.css` IGN : `.fr-modal > .fr-container { max-width: 1000px !important }` (pour la modale d'accueil) touche aussi le menu de l'en-tête | 0003 : règle restreinte à `#welcomeModal` | premier lien à x = 24, comme `/fr/` |
| D-cat-5 vide sous la recherche | `gn-ui-sticky-header` de 260 px pour un contenu de ~110 px | 0003 : 160 px | 214 → 114 px entre recherche et filtres |
| D-cat-5 vignette vide | pas reproduit (les 7 vignettes se chargent ; probablement capturées avant chargement) | `thumbnail_placeholder` + SVG DSFR | repli prêt |
| D-cat-1 agrégations non filtrées | `aggregate()` ne reçoit aucun filtre (`gn4-repository.ts` l. 294-303) | patch 0005 (service Elasticsearch) | toutes les requêtes `_search` filtrées |

Aucun des 9 nœuds critiques ou sérieux ne venait de notre en-tête, pied de page ou configuration : tous sont dans
`libs/ui/inputs` ou `apps/datahub` amont. Reste une violation modérée `heading-order` (titres de résultats en `h4`).

Vignette par défaut : `overlay/apps/datahub/src/assets/img/sols-placeholder.svg` (4,7 kB, fond `--background-alt-grey`,
icône DSFR `fr-icon-france-line` en `--text-mention-grey`), publiée en `assets/img/sols-placeholder.svg` (`overlay/` reflète
l'arborescence amont, d'où ce chemin plutôt que `overlay/assets/`).

Effet de 0005 : une fiche hors périmètre saisie à la main n'est plus affichée (« La ressource ... n'a pas pu être
trouvée »), et la section « Explorez le catalogue » (fiches similaires), masquée en C3, est rétablie puisqu'elle ne
propose plus que des fiches « sols ». Les §2.2, §8 et §9 décrivent l'état avant C5 pour ces limites ; la référence
à jour est `doc/catalogue-patches.md`, « Limites connues ».

Captures : `doc/screenshots/C5/`.

## 12. Fiche : accessibilité, vide sous la recherche, aperçu (C7)

Source : `doc/e2e/REPORT.md` (branche `feat/T2-e2e-pass-2`), D-cat-1 et D-cat-3. Mesures sur l'aperçu complet
(`PORT=8103`), Playwright + `@axe-core/playwright`, fiche `osff858525a-9fea-5ae3-93ab-43afab78483f` (bureau 1280×900).

| Règle axe | Avant (nœuds) | Après | Nœuds et gabarit amont | Correction |
| --- | --- | --- | --- | --- |
| `button-name` (critique) | 9 | 0 | bouton retour (`navigation-bar`), zoom de vignette (`image-overlay-preview`), « Voir sur la carte » (`external-viewer-button`, `title` sur l'hôte seulement), fermeture de légende (`map-view`), 4 boutons de copie (`copy-text-button`, dont ceux des cartes d'API), bouton de formulaire d'API (`api-card`) | 0004 |
| `label` (critique) | 5 | 0 | champ et zone de texte de copie (`copy-text-button`), 2 champs et une case du formulaire d'API (`record-api-form`) | 0004 |
| `color-contrast` (sérieuse) | 11 | 0 | détails de cartes `#b4b3b7`, badges de format semi-opaques, zone de copie à 50 %, badge `bg-primary/50` | `sols-overrides.css` |
| `aria-tab-name` (sérieuse) | 1 | 0 | onglet vide de configuration d'aperçu (`record-data-preview`) | 0004 |
| `heading-order` (modérée) | 1 | 1 | `h4` de la légende (`@geospatial-sdk/legend`) | non traité |

Le rapport T2 comptait 6, 4, 10 et 1 nœuds ; l'écart vient du contenu chargé au moment de l'analyse. Sur les autres
fiches, des nœuds supplémentaires sont apparus et ont été corrigés de même : boutons précédent/suivant
(`previous-next-buttons`), points de pagination (`pagination-dots`), menu mobile de la fiche (`navigation-bar`), badge de
format clair (`json`). Résultat sur les 7 fiches, bureau et mobile : 0 violation critique ou sérieuse.

Feuille `overlay/apps/datahub/src/sols-overrides.css`, chargée après `styles.css` (une ligne dans 0003) :

- Vide sous la recherche : `gn-ui-sticky-header` impose sa hauteur en style en ligne ; `height: auto !important` sur ses
  deux conteneurs, plus la rangée de badges vide masquée. Écart champ de recherche / filtres : 114 → 52 px ; l'en-tête
  reste collant au défilement (sans l'animation de réduction).
- Contrastes : couleurs DSFR (`--text-mention-grey`, `--background-action-high-blue-france`) ; les badges de format
  perdent leur couleur par format au profit d'un bleu France uniforme.

Aperçu carte de `stock_carbone` : il s'affiche bien (canvas 990×524 peint, 27 tuiles de fond et 16 GetMap `wms-v` en 200)
dès que la section est visible. Le rendu est différé jusqu'au défilement, d'où le bloc vide des captures e2e. Le bloc vide
sous le titre de la fiche est la hauteur fixe de l'en-tête amont (`sm:h-[344px]`), pas la carte. Fond : le `[[map_layer]]`
WMS `wms-r` hérité de la config IGN renvoyait des 400 sur certaines tuiles et un 502 dans les passes e2e. Il est remplacé
par Plan IGN v2 en tuiles WMTS (`type = 'xyz'`, `TILEMATRIXSET=PM`), comme la brique carto : 3 chargements sur 3 sans
erreur ; un premier essai a reçu 4 réponses 502 du WMTS (instabilité côté GPF, non corrigeable ici).

Captures : `doc/screenshots/C7/`.

## 13. Autocomplétion, filtres et puces de mots-clés (C9)

Mesures sur le build de `main` (`45fe939`, patchs 0001 à 0005), Playwright, toutes les requêtes `_search` interceptées.

- **Autocomplétion** : une seule requête, `POST /search/records/_search?bucket=bucket` (`buildAutocompletePayload`,
  `size: 20`), qui porte déjà `groupPublished:gissol-osf_g` depuis le patch 0005 (C5). « route » ne propose rien ;
  « cadastre » propose une seule fiche « sols » (« Les sols dominants de France métropolitaine », le mot figure dans son
  texte) ; « sol » propose les fiches « sols ». **Non reproduit** sur `main` : l'observation venait probablement d'un
  build antérieur à C5 (avant le patch 0005) ; question C-4.
- **Filtres** : les 6 requêtes d'agrégation (`size: 0`, thèmes, années, formats, licences, organisations) portent le
  filtre depuis C5 ; décomptes observés ≤ 7 (« Agriculture (7) » : les 7 fiches portent les trois mêmes thèmes, un
  décompte par valeur ne peut donc pas se sommer). Également non reproduit (C-4). En revanche, trois filtres n'avaient
  aucune valeur utile dans le périmètre : année de publication (vide), format (vide), licence (« Non reconnue ou absente
  (7) »). `advanced_filters` devient `['topic', 'keyword']` : thèmes (3 valeurs) et mots-clés (85 valeurs, décompte
  maximal 6, liste avec champ de recherche, ce qui correspond au « Rechercher des mots clés… » de la maquette).
- **Puces de mots-clés** (G-2) : configuration seule. Le datahub affiche les `[[search_preset]]` en boutons sous la
  barre de recherche (`home-header.component.html`) ; chacun applique `filters.keyword`. Cinq puces, mots-clés réels :
  RRP (4 fiches), pédologie (4), carte des sols (3), RMQS (2), Carbone organique (1). La rangée, masquée en C7 quand elle
  était vide, est réaffichée par `sols-overrides.css`, avec un aspect de « tag » DSFR (fond `--background-action-low-blue-france`,
  texte `--text-action-high-blue-france`). Une puce **ajoute** le filtre (« RMQS » → 2 résultats, `?keyword=RMQS`) ; le
  **retrait** passe par la croix du filtre « Mot-clé » (→ 7 résultats).
- Limite et proposition de patch (non faite) : une puce n'a pas d'état « sélectionnée » et un second clic ne retire pas le
  filtre ; en outre `clearSearchAndFilterAndSort` remplace la recherche et les autres filtres. Un patch de
  `home-header.component.html` et `.ts` (environ 15 lignes : `aria-pressed` selon `searchFacade.searchFilters$`, bascule du
  mot-clé au lieu du remplacement) rapprocherait la maquette. À décider (question C-4).

axe sur la recherche (bureau et mobile) : 0 violation critique ou sérieuse ; `heading-order` (modérée) inchangée.
Captures : `doc/screenshots/C9/`.

## 15. En-tête et pied de page v1 (C8)

Référence : `doc/agents/edito.md`, section « En-tête et pied de page partagés v1 », sur la branche E7
(`feat/E7-header-footer-v1`, `b49dadb`), et `packages/brand/brand.json`.

Génération (`scripts/layout.mjs`, appelé par `prepare.mjs`) :

- Trois blocs extraits tels quels : liens d'évitement (`#contenu`, `#pied-de-page`), en-tête, pied de page suivi de la
  modale `dialog#fr-theme-modal`.
- Badge de la brique : `brand.json` `badges.catalogue` (« Rechercher ») ajouté dans `p.fr-header__service-title`, en
  `fr-badge fr-badge--sm fr-badge--green-menthe`.
- Menu mobile : en mode `angular`, le JS DSFR ne recopie pas les outils dans `fr-header__menu-links` ; la copie est faite
  à la génération, `id` et `aria-controls` suffixés `-mobile` (`menu-help-mobile`, `menu-services-mobile`). Le JS DSFR
  compare ensuite les deux copies et ajoute `fr-nav__item--align-right` aux menus visibles : cette classe est posée
  d'avance dans les deux copies, sinon il signale une différence en console.
- Chemins : `/assets/brand/*` devient `/rechercher-une-donnee/assets/brand/*` (images copiées depuis
  `packages/brand/assets/` par `prepare.mjs`) ; `/dsfr/artwork/...` devient `/rechercher-une-donnee/assets/dsfr/artwork/...`
  (pictogrammes copiés par le patch 0003).
- CSS : les règles `.sols-operator*`, `.sols-tool-menu*`, `.sols-partner-logo` de `apps/accueil/src/css/site.css` sont
  extraites (y compris dans `@media`) vers `apps/datahub/src/sols-shared.css`, `url(../dsfr/...)` réécrit.

Vérifications (Playwright, bureau 1280×900 et mobile 393×851) : menus « Aide » et « Services » ouverts à la souris et au
clavier (Entrée), fermés par Échap et par clic extérieur ; menu mobile avec les deux menus (`-mobile`) ; lien de marque
→ `/` (page de renvoi vers `/fr/`) ; aucune erreur ni avertissement console sur la recherche ; axe : 0 violation
critique ou sérieuse sur la recherche et la fiche `osff858525a-…` (seule `heading-order`, modérée, amont).

**Paramètres d'affichage : masqués dans le catalogue.** La modale DSFR fonctionne dans l'application Angular (ouverture,
choix enregistré, `data-fr-theme="dark"` posé par le JS DSFR, vérifié). Mais avec la feuille `scheme` DSFR, seul ce qui
utilise les jetons DSFR passe en sombre : les gabarits amont gardent leurs couleurs Tailwind claires (194 classes,
`tailwind.base.css`), d'où des titres et textes sombres sur fond sombre (fiche illisible, capture de test). Sans la
feuille `scheme`, le choix n'a aucun effet. Le bouton « Paramètres d'affichage » est donc masqué dans le catalogue
(`sols-overrides.css`, règle `:has()`), la modale reste dans le balisage (identique à l'edito), et un choix « sombre »
fait sur l'edito n'a pas d'effet ici. Question C-6.

Captures : `doc/screenshots/C8/`.

