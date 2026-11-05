# Brique carto : notes techniques (react-dsfr, Vite, geopf-extensions-openlayers)

Notes tenues par l'agent `carto-dev`. Dossier : `apps/explorer-les-cartes`.

## 1. Pile installée (M1, 2026-11-05)

| Paquet                                                                                                             | Version               | Remarque                                                                               |
| ------------------------------------------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------------------------------------------- |
| `react`, `react-dom`                                                                                               | 19.x                  |                                                                                        |
| `@codegouvfr/react-dsfr`                                                                                           | 1.36.0                | embarque DSFR 1.14.2 (= `config.dsfrVersion` racine) ; ne pas ajouter `@gouvfr/dsfr`   |
| `vite` / `@vitejs/plugin-react`                                                                                    | 8.3 / 6.2             |                                                                                        |
| `typescript`                                                                                                       | 5.9                   | aligné sur la racine ; TS 7 n'est pas supporté par `typescript-eslint` 8.72 (`<6.1.0`) |
| `eslint` / `@eslint/js`                                                                                            | 9.x                   | `eslint-plugin-jsx-a11y` 6.10.2 ne déclare pas ESLint 10                               |
| `typescript-eslint` (strict), `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y` |                       | config plate `eslint.config.js`, `no-console: error`                                   |
| `vitest` / `jsdom` / `@testing-library/react` / `@testing-library/jest-dom`                                        | 5.1 / 30 / 16.3 / 7.0 | config `test` dans `vite.config.ts`, setup `src/test/setup.ts`                         |

Bun utilise le linker isolé : les dépendances de l'app sont dans `apps/explorer-les-cartes/node_modules` (liens vers `node_modules/.bun` à la racine).

## 2. Scripts

| Script               | Commande                  | Rôle                                                                                                                  |
| -------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `predev`, `prebuild` | `react-dsfr update-icons` | ne garde dans le CSS que les icônes utilisées (comme IGNF/cartes.gouv.fr) ; `bun run` exécute bien les scripts `pre*` |
| `dev`                | `vite`                    | port 5173 (`strictPort`)                                                                                              |
| `build`              | `tsc -b && vite build`    | sortie `dist/`, servie sous `/explorer-les-cartes/`                                                                   |
| `typecheck`          | `tsc -b`                  | projets `tsconfig.app.json` (src) et `tsconfig.node.json` (vite.config)                                               |
| `lint`               | `eslint .`                |                                                                                                                       |
| `test`               | `vitest run`              |                                                                                                                       |

## 3. Mise en place react-dsfr avec Vite

- `src/main.tsx` : `startReactDsfr({ defaultColorScheme: 'system' })` depuis `@codegouvfr/react-dsfr/spa`, avant le rendu.
- `src/index.css` : `@import url('@codegouvfr/react-dsfr/main.css');` (DSFR + icônes). Polices et favicons sont copiés par Vite dans `dist/assets` (préfixe `base` respecté).
- `index.html` : favicons référencés par `./node_modules/@codegouvfr/react-dsfr/favicon/...` (Vite les résout et les réécrit au build), `lang="fr"`, titre et meta description.
- `vite.config.ts` : `base: '/explorer-les-cartes/'` et `css.lightningcss.errorRecovery: true` (le CSS DSFR contient des hacks IE, `min-width: 0\0`, que lightningcss refuse).
- Liens : pas de `Link` de routeur enregistré, `RegisteredLinkProps` = `<a>` simples. Les rubriques des autres briques (`/`, `/rechercher-une-donnee/`...) sont sur la même origine mais hors de l'app : ancres simples, jamais le routeur.
- Toutes les URL sont dans `src/config/urls.ts` (rubriques, liens externes, points d'accès GPF) ; l'identité du site dans `src/config/site.ts`.

## 4. Pièges rencontrés

- `Header` monte automatiquement la modale « Paramètres d'affichage » (un `<h1>` caché de plus dans le DOM). Il faut fournir le déclencheur : `headerFooterDisplayItem` (de `@codegouvfr/react-dsfr/Display`) est ajouté aux `bottomItems` du `Footer`. Dans les tests, cibler `main h1` et non `h1`.
- `Footer` n'a pas de prop « données personnelles » : l'ordre de rendu est `websiteMapLinkProps`, `accessibilityLinkProps`, `termsLinkProps`, puis `bottomItems`. Pour obtenir « Accessibilité, Mentions légales, Données personnelles, Plan du site », le plan du site est passé dans `bottomItems`. La mention de licence par défaut est etalab-2.0.
- Un lien `target="_blank"` reçoit déjà l'icône « nouvelle fenêtre » du DSFR : ne pas choisir `fr-icon-external-link-line` comme `iconId` d'un accès rapide (icône doublée).
- jsdom : les composants `Header` / `Footer` se rendent sans mock de `matchMedia`.

## 5. geopf-extensions-openlayers (M2, mis à jour en M3, 2026-11-05)

### 5.1 Versions et sources lues

| Paquet | Version | Remarque |
|---|---|---|
| `geopf-extensions-openlayers` | 1.0.0-beta.16 (tag `1.0.0-beta.16`) | dépend de `ol ^10.8`, `@gouvfr/dsfr 1.14.4`, `geoportal-access-lib 3.4.7` ; pair `@panoramax/web-viewer` (non installé) |
| `ol` | 10.11.0 | |
| `zustand` / `@tanstack/react-query` | 5.0 / 5.106 | |

Lu dans `node_modules/geopf-extensions-openlayers` : `README.md`, `DOCUMENTATION.md` (identique à celui du tag), `src/index.d.ts`,
`src/packages/Layers/LayerWMTS.{js,d.ts}`, `src/packages/Utils/Config.js`, `src/packages/Controls/LayerSwitcher/LayerSwitcher.{js,d.ts}`,
`src/packages/Controls/Control.js`, la démo `demos/react-project` du tag ; en M3 : `Controls/Zoom/GeoportalZoom.{js,d.ts}`,
`Controls/FullScreen/GeoportalFullScreen.{js,d.ts}`, `Controls/Attribution/GeoportalAttribution.{js,d.ts}`,
`Controls/SearchEngine/SearchEngine.{js,d.ts}` et `SearchEngineDOM.js`, `geoportal-access-lib/src/Services/Services.js` (URL de géocodage). JSDoc : https://ignf.github.io/geopf-extensions-openlayers/jsdoc/
(la page n'affiche pas de numéro de version ; se fier aux `.d.ts` installés). Intégration React de référence :
IGNF/cartes.gouv.fr-guichet-collaboratif, branche `develop` (`src/features/navigation/MainMap.tsx`, `controls/layerSwitcherControl.ts`,
`src/hooks/navigation/useGpConfig.ts`, `layers/useGetWMTSLayer.tsx`, `capabilities/useGetCapabilitiesWMTS.ts`).

### 5.2 Imports : un seul module, `src/map/geopf.ts`

- Le paquet n'a pas de champ `exports` : les **imports profonds** (`src/packages/...`) fonctionnent avec Vite et ont des types
  (`.d.ts` à côté de chaque `.js`). **Tous** passent par `src/map/geopf.ts` (contrôles, types d'options, CSS) : une montée de version
  ne touche que ce fichier. Le reste du code importe `../map/geopf`, et les tests simulent ce module (`vi.mock('../map/geopf')`).
- **Fragilité** : ces chemins ne sont pas une API publique et peuvent changer d'une version bêta à l'autre.
  La version est donc **épinglée exactement** dans `apps/explorer-les-cartes/package.json` (`"geopf-extensions-openlayers": "1.0.0-beta.16"`,
  sans `^` ni `~`). Toute montée de version : vérifier chaque import de `geopf.ts`, les `.d.ts` utilisés et relancer tests + contrôle Playwright.
- **Ne pas importer l'index racine** (`from 'geopf-extensions-openlayers'`) : il réexporte le contrôle `Panoramax`, qui importe
  `@panoramax/web-viewer` (dépendance pair non installée) et tire tous les widgets.
- Chaque contrôle importe son CSS structurel (`GPF*.css`) : Vite le gère sans configuration.
- Découpage (`vite build`, M3) : `index` 391 kB (103 kB gzip) ; `MapExplorer` (OpenLayers, LayerSwitcher, zoom, plein écran,
  attributions) 695 kB (203 kB gzip), chargé par `React.lazy` ; `SearchEngine` 567 kB (161 kB gzip : `geoportal-access-lib`, proj4,
  classes de couches geopf) chargé à part par `loadSearchEngine()` **après** l'affichage de la carte. `chunkSizeWarningLimit` = 1000 kB.

### 5.3 CSS

- `ol/ol.css` (dans `MapView.tsx`) et, dans `geopf.ts`, **uniquement** les feuilles DSFR utiles : `CSS/DSFRgeneralWidget.css` et
  `CSS/Controls/{Zoom/DSFRzoomStyle,FullScreen/DSFRfullScreenStyle,LayerSwitcher/DSFRlayerSwitcherStyle,SearchEngine/DSFRsearchEngineStyle}.css`.
  `Attribution/DSFRattributionStyle.css` est vide (1 octet) : non importé. CSS de la carte : 348 kB (M2, `css/Dsfr.css` complet avec
  images en ligne et CSS Panoramax) → 154 kB.
- Rendu identique au bundle complet (comparaison de captures du moteur de recherche avec et sans `css/Dsfr.css`).
- Ces feuilles **supposent le DSFR déjà chargé**, fourni par react-dsfr 1.14.2 ; ne pas charger `@gouvfr/dsfr` 1.14.4 en plus.

### 5.4 Configuration et clé d'API

- Aucune clé n'est nécessaire : les services GPF sont en accès libre.
- Les **couches** geopf-ext (`LayerWMTS`, `LayerWMS`, `LayerMapBox`) exigent une configuration : option `configuration`
  ou objet global `Gp.Config` chargé par `Gp.Services.getConfig` (`geoportal-access-lib`), sinon le constructeur lève
  `contract key configuration has to be loaded`. Le guichet charge `fullConfig.json` depuis raw.githubusercontent.com
  (dépôt `IGNF/geoportal-configuration`, ~330 kB gzip ; il existe aussi `solConfig.json` avec `INRA.CARTE.SOLS`).
- **Choix M2** : pas de `Gp.Config`. Le fond Plan IGN est une couche OpenLayers standard (`ol/source/WMTS` +
  `optionsFromCapabilities`) construite depuis le GetCapabilities WMTS de `data.geopf.fr` (265 kB gzip, CORS `*`), chargé une
  fois par TanStack Query (`staleTime`/`gcTime` infinis). Le nom de couche est ainsi vérifié contre les capacités à l'exécution
  (`createWmtsLayer` renvoie `null` si absent, l'interface affiche une alerte). Le `LayerSwitcher` accepte toute couche OL.
- M3 : le `SearchEngine` n'a pas besoin de `Gp.Config` tant que `resources.search` reste à `false` (recherche de couches, qui
  ajoute des couches geopf à la carte). Autocomplétion et géocodage passent par `geoportal-access-lib` :
  `https://data.geopf.fr/geocodage/completion` et `/geocodage/search` (CORS `*`, sans clé ; vérifié en `curl` et dans Playwright).
- Les capacités WMTS complètes (~265 kB gzip, 3 MB de XML) sont **analysées sur le fil principal** par `ol/format/WMTSCapabilities` :
  mesure Playwright (Chromium headless, aperçu local, 5 chargements) : réponse des capacités ~490 ms après la navigation, puis **une tâche
  longue de 173 à 188 ms** (l'analyse), première tuile demandée ~700 ms et reçue **~735 ms** après la navigation. Piste si cela devient
  gênant : analyser dans un Web Worker, ou générer au build un extrait des capacités limité aux fonds candidats.

### 5.5 Architecture React (style guichet-collaboratif)

| Élément | Rôle |
|---|---|
| `src/store/useMapStore.ts` (Zustand) | état client : instance `map`, `activeBaseLayerId`, `isPanelOpen` |
| `src/hooks/useWmtsCapabilities.ts` (TanStack Query) | état serveur : capacités WMTS GPF, jamais recopiées dans le store |
| `src/hooks/useMap.ts` | crée **une** carte dans un effet, la publie dans le store, `setTarget(undefined)` + `dispose()` au démontage (couvre le double montage StrictMode) |
| `src/hooks/useBaseLayerCatalogue.ts` | fonds candidats publiés dans les capacités (`availableBaseLayers`) et fond effectif dérivé (choix du store, sinon le premier disponible) |
| `src/hooks/useBaseLayer.ts` | `useMemo` crée la couche depuis les capacités, l'effet l'insère en position 0 et la retire au nettoyage (changement de fond compris) |
| `src/hooks/useMapControls.ts` | zoom, plein écran, attributions geopf + échelle OL dans un effet ; `SearchEngine` chargé à la demande puis ajouté si la carte est toujours montée |
| `src/components/map/BaseLayerPanel.tsx` | panneau DSFR « Fonds de carte » : `RadioButtons` (flèches du clavier) → `setActiveBaseLayer` |
| `src/components/map/MapExplorer.tsx` | bouton « Masquer/Afficher les fonds de carte » (`aria-expanded`, `aria-controls`, `togglePanel`) + grille panneau/carte |
| `src/hooks/useLayerSwitcher.ts` | ajoute le `LayerSwitcher` dans un effet, `removeControl` au nettoyage |
| `src/config/map.ts` | fonds candidats (`BASE_LAYER_CANDIDATES`), vue initiale, options des outils et du `LayerSwitcher`, libellés, attribution, délai de nouvel essai |

L'état OpenLayers (vue, visibilité, opacité, ordre) reste dans les objets OL : pas de copie dans React. `useMap` observe la taille du
conteneur (`ResizeObserver` → `map.updateSize()`) : la carte s'élargit quand le panneau est masqué.

### 5.6 LayerSwitcher : options et comportement

- Signature : `new LayerSwitcher({ layers?: LayerSwitcherLayersConfig[], options?: LayerSwitcherOptions })`.
- Options utilisées (vérifiées dans `LayerSwitcher.d.ts`) : `position: 'top-right'`, `collapsed: true`, `panel: true`,
  `counter: true`, `allowDelete: false`, `allowEdit: false`.
- Dans `setMap`, le contrôle ajoute les couches déjà présentes puis **écoute `map.getLayers()` (`add`/`remove`)** : ajouter ou
  retirer une couche de la carte suffit, inutile d'appeler `addLayer`. Libellé et description lus dans les propriétés OL
  `title` et `description` (réactives via `layer.set`).

### 5.6 bis Outils (M3)

| Outil | Classe | Options (vérifiées dans les `.d.ts` / sources) |
|---|---|---|
| Zoom | `GeoportalZoom` (étend `ol/control/Zoom`) | `position: 'top-left'` ; libellés « Zoomer »/« Dézoomer » posés par geopf (`aria-label`) |
| Plein écran | `GeoportalFullScreen` (étend `ol/control/FullScreen`) | `position`, `tipLabel` |
| Attributions | `GeoportalAttribution` (étend `ol/control/Attribution`) | `collapsible`, `collapsed`, `tipLabel` ; sans `Gp.Config`, affiche les `attributions` de la source OL (`GPF_ATTRIBUTION`) ; retire l'attribution OL par défaut |
| Échelle | `ol/control/ScaleLine` | geopf-ext n'en fournit pas ; `units: 'metric'` |
| Recherche + géolocalisation | `SearchEngine` | `collapsed: false`, `placeholder`, `displayButtonGeolocate: true`, `displayButtonAdvancedSearch: false`, `displayButtonCoordinateSearch: false`, `resources: { search: false }`, `zoomTo: 'auto'` |
| Rotation | `ol/control/Rotate` (via `defaults`) | `tipLabel` français ; `zoom: false`, `attribution: false` dans `defaults` |

Disposition (revue M3) : geopf place la recherche à `left: 46px` au-dessus de 576 px et à `0` en dessous, donc **sur** la colonne
de zoom (bouton « Zoomer » non cliquable à 375 px, 4 px de recouvrement ailleurs). `MapView.css` lui donne son propre emplacement à
toutes les largeurs : `top: 0.5rem`, `left: 3.5rem` (colonne de zoom 1w + 5w, puis 1w d'écart, échelle DSFR), `max-width: calc(100% - 7rem)`
(laisse libre le gestionnaire de couches), champ `padding-right: 2.5rem` (bouton ✕ superposé par geopf) et `width: 18rem` dès 62em
(texte indicatif entier). Vérification navigateur : `bun run check:map` (`scripts/check-map.ts`, Playwright, aperçu lancé avec
`PORT=8101 bun run preview:all`) : bouton « Zoomer » cliquable et aucun recouvrement à 375, 768 et 1280 px, noms accessibles,
console vide.

Noms accessibles (RGAA 11.1, revue M3) : OpenLayers ne pose que `title` ; le nom calculé serait le glyphe (« › » attributions,
« ⇧ » rotation). `src/map/labelControls.ts` pose un `aria-label` (`CONTROL_LABELS` dans `src/config/map.ts`) **avant** `addControl` :
bouton des attributions, bouton de rotation (masqué tant que la carte n'est pas tournée, `autoHide`), et champ de recherche geopf
`GPsearchInputText-*` qui n'a pas de libellé.

Clavier : la recherche s'utilise au clavier (saisie, flèche bas, Entrée → `/geocodage/search`). Les suggestions sont des `<p>`
(`GPautoCompleteProposal`) dans un `div.fr-modal` (`GPautoCompleteList-*`), sans rôle de liste : limite amont.

### 5.7 Pièges

- Les fenêtres geopf (`fr-modal`) n'ont pas de nom accessible ; le JS du DSFR l'écrit en avertissement console
  (`Modal #... missing accessible name`) : `GPlayersList-*`, `GPlayerInfoPanel-*`, `GPlayerStylePanel-*` (LayerSwitcher),
  `GPgeocodeResultsList-*` (`<dialog>`) et `GPautoCompleteList-*` (un **`div`**, SearchEngine). Contournement :
  `src/map/labelGeopfDialogs.ts` pose un `aria-label` (et `role="group"` sur un `div`) sur `control.element` **avant**
  `map.addControl` (libellés `GEOPF_DIALOG_LABELS` dans `src/config/map.ts`).
- **Lacunes d'accessibilité amont à signaler** (ticket à ouvrir sur IGNF/geopf-extensions-openlayers, version 1.0.0-beta.16 ;
  contournées ici, à retirer quand elles seront corrigées) :
  1. modales DSFR sans nom accessible (`GPlayersList`, `GPlayerInfoPanel`, `GPlayerStylePanel`, `GPgeocodeResultsList`,
     `GPautoCompleteList`) ;
  2. suggestions de recherche rendues en `<p class="GPautoCompleteProposal">` dans un `div.fr-modal` (ici `role="group"`) au lieu d'un
     `listbox`/`option` avec `aria-activedescendant` sur le champ : la sélection au clavier (flèche bas, Entrée) n'est pas annoncée ;
  3. champ de recherche sans `<label>` ;
  4. boutons hérités d'OpenLayers (attributions, rotation) nommés par leur glyphe.
- Suggestions possiblement **dans le désordre** : chaque frappe appelle `Gp.Services.autoComplete` sans annuler ni séquencer la
  requête précédente (`SearchEngine.js`, pas d'`abort` ni de numéro de requête) ; une réponse lente à « Orl » peut remplacer celle à
  « Orléans ». Non observé dans nos essais ; à inclure dans le ticket amont.
- Les conteneurs de position des widgets ont des id globaux (`position-container-top-right`...) : **une seule carte geopf-ext par page**.
- Les contrôles OL par défaut sont en anglais : zoom et attributions remplacés par leurs versions geopf (en français), rotation avec `rotateOptions.tipLabel`.
- Clavier : le conteneur de carte a `tabIndex=0` (interactions clavier OL : flèches, `+`/`-`) ; règle jsx-a11y
  `no-noninteractive-tabindex` autorisée pour le rôle `region`. Le bouton du gestionnaire de couches s'atteint en 3 Tab depuis la carte
  et s'ouvre avec Entrée.
- GPF WMTS : réponses `400 Layer GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2 unknown` (M2) ou `404` (M3, orthophotos) intermittentes sur des
  `GetTile` valides ; la même URL répond 200 juste après. Voir `QUESTIONS.md` M-2. M3 : `src/map/tileRetry.ts` recharge **une fois**
  une tuile en erreur après `TILE_RETRY_DELAY_MS` (500 ms), compté par URL de tuile (OpenLayers peut créer une nouvelle instance pour
  la même tuile). Vérifié dans Playwright en forçant un 400 (`page.route`) : la tuile est redemandée une fois puis s'affiche ; une tuile
  toujours en erreur est demandée 2 ou 3 fois au total (le navigateur/OL la redemande parfois aussitôt), jamais en boucle.
  Le message « Failed to load resource » du premier échec reste dans la console.
- `ol/format/WMTSCapabilities.read` renvoie un objet même pour un document invalide : `parseWmtsCapabilities` exige `Contents`.
- Build : avertissement Vite `[EVAL]` venu de `geopf-extensions-openlayers/src/packages/Services/Search.js` (`setUrl` fait
  `eval("`" + value + "`")`, commenté « insecure ! » en amont). Appelé seulement si `searchOptions.serviceOptions.url` est fourni :
  ne jamais le renseigner. À signaler si une politique CSP sans `unsafe-eval` est adoptée.
- Panneau DSFR : le `<label>` d'un `RadioButtons` recouvre l'`<input>` ; dans Playwright, cliquer le libellé (pas `check()` sur l'input).
- Tests : `ol/Map` et `../map/geopf` sont simulés (`vi.mock`) ; le catalogue, `createWmtsLayer` et le parseur utilisent un extrait réel
  des capacités (`src/test/fixtures/wmts-capabilities.xml` : Plan IGN, orthophotos, relief et leurs TileMatrixSet, importé avec `?raw`).

## 6. Couches sols (M4, 2026-11-05)

### 6.1 Générer `src/data/sols-layers.json`

```bash
cd apps/explorer-les-cartes
bun run build:sols-layers   # bun scripts/build-sols-layers.ts && prettier --write src/data/sols-layers.json
```

- Le script lit le CSW (`SOLS_CSW_GETRECORDS_URL` dans `src/config/urls.ts`, requête de `gpf-sols-data.md` §1), analyse les fiches
  ISO 19115-3 avec `@xmldom/xmldom` (`scripts/sols-layers/csw.ts` : identifiant, titre, résumé, organisation, liens
  `mrd:onLine/cit:CI_OnlineResource` avec protocole, adresse, nom, description).
- Liens gardés : protocoles `OGC:WMS`, `OGC:WMTS`, `OGC:WFS`, `TMS`. Service déduit du protocole et du chemin du lien
  (`/wms-r` → WMS raster, `/wms-v` → WMS vecteur, `/wmts`, `/wfs`, `/tms`), sinon rejet « point d'accès non reconnu ».
- Chaque nom est cherché dans les capacités de son service (`src/data/capabilitiesIndex.ts`, partagé avec l'application) :
  wms-v et wms-r (WMS 1.3.0), WMTS (avec le CRS des grilles liées), WFS 2.0.0 (types publiés), TMS : la racine
  `https://data.geopf.fr/tms/1.0.0` (`TileMapService`) et non l'annexe ROK4 (question M-3). Jamais de correction du CSW :
  un nom absent part dans `rejected` avec son motif ; quand il existe sur l'autre WMS, le motif le dit
  (« publié sur WMS raster (wms-r) »).
- Sortie déterministe (`normaliseSolsLayersFile` : fiches par titre, couches par service puis nom, sans horodatage), point d'accès
  canonique de `GPF_ENDPOINTS`, puis résumé en console. Résultat du 2026-11-05 : 7 fiches, 12 couches validées, 14 rejets
  (les 4 de `gpf-sols-data.md` §5 et les 10 noms WFS courts).
- **Jamais de fichier partiel** (revue M4) : la GPF répond parfois par un document d'exception OGC (`ows:ExceptionReport`,
  `ServiceExceptionReport`) avec un HTTP 200. Le script échoue (code de sortie non nul, fichier inchangé) si le CSW ou des capacités
  sont une exception (`exceptionReportText`), si le CSW ne renvoie aucune fiche, si une fiche n'a pas d'identifiant ou de titre,
  ou si les capacités d'un service ne listent aucune couche (`assertCompleteInputs`). Chaque requête a un délai de 60 s
  (`AbortSignal.timeout`).
- Contrôle sans réseau : `src/data/solsLayers.test.ts` (schéma partagé `src/data/solsLayersSchema.ts`, source = requête configurée,
  ordre identique à celui du script, pas de doublon) ; l'analyseur et le validateur sont testés sur un extrait du CSW
  (`scripts/sols-layers/fixtures/csw-extract.xml`) et des capacités simulées.

### 6.2 Affichage

- Onglet « Données sols » du panneau latéral (`Tabs` DSFR contrôlés, onglet dans le store) : titre, extrait du résumé,
  producteur, services en badges, bouton « Ajouter à la carte / Retirer de la carte » (nom accessible complété du titre de la fiche,
  annonce dans une zone `role="status"`).
- Couche ajoutée : WMTS d'abord, puis WMS raster, puis WMS vecteur (`DISPLAYABLE_SOLS_SERVICES`) ; TMS et WFS ne sont pas dessinés en v0.
  WMS : `TileWMS` (GetMap 256 px, PNG transparent) sur le point d'accès canonique. WMTS publié seulement en EPSG:2154
  (`INRAE_CARTE-SOLS`, grille `2154_10m_0_14`) : `loadCrs('EPSG:2154')` charge à la demande le module CRS de geopf-ext
  (`CRS.loadByName`, proj4 + étendue), puis OpenLayers reprojette les tuiles en EPSG:3857 (morceau `CRS-*.js`, 169 kB).
- État client : `overlays` (références de couches) et `unavailableOverlays` dans le store ; `useOverlays` crée et retire les couches
  OpenLayers, avec le nouvel essai des tuiles et `watchTileHealth` (3 tuiles en erreur sans aucune tuile chargée → message
  « La Géoplateforme ne renvoie pas d'image pour cette couche »).
- **Ordre des couches** : le `LayerSwitcher` donne à toute couche ajoutée sans zIndex un zIndex supérieur aux autres, donc un fond
  ajouté après une couche sols (lien profond, changement de fond) la recouvrait. Le fond reçoit `BASE_LAYER_Z_INDEX = 1` **avant**
  son ajout : le gestionnaire trie alors par zIndex (liste et dessin). Pas 0 (traité comme « sans zIndex ») ni négatif
  (`_updateLayersOrder` parcourt ses zIndex avec `for...in` : une clé négative passe après les positives, donc au-dessus).

### 6.3 Lien profond « Voir sur la carte »

Lecture : `src/map/deepLink.ts` (`readDeepLink`), `src/hooks/useDeepLink.ts`. Deux formats, lus une fois au chargement.

**Format principal (M5, décision C-3, tâche catalogue C6)** : le permalien de cartes.gouv.fr,
`/explorer-les-cartes/?l=<nom>$GEOPORTAIL:<OGC|GPP>:<WMS|WMTS|TMS>(<position>;<opacité>;<visible>;<gris>[;<style>])&permalink=no`.
Grammaire de `IGNF/cartes.gouv.fr-entree-carto` (`src/stores/mapStore.js`) ; plusieurs couches séparées par `,` ; rien n'est
encodé, aucune URL de service n'est transmise. Valeurs émises par le catalogue (`geonetwork-ui.md` §10, C6) :

- WMS : `?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no`
- WMTS : `?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no`
- TMS : `?l=style$GEOPORTAIL:GPP:TMS(1;1;1;0;c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde)&permalink=no`

Règles : type de service sans tenir compte de la casse ; décodage tolérant ; forme courte `(opacité;visible;gris)` des anciens
permaliens acceptée ; opacité (bornée à 0..1) et visibilité appliquées à la couche ; position et niveaux de gris ignorés ;
`permalink` ignoré ; **seule la première couche de `l` est suivie** (le catalogue n'en envoie qu'une). Résolution par nom et
type : `sols-layers.json` d'abord, puis capacités en direct dans l'ordre **wms-r puis wms-v** pour WMS (`INRAE_CARTE-SOLS` est
publié sur wms-r alors que le CSW indique wms-v) et `wmts` pour WMTS. TMS : `layer` vaut `style` et le cinquième champ est le
nom du fichier `https://data.geopf.fr/annexes/gissol-osf/style/<champ>.json` (`solsStyleUrl`) ; avis « Format non pris en
charge » qui nomme le style et lie le fichier.

**Alias secondaire (C4)** : `?layer=<nom>&type=<WMS|WMTS|TMS>&url=<point d'accès>`, utilisé quand `l` est absent ou illisible.
`type` en majuscules ; `layer` et `url` décodés avec tolérance ; seuls les points d'accès `https://data.geopf.fr` sont acceptés ;
WMS sous ses deux formes (`/wms-v` sans chemin, `/wms-r/wms`) ; `type=TMS` (URL de style MapLibre) non pris en charge.

Issue commune :

- Couche ajoutée : onglet « Données sols » sélectionné dès le premier rendu (`initialTab` du store ; le script DSFR des onglets
  lit l'onglet sélectionné à son initialisation et en gardait deux sélectionnés si on changeait d'onglet après coup).
- « Couche introuvable » (`role="alert"`, titre `h2`) : nom absent de tous les services candidats. « Lien invalide » : lien mal
  formé ou point d'accès hors `data.geopf.fr`. « Couche indisponible » : couche ajoutée dont le service ne renvoie pas d'image
  (même détection que le panneau). Couche WMTS dont les capacités ont échoué ou impossible à construire : marquée indisponible.
- Charger un style TMS demanderait `ol-mapbox-style` en dépendance directe (13.9, déjà présent via geopf-ext) et
  `MapboxVectorLayer({ styleUrl })` : styles de 217 couches sans `glyphs`, à valider ; reporté.

### 6.4 Pièges

- GeoServer (wms-v) répond **HTTP 200 avec un `ServiceExceptionReport` XML** quand une couche est cassée : vérifier le
  `Content-Type` (`image/png`), pas seulement le code. Le 2026-11-05, `rrp_loiret_gpkg_11-09-2026_wmsv` et
  `rrp_dept_loiret_gpkg_11-09-2026_wmsv` renvoient une `NullPointerException` à tout GetMap (question M-4) ; les autres couches wms-v
  répondent en PNG.
- Une fois (sur une vingtaine de chargements), les capacités WMTS ont semblé ne contenir aucun fond candidat (alerte « Aucun fond de
  carte prévu »), non reproduit ensuite (6 chargements : 3 Mo, 745 couches). Probablement une réponse partielle de la GPF.
- `bun run check:map` couvre aussi M4 (onglet « Données sols », ajout d'une couche au clavier avec GetMap `image/png`, liens profonds).

## 7. Tests, clavier, alternative sans carte (M5, 2026-11-05)

### 7.1 Tests et couverture

- `bun run test` : Vitest + Testing Library (jsdom), OpenLayers et `../map/geopf` simulés là où il faut un rendu ou un réseau.
- `bun run test:coverage` (`@vitest/coverage-v8` 5.1.0, configuration dans `vite.config.ts`, dossier `coverage/` ignoré par git).
  Mesure du 2026-11-05 : instructions 96,8 %, branches 88,1 %, fonctions 99,0 %, lignes 98,4 % (`src/**` et `scripts/sols-layers/**`,
  hors `main.tsx` et tests).
- `bun run check:map` (Playwright, aperçu `PORT=8101 bun run preview:all`) : disposition et noms à 375/768/1280 px, couche sols au
  clavier, liens `l=` et alias, clavier, vue liste (55 vérifications).
- axe (`@axe-core/playwright` du dossier `e2e/`, balises wcag2a/aa, wcag21a/aa, wcag22aa, best-practice) : 0 violation sur la carte,
  `?vue=liste`, les liens `l=` (WMS, WMTS introuvable, TMS, Loiret) et l'état « onglet Données sols, couche ajoutée, liste des
  couches ouverte ».

### 7.2 Accessibilité corrigée en M5

- `label-content-name-mismatch` sur « Ma sélection de cartes » : le compteur du `LayerSwitcher` affichait « 1 » dans un bouton nommé
  « Ma sélection de cartes ». Option `counter: false` (le nombre reste visible dans la liste ouverte).
- `aria-prohibited-attr` sur les flèches clavier « Déplacer la couche vers le haut/bas » de la liste des couches (`<span>` focusables
  avec `aria-label`, Entrée/Espace gérés par geopf) : `role="button"` posé par `watchLayerMoveArrows` (observateur de mutations).
- Échap ferme la liste des couches (un `<dialog>` que geopf ne ferme pas au clavier) et rend le focus à « Ma sélection de cartes »
  (`closeOnEscape` dans `useLayerSwitcher`). Le panneau latéral n'est pas une fenêtre modale : pas d'Échap.
- Onglets : flèches gauche/droite (script DSFR, synchronisé avec le store). Ajout/retrait : Entrée ou Espace ; le focus reste sur le
  même bouton dont le libellé s'inverse, l'action est annoncée (`role="status"`).
- Noms accessibles : l'espace qui précède une partie `fr-sr-only` est hors du `<span>` (sinon « point d'accèsWMS… »).

### 7.3 Alternative sans carte : `?vue=liste`

- `/explorer-les-cartes/?vue=liste` (`LIST_VIEW_PATH`, `isListView`) : paramètre plutôt que chemin, pour fonctionner sur tout
  hébergement statique sans réécriture d'URL ; la page ne charge pas le code de la carte (morceau `MapExplorer` non importé ;
  `src/map/serviceLinks.ts` ne doit importer ni OpenLayers ni geopf).
- Contenu : `h1` « Liste des données sols », titre du document mis à jour, lien « Retour à la carte », un `article` par donnée
  (`h2` titre, extrait du résumé, producteur, `h3` « Services » : type, nom, lien direct vers le point d'accès — GetCapabilities
  du service ou ressource TileMap TMS — et « voir sur la carte » pour les couches affichables), lien « Fiche de la donnée dans le
  catalogue » (`/rechercher-une-donnee/dataset/<identifiant>`).
- Liée depuis la page carte (sous le chapeau) et depuis l'onglet « Données sols » : « Version accessible de la liste des données ».

### 7.4 Sélecteurs stables pour la suite e2e

| Élément | Sélecteur conseillé |
|---|---|
| Carte | `getByRole('region', { name: 'Carte interactive des données sols' })`, canvas `.map-view canvas` |
| Bouton du panneau latéral | `getByRole('button', { name: 'Masquer le panneau' })` / `'Afficher le panneau'` (`aria-controls="panneau-lateral"`) |
| Onglets | `getByRole('tab', { name: 'Fonds de carte' })`, `getByRole('tab', { name: 'Données sols' })` |
| Fond orthophotos | radio de libellé « Photographies aériennes » : cliquer le `label` (`label` avec texte exact), le libellé DSFR recouvre l'`input` ; « Plan IGN » coché par défaut |
| Ajouter une couche sols | `getByRole('button', { name: /^Ajouter à la carte\s*: <titre de la donnée>$/ })` (le nom calculé peut être « …carte: titre ») |
| Gestionnaire de couches | `getByRole('button', { name: 'Ma sélection de cartes' })` ; titres des couches `[id^="GPtitle_ID_"]` |
| Lien profond qui fonctionne | `?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` (alias : `?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v`) ; éviter `rrp_loiret_*` (M-4) |
| Avis du lien | `getByRole('alert')` « Couche introuvable », « Lien invalide », « Couche indisponible » ; `getByRole('status')` « Format non pris en charge » |
| Vue liste | `?vue=liste`, `getByRole('heading', { level: 1, name: 'Liste des données sols' })`, `getByRole('article')` (7) |
| Lien vers la vue liste | `getByRole('link', { name: 'Version accessible de la liste des données' })` |
| Recherche | `getByRole('textbox', { name: 'Rechercher un lieu ou une adresse' })` |
| Contrôles | « Zoomer », « Dézoomer », « Plein écran », « Sources des données », « Réinitialiser l'orientation » (masqué tant que la carte n'est pas tournée) |

Attendre `load` puis un délai plutôt que `networkidle` : une requête GPF lente peut retarder l'inactivité réseau de plus de 30 s.

