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

| Paquet                              | Version                             | Remarque                                                                                                                |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `geopf-extensions-openlayers`       | 1.0.0-beta.16 (tag `1.0.0-beta.16`) | dépend de `ol ^10.8`, `@gouvfr/dsfr 1.14.4`, `geoportal-access-lib 3.4.7` ; pair `@panoramax/web-viewer` (non installé) |
| `ol`                                | 10.11.0                             |                                                                                                                         |
| `zustand` / `@tanstack/react-query` | 5.0 / 5.106                         |                                                                                                                         |

Lu dans `node_modules/geopf-extensions-openlayers` : `README.md`, `DOCUMENTATION.md` (identique à celui du tag), `src/index.d.ts`,
`src/packages/Layers/LayerWMTS.{js,d.ts}`, `src/packages/Utils/Config.js`, `src/packages/Controls/LayerSwitcher/LayerSwitcher.{js,d.ts}`,
`src/packages/Controls/Control.js`, la démo `demos/react-project` du tag ; en M3 : `Controls/Zoom/GeoportalZoom.{js,d.ts}`,
`Controls/FullScreen/GeoportalFullScreen.{js,d.ts}`, `Controls/Attribution/GeoportalAttribution.{js,d.ts}`,
`Controls/SearchEngine/SearchEngine.{js,d.ts}` et `SearchEngineDOM.js`, `geoportal-access-lib/src/Services/Services.js` (URL de géocodage) ;
en M8 : les `.js`/`.d.ts` de chaque contrôle du §10, `Controls/Control.js` (positions, `listable`), `Controls/PanelDOM.js`,
`Sources/WMTS.js` (GetFeatureInfo), `CRS/CRS.js`, `Utils/LoggerByDefault.js`, `geoportal-access-lib/src/Services/DefaultUrlService.js`,
`Services/Route/Route.js`, `Services/ProcessIsoCurve/ProcessIsoCurve.js`, `Services/Alti/Alti.js` (ressources par défaut). JSDoc : https://ignf.github.io/geopf-extensions-openlayers/jsdoc/
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
- M8 : `loadMapTools()` charge les quinze contrôles du §10 en morceaux séparés (Route 50 kB, LayerImport, Drawing… ; Vite partage
  `geoportal-access-lib` avec le moteur de recherche) après l'affichage de la carte ; `index` 426 kB (114 kB gzip), `MapExplorer` 376 kB
  (112 kB gzip). Le JSON intégré `Controls/Territories/Territories.json` est importé par le même chemin profond.

### 5.3 CSS

- `ol/ol.css` (dans `MapView.tsx`) et, dans `geopf.ts`, **uniquement** les feuilles DSFR utiles : `CSS/DSFRgeneralWidget.css` et
  `CSS/Controls/{Zoom/DSFRzoomStyle,FullScreen/DSFRfullScreenStyle,LayerSwitcher/DSFRlayerSwitcherStyle,SearchEngine/DSFRsearchEngineStyle}.css`,
  plus, en M8, celles des outils (`Legends`, `Territories`, `OverviewMap`, `MousePosition`, `Measures` ×4, `ElevationPath`, `Isochron`,
  `Route`, `LocationSelector`, `ReverseGeocoding`, `Drawing`, `LayerImport`, `GetFeatureInfo`, `ControlList`, `Export`).
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

| Élément                                             | Rôle                                                                                                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/useMapStore.ts` (Zustand)                | état client : instance `map`, `activeBaseLayerId`, `isPanelOpen`                                                                                   |
| `src/hooks/useWmtsCapabilities.ts` (TanStack Query) | état serveur : capacités WMTS GPF, jamais recopiées dans le store                                                                                  |
| `src/hooks/useMap.ts`                               | crée **une** carte dans un effet, la publie dans le store, `setTarget(undefined)` + `dispose()` au démontage (couvre le double montage StrictMode) |
| `src/hooks/useBaseLayerCatalogue.ts`                | fonds candidats publiés dans les capacités (`availableBaseLayers`) et fond effectif dérivé (choix du store, sinon le premier disponible)           |
| `src/hooks/useBaseLayer.ts`                         | `useMemo` crée la couche depuis les capacités, l'effet l'insère en position 0 et la retire au nettoyage (changement de fond compris)               |
| `src/hooks/useMapControls.ts`                       | zoom, plein écran geopf + échelle OL dans un effet (plus d'attributions depuis M13, §12.3) ; `SearchEngine` chargé à la demande puis ajouté si la carte est toujours montée  |
| `src/components/map/BaseLayerPanel.tsx`             | panneau DSFR « Fonds de carte » : `RadioButtons` (flèches du clavier) → `setActiveBaseLayer`                                                       |
| `src/components/map/MapExplorer.tsx`                | bouton « Masquer/Afficher les fonds de carte » (`aria-expanded`, `aria-controls`, `togglePanel`) + grille panneau/carte                            |
| `src/hooks/useLayerSwitcher.ts`                     | ajoute le `LayerSwitcher` dans un effet, `removeControl` au nettoyage                                                                              |
| `src/config/map.ts`                                 | fonds candidats (`BASE_LAYER_CANDIDATES`), vue initiale, options des outils et du `LayerSwitcher`, libellés, attribution, délai de nouvel essai    |

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

| Outil                       | Classe                                                  | Options (vérifiées dans les `.d.ts` / sources)                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zoom                        | `GeoportalZoom` (étend `ol/control/Zoom`)               | `position: 'top-left'` (M16 : `'bottom-right'`, sous le plein écran, §12.7) ; libellés « Zoomer »/« Dézoomer » posés par geopf (`aria-label`)                                                                                                          |
| Plein écran                 | `GeoportalFullScreen` (étend `ol/control/FullScreen`)   | `position`, `tipLabel`                                                                                                                                                                            |
| Attributions (retirées M13) | `GeoportalAttribution` (étend `ol/control/Attribution`) | `collapsible`, `collapsed`, `tipLabel` ; sans `Gp.Config`, affiche les `attributions` de la source OL (`GPF_ATTRIBUTION`) ; retire l'attribution OL par défaut                                    |
| Échelle                     | `ol/control/ScaleLine`                                  | geopf-ext n'en fournit pas ; `units: 'metric'`                                                                                                                                                    |
| Recherche + géolocalisation | `SearchEngine` (M19 : `SearchEngineAdvanced`, §14)       | `collapsed: false`, `placeholder`, `displayButtonGeolocate: true`, `displayButtonAdvancedSearch: false`, `displayButtonCoordinateSearch: false`, `resources: { search: false }`, `zoomTo: 'auto'` |
| Rotation                    | `ol/control/Rotate` (via `defaults`)                    | `tipLabel` français ; `zoom: false`, `attribution: false` dans `defaults`                                                                                                                         |

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
     `GPautoCompleteList` ; en M8 tous les panneaux des outils, §10.4) ;
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

- **Jusqu'à M9** : onglet « Données sols » du panneau latéral (`Tabs` DSFR contrôlés, onglet dans le store) : titre, extrait du résumé,
  producteur, services en badges, bouton « Ajouter à la carte / Retirer de la carte » (nom accessible complété du titre de la fiche,
  annonce dans une zone `role="status"`). **Depuis M9 (§11)** : plus d'onglet, les données s'ajoutent depuis le catalogue de la carte ;
  le panneau ne garde que les fonds.
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

- Couche ajoutée : annonce `role="status"` ; depuis M9 (§11) l'entrée de sa fiche est cochée dans le catalogue de la carte (jusqu'à M9 :
  onglet « Données sols » sélectionné dès le premier rendu, `initialTab` du store, retiré avec l'onglet).
- « Couche introuvable » (`role="alert"`, titre `h2`) : nom absent de tous les services candidats. « Lien invalide » : lien mal
  formé ou point d'accès hors `data.geopf.fr`. « Couche indisponible » : couche sur la carte dont le service ne renvoie pas d'image,
  **quel que soit son mode d'ajout** (lien, permalien, catalogue) : `MapNotices` (`UnavailableOverlaysNotice`, store
  `unavailableOverlays`, §11.5). Couche WMTS dont les capacités ont échoué ou impossible à construire : marquée indisponible.
- Charger un style TMS demanderait `ol-mapbox-style` en dépendance directe (13.9, déjà présent via geopf-ext) et
  `MapboxVectorLayer({ styleUrl })` : styles de 217 couches sans `glyphs`, à valider ; reporté.

### 6.4 Pièges

- GeoServer (wms-v) répond **HTTP 200 avec un `ServiceExceptionReport` XML** quand une couche est cassée : vérifier le
  `Content-Type` (`image/png`), pas seulement le code. Le 2026-11-05, `rrp_loiret_gpkg_11-09-2026_wmsv` et
  `rrp_dept_loiret_gpkg_11-09-2026_wmsv` renvoient une `NullPointerException` à tout GetMap (question M-4) ; les autres couches wms-v
  répondent en PNG.
- Une fois (sur une vingtaine de chargements), les capacités WMTS ont semblé ne contenir aucun fond candidat (alerte « Aucun fond de
  carte prévu »), non reproduit ensuite (6 chargements : 3 Mo, 745 couches). Probablement une réponse partielle de la GPF.
- `bun run check:map` couvre aussi M4 (ajout d'une couche au clavier, depuis le catalogue de la carte depuis M9, GetMap `image/png`,
  liens profonds).

## 7. Tests, clavier, alternative sans carte (M5, 2026-11-05)

### 7.1 Tests et couverture

- `bun run test` : Vitest + Testing Library (jsdom), OpenLayers et `../map/geopf` simulés là où il faut un rendu ou un réseau.
- `bun run test:coverage` (`@vitest/coverage-v8` 5.1.0, configuration dans `vite.config.ts`, dossier `coverage/` ignoré par git).
  Mesure du 2026-11-05 : instructions 97,0 %, branches 87,8 %, fonctions 99,0 %, lignes 98,6 % (`src/**` et `scripts/sols-layers/**`,
  hors `main.tsx` et tests).
- `bun run check:map` (Playwright, aperçu `PORT=8101 bun run preview:all`) : disposition et noms à 375/768/1280 px, couche sols au
  clavier, liens `l=` et alias, clavier, vue liste (55 vérifications). Robustesse face à la GPF : attente de `load` puis
  d'éléments précis (jamais `networkidle`), assertions des liens profonds par attente (jusqu'à 20 s, la vérification en direct des
  capacités peut être lente), erreurs de tuiles GPF tolérées jusqu'à 10 % des requêtes de tuiles (comme la suite e2e, M-2) et
  signalées en note ; toute autre erreur console fait échouer.
- axe (`@axe-core/playwright` du dossier `e2e/`, balises wcag2a/aa, wcag21a/aa, wcag22aa, best-practice) : 0 violation sur la carte,
  `?vue=liste`, les liens `l=` (WMS, WMTS introuvable, TMS, Loiret) et l'état « couche ajoutée, liste des couches ouverte » (depuis
  M9 : catalogue de la carte ouvert, §11).

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
- Liée depuis la page carte (barre d'outils depuis M7 ; jusqu'à M9 aussi depuis l'onglet « Données sols ») et depuis l'avis
  « Catalogue indisponible » (M9, §11.5) : « Version accessible de la liste des données ».

### 7.4 Sélecteurs stables pour la suite e2e

| Élément                     | Sélecteur conseillé                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carte                       | `getByRole('region', { name: 'Carte interactive des données sols' })`, canvas `.map-view canvas`                                                                                                                                                                                                                                                                 |
| Bouton du panneau latéral   | dans la barre d'outils au-dessus de la carte (M7) : `getByRole('button', { name: 'Masquer le panneau' })` / `'Afficher le panneau'` (`aria-controls="panneau-lateral"`). **Depuis M6 : panneau ouvert par défaut à partir de 48em (DSFR `md`), fermé en dessous** (projet mobile 375 px de l'e2e : cliquer « Afficher le panneau » avant d'utiliser les onglets) |
| Onglets                     | **supprimés en M9** (plus d'onglets : panneau « Fonds de carte » seul ; données via le catalogue de la carte, §11.4)                                                                                                                                                                                                                                                                     |
| Fond orthophotos            | radio de libellé « Photographies aériennes » : cliquer le `label` (`label` avec texte exact), le libellé DSFR recouvre l'`input` ; « Plan IGN » coché par défaut                                                                                                                                                                                                 |
| Ajouter une couche sols     | depuis M9 : case du catalogue `input[data-layer="<nom>:<WMS|WMTS>"]` (§11.4) ; jusqu'à M9 : `getByRole('button', { name: /^Ajouter à la carte\s*: <titre>$/ })`                                                                                                                                                                                                                                    |
| Gestionnaire de couches     | `getByRole('button', { name: 'Ma sélection de cartes' })` ; titres des couches `[id^="GPtitle_ID_"]`                                                                                                                                                                                                                                                             |
| Lien profond qui fonctionne | `?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` (alias : `?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v`) ; éviter `rrp_loiret_*` (M-4)                                                                                                                                                              |
| Avis du lien                | `getByRole('alert')` « Couche introuvable », « Lien invalide », « Couche indisponible » ; `getByRole('status')` « Format non pris en charge »                                                                                                                                                                                                                    |
| Vue liste                   | `?vue=liste`, `getByRole('heading', { level: 1, name: 'Liste des données sols' })`, `getByRole('article')` (7)                                                                                                                                                                                                                                                   |
| Lien vers la vue liste      | `getByRole('link', { name: 'Version accessible de la liste des données' })`                                                                                                                                                                                                                                                                                      |
| Recherche                   | `getByRole('textbox', { name: 'Rechercher un lieu ou une adresse' })`                                                                                                                                                                                                                                                                                            |
| Contrôles                   | « Zoomer », « Dézoomer », « Plein écran », « Réinitialiser l'orientation » (masqué tant que la carte n'est pas tournée) ; « Sources des données » retiré en M13                                                                                                                                                                                                                 |

Attendre `load` puis un délai plutôt que `networkidle` : une requête GPF lente peut retarder l'inactivité réseau de plus de 30 s.

## 8. Correctifs M6 (2026-11-05)

### 8.1 D-carto-1 : carte sans canvas

- Cause, mesurée : la requête GetCapabilities WMTS de la GPF est parfois acceptée puis **jamais servie** (ni en-têtes, ni erreur).
  Dans le navigateur, 3 à 4 chargements sur 20 restaient sans fond, donc sans canvas (OpenLayers ne crée le canvas qu'au rendu d'une
  couche) et sans entrée dans « Ma sélection de cartes », indéfiniment ; avec `curl`, 5 requêtes sur 25 sans réponse au bout de 12 s,
  les autres en 0,15 à 0,23 s. TanStack Query ne réessayait pas : la requête n'échouait jamais. Les liens profonds WMS semblaient
  épargnés parce que la couche sols dessine un canvas même sans fond.
- Correctif M6 (remplacé en M15, §12.6) : abandon d'une requête sans en-têtes de réponse au bout de 3 s, puis 4 nouveaux essais
  espacés de 300 ms. Depuis M15 les requêtes de capacités sont **doublées** (`src/map/fetchHedged.ts`) : la requête lente n'est plus
  abandonnée, une autre part à côté.
- Vérifié : 0 chargement sans canvas sur 40 (bureau) ; les chargements où le premier essai bloquait obtiennent le canvas en 4 à 6 s.
  `bun run check:map` charge la page 20 fois dans des contextes neufs et exige un canvas à chaque fois (attente 20 s).

### 8.2 Panneau latéral sur mobile

- `initialPanelOpen` (store) : ouvert si `matchMedia('(min-width: 48em)')` (DSFR `md`), fermé sinon ; ouvert sans `matchMedia`.
  À 375 px, la carte commence au-dessus du pli (y ≈ 490 px), « Afficher le panneau » reste avant la carte ; clavier inchangé.
- Impact e2e (projet mobile) : ouvrir le panneau avant de cibler les fonds de carte (plus d'onglets depuis M9, §11).

## 9. Mise en page et en-tête v1 (M7, 2026-11-05)

Brief : `.claude/commands/refine.md` (v1), plan `doc/v1/PLAN.md`, maquette Figma `1:10562`, contenu partagé `packages/brand`.

### 9.1 Mise en page cartes.gouv.fr

- `App.tsx` / `App.css` : en vue carte, à partir de 48em (DSFR `md`), colonne flex de hauteur `100dvh` : en-tête, zone principale
  (`flex: 1`, `min-height: 0`), pied de page compact ; la page ne défile pas. Le `h1` « Explorer les cartes » est en `fr-sr-only`
  (pas de bloc de titre visible). Sous 48em, la page défile : carte (70dvh) d'abord, panneau en dessous.
- `MapExplorer` : barre d'outils fine (« Masquer/Afficher le panneau », « Version accessible de la liste des données »), avis du lien
  profond, puis corps en ligne : panneau ancré à gauche, largeur `clamp(18rem, 30 %, 26rem)` avec défilement propre, carte `flex: 1`.
  Mesuré : carte à 70 % (1024 px) et 71 % (1440 px) de la largeur, panneau ouvert. `useMap` suit la taille par `ResizeObserver`.
- Vue liste (`?vue=liste`) : page classique qui défile, même en-tête et pied de page compact.

### 9.2 En-tête v1 (`@sols/brand`)

> Depuis M17 (#5), l'en-tête de la carto est compact et n'utilise plus le `Header` de react-dsfr : voir §13. Le contenu
> (marque, badge, menus) et le comportement des menus décrits ici restent valables.

- Dépendance `"@sols/brand": "workspace:*"`, `import brand from '@sols/brand/brand.json'` (`src/config/site.ts`), images importées
  par Vite (`@sols/brand/assets/*`, publiées dans `dist/assets`). `SECTION_PATHS` et `EXTERNAL_LINKS` en dérivent. Aucun contenu
  d'en-tête ou de pied de page n'est écrit dans la brique.
- `Header` react-dsfr : lien de marque `header.brandLink` (`/`, jamais cartes.gouv.fr), Marianne, `operatorLogo` = logo GIS Sol
  (`header.operator.logo`/`logoAlt`), titre `service.title` + badge `badges.carto` (« Explorer », `fr-badge--sm
fr-badge--purple-glycine fr-badge--icon-left fr-icon-map-pin-2-fill` en balisage DSFR direct : le composant `Badge` de react-dsfr
  ajoute `fr-badge--no-icon` sans sévérité), slogan `service.tagline`. Pas de `navigation` (pas de barre `fr-nav`), pas de
  « Se connecter » (`header.tools.login` vaut `false`).
- Marque Observatoire (`header.operator.mark`, `alt=""`) : react-dsfr n'accepte qu'une image d'opérateur ; la marque est dessinée en
  CSS dans `.fr-header__service::after` (le DSFR utilise `::before` pour le séparateur), image passée par la variable
  `--osf-mark` posée sur l'en-tête. `osf-carotte.png` est transparent (sur `main`) : pas de tuile ni de couleur de fond. La
  marque est masquée sous 62em (DSFR `lg`), où l'en-tête DSFR empile le titre du service sous la marque.
- Menus « Aide » et « Services » (`src/components/layout/HeaderMenu.tsx`) : react-dsfr 1.36 n'a pas de menu dans
  `quickAccessItems`, mais accepte des éléments JSX : chaque menu est un composant React (bouton `fr-btn` + icône de la marque,
  chevron, `aria-expanded`/`aria-controls`, liste `fr-menu__list` de liens `fr-nav__link` avec la description en `fr-hint-text`),
  état React (pas de `fr-collapse`, dont le script DSFR lutterait avec React). Échap (écouté en phase de capture, pour ne pas fermer
  la modale du menu mobile), un clic ou le focus hors du menu le ferment ; Échap rend le focus au bouton. react-dsfr rend les outils
  deux fois (bureau et modale mobile) : identifiants par `useId`.
- Chevron (M10, D-carto-3) : icône DSFR `fr-icon-arrow-down-s-line` dans le bouton (`header-menu__btn`), tournée de
  -180° quand `aria-expanded="true"`, comme `.sols-tool-menu__btn` de l'edito ; `check:map` mesure la rotation.
- Comportement DSFR connu : en thème sombre, un bouton d'outil ouvert (« Aide », « Services ») prend le fond de survol DSFR
  (`--background-default-grey-hover`), au contraste plus faible que le fond de l'en-tête ; c'est le rendu DSFR natif, non modifié.
- Icônes : `react-dsfr update-icons` ne lit que les sources de l'application ; les icônes de `brand.json` sont donc listées dans
  `HEADER_MENU_ICONS` (un test vérifie que les icônes de la marque y figurent ; il a détecté `fr-icon-grid-fill`).

### 9.3 Pied de page compact

`SiteFooter` : `fr-footer` réduit à `fr-footer__bottom` (`footer.compactOnCarto`) : liens `footer.bottomLinks`, « Paramètres
d'affichage » (`headerFooterDisplayItem`, la modale reste montée par le `Header`), « Haut de page » vers `#en-tete`. 52 px de haut à
partir de 48em. Plus de description, de partenaires, de liens de contenu ni de licence sur la carto (ils restent sur l'edito et le
catalogue).

### 9.4 Thème des contrôles

- Mesure (clair, sombre, et bascule par « Paramètres d'affichage ») : le zoom geopf-ext (`fr-btn fr-btn--tertiary`), le plein
  écran, la recherche et le gestionnaire de couches suivent déjà le thème DSFR (variables `--background-*`, `--text-*`). Ceux qui ne
  le suivaient pas : les contrôles OpenLayers (attributions, échelle, rotation), blancs en sombre, car `ol.css` utilise ses propres
  variables `--ol-*`.
- Correctif : `MapView.css` fait pointer `--ol-background-color`, `--ol-accent-background-color`, `--ol-subtle-background-color`,
  `--ol-partial-background-color` (`color-mix` à 80 %), `--ol-foreground-color`, `--ol-subtle-foreground-color` et
  `--ol-brand-color` vers les jetons DSFR. `check:map` vérifie que le zoom et les attributions prennent le fond
  `--background-default-grey` dans les deux thèmes.

### 9.5 Vérifications

Vitest 189 tests ; `check:map` 76/76 ; axe 0 violation : carte claire et sombre (1440 px), menu « Services » ouvert, menu mobile avec
« Aide » ouvert, vue liste, lien `l=`. Captures `doc/screenshots/M7/`.

### 9.6 Impact pour la suite e2e

- Plus de barre de navigation : les liens vers le catalogue et la carte sont dans le menu « Services » de l'en-tête
  (`getByRole('button', { name: 'Services' })` dans `.fr-header__tools`, puis les liens).
- Le `h1` « Explorer les cartes » est masqué (`fr-sr-only`) : chercher le titre par rôle, pas sa visibilité.
- Pied de page compact : plus de liens de contenu (legifrance...), de partenaires ni de licence sur la carto.
- « Version accessible de la liste des données » et le bouton du panneau sont dans la barre d'outils au-dessus de la carte.

### 9.7 Contraste du bouton « Menu » au survol de la marque (M11, amont DSFR)

- Constat (revue M8) : axe signale à 375 px en thème sombre un `color-contrast` grave de 3,35:1 sur `#en-tete-menu-button`
  (`#8585f6` sur `#3f3f3f`), « rien d'ouvert ».
- Cause : le pointeur. Chromium sans interface démarre avec le pointeur en (0, 0), sur `.fr-header__brand.fr-enlarge-link`.
  La règle DSFR 1.14.2 `.fr-enlarge-link:hover { background-color: var(--hover) }` peint alors le bloc de marque en
  `--background-lifted-grey-hover` (`--grey-1000-75-hover`, `#3f3f3f` en sombre) sous le bouton « Menu », qui est dans ce
  bloc en mobile. Au repos le fond est `--background-lifted-grey` (`#1e1e1e`) et axe ne trouve aucune violation.
- Pas de CSS du projet en cause : l'edito (`/fr/`, référence) donne exactement la même mesure, 3,35:1 au survol et
  0 violation au repos (captures `doc/screenshots/M11/`). Thème clair : `#000091` sur `#f6f6f6`, contraste suffisant.
- Décision : comportement DSFR amont, non corrigé localement (une surcharge du survol du bloc de marque s'écarterait de
  l'edito et du DSFR) ; question M-5 dans `doc/agents/QUESTIONS.md`. `check:map` passe axe à 375 px sombre page au
  repos (pointeur hors de l'en-tête, 0 violation grave) et, pointeur sur la marque, ne tolère que cette violation.
- Pour la suite e2e : écarter le pointeur de l'en-tête (`page.mouse.move`) avant axe sur mobile.

## 10. Jeu d'outils de l'entrée carto (M8, 2026-11-05)

Référence : `IGNF/cartes.gouv.fr-entree-carto` (`src/composables/controls.js`, `src/components/carte/Controls.vue`,
`src/components/carte/control/*.vue`, `src/stores/mapStore.js`), même version de geopf-ext (`1.0.0-beta.16-648`). Plan : `doc/plans/M8.md`.
Aucun des contrôles retenus n'appelle `Gp.Config` (vérifié par `grep Config\.` dans leurs sources) : pas d'autoconf, pas de clé.

### 10.1 Contrôles, options, services

Options dans `MAP_TOOLS_OPTIONS` (`src/config/map.ts`), instanciation dans `createMapTools` (`src/hooks/useMapTools.ts`), chargement à
la demande par `loadMapTools()` (`src/map/geopf.ts`) **après** `loadCrs('EPSG:2154')` et `loadCrs('EPSG:27572')` (`TOOL_PROJECTIONS`).
`position`, `gutter` et `listable` sont lus par tous les contrôles (`Controls/Control.js`, `setMap`) mais absents de la plupart des `.d.ts`
(type `ControlPlacement`).

| Contrôle (classe)                                | Position               | Options retenues                                                                                                                                     | Service appelé                                                                     | Remarques                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LayerImport`                                    | haut gauche            | `title`                                                                                                                                              | GetCapabilities du service saisi (WMS, WMTS), fichiers KML/GPX/GeoJSON/MapBox      | la couche WMS importée est une `TileWMS` **sans `crossOrigin`** : elle fonctionne mais rend le canvas opaque à l'export PNG (message de la modale d'impression) ; l'import ajuste la vue à l'étendue de la couche ; WFS « pas encore disponible » (message amont)                                                                                                                                                      |
| `GetFeatureInfo`                                 | haut gauche            | `button: true`, `active: false`, `noDataMessage` (JSDoc, hors `.d.ts`)                                                                               | GetFeatureInfo (`INFO_FORMAT=text/html`) des couches visibles, du haut vers le bas | interroge **toutes** les couches visibles ; exige `getFeatureInfoUrl` sur chaque source : porté sur `ol/source/WMTS` dans `src/map/wmtsFeatureInfo.ts` (copie de `Sources/WMTS.js`, sans `geoportal-access-lib`) ; une couche WMTS sans `InfoFormat` publié répond `data:text/plain,` (sinon 400 « not queryable » de la GPF en console) ; GeoServer (wms-v) répond en HTML, wms-r en 400 traité comme « sans donnée » |
| `ControlList`                                    | haut droite            | `header`, `sortable: true`                                                                                                                           | —                                                                                  | liste les contrôles `listable` ; **`sortable: true` obligatoire** (sinon `this._controlsListStateSync` n'existe pas et l'ouverture lève `Cannot read properties of undefined (reading 'set')`) ; bouton « Afficher plus » renommé « Mes outils » (`labelToggleButton`)                                                                                                                                                 |
| `MeasureLength`, `MeasureArea`, `MeasureAzimuth` | haut droite, listables | `layerDescription`, `geodesic: true` (azimut)                                                                                                        | —                                                                                  | info-bulle `GPmeasureTooltip` (overlay OL) ; couche vecteur titrée dans le gestionnaire                                                                                                                                                                                                                                                                                                                                |
| `MousePosition`                                  | haut droite, listable  | `editCoordinates`, `displayAltitude`, `systems` (géographiques, Web Mercator, Lambert 93), `altitude.serviceOptions.serverUrl` (JSDoc, hors `.d.ts`) | `GPF_ENDPOINTS.elevation` (ressource `ign_rge_alti_wld` par défaut de la lib)      | `_initProjectionSystems` résout **toujours** `EPSG:2154` et `EPSG:27572` (même avec `systems`) et lève si l'une est inconnue d'OpenLayers : d'où `TOOL_PROJECTIONS`                                                                                                                                                                                                                                                    |
| `ElevationPath`                                  | haut droite, listable  | `elevationPathOptions.serverUrl`, `layerDescription`, `export: true`                                                                                 | `GPF_ENDPOINTS.elevationLine`                                                      | `export` doit être un **booléen** (défaut `false` ; un objet fait planter `mergeParams`) : bouton d'export GeoJSON par défaut                                                                                                                                                                                                                                                                                          |
| `Route`                                          | haut droite, listable  | `routeOptions.{serverUrl,resource}`, `autocompleteOptions.serverUrl`, `prettifyCompute`, `export: true`                                              | `GPF_ENDPOINTS.route` (`bdtopo-pgr`), complétion `geocodage/completion`            | `geoportal-access-lib` 3.4.7 prend `bdtopo-osrm` par défaut : **400** « resource invalid » sur la GPF (ressources publiées : `bdtopo-pgr`, `bdtopo-valhalla`) ; panneau construit dans `setMap`                                                                                                                                                                                                                        |
| `Isocurve`                                       | haut droite, listable  | `isocurveOptions.{serverUrl,resource}`, `autocompleteOptions`, `export: true`                                                                        | `GPF_ENDPOINTS.isochrone`                                                          | idem Route (défaut lib `bdtopo-valhalla`, valide) ; panneau construit dans `setMap`                                                                                                                                                                                                                                                                                                                                    |
| `ReverseGeocode`                                 | haut droite, listable  | `reverseGeocodeOptions.serverUrl`, `layerDescription`                                                                                                | `GPF_ENDPOINTS.geocodeReverse`                                                     |                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Drawing`                                        | haut droite, listable  | `layerDescription`, `tools.export: true`                                                                                                             | —                                                                                  | fenêtres d'édition en overlays OL                                                                                                                                                                                                                                                                                                                                                                                      |
| `Legends`                                        | bas gauche             | `panel`, `auto: true`                                                                                                                                | —                                                                                  | ne lit que les couches **geopf** (`layer.hasOwnProperty("name")` + `getLegends()`…) : `attachLayerInfo` (`src/map/layerInfo.ts`) donne cette interface à nos couches OL ; URL de légende : `LegendURL` des capacités (champ `legendUrl` de `sols-layers.json` et des index, `Style[0].LegendURL[0].href` côté WMTS OL), sinon GetLegendGraphic sur wms-v (GeoServer ; wms-r répond 400)                                |
| `Territories`                                    | bas gauche             | `panel`, `auto: false` + `territories` (JSON intégré moins `ATF`, `IDF`), `thumbnail: false`, `tiles: 3`, `title`                                    | vues/vignettes sur `data.geopf.fr/annexes/cartes.gouv.fr-config`                   | `view`/`upload` inactifs par défaut                                                                                                                                                                                                                                                                                                                                                                                    |
| `GeoportalOverviewMap`                           | bas gauche             | `collapsed: true`                                                                                                                                    | WMTS `GEOGRAPHICALGRIDSYSTEMS.MAPS.OVERVIEW`                                       | configuration de couche **intégrée** au contrôle (`LAYER_CONFIG`) : pas de `Gp.Config` ; `tipLabel` « Mini-carte » forcé                                                                                                                                                                                                                                                                                               |

Non retenus : `ContextMenu` (dépend d'`ol-contextmenu`, ouvre le signalement dans l'entrée carto), `Reporting` (anomalies cartes.gouv.fr),
`Panoramax` (pair non installé), `Catalog` (M9). Les widgets « Partager » et « Imprimer » de l'entrée carto ne sont pas des contrôles geopf
(modales Vue DSFR + jsPDF) : ici `ShareModal` et `PrintModal` (react-dsfr `createModal`, boutons dans la barre d'outils).

### 10.2 Disposition

Haut gauche : zoom, plein écran (M3), import, interrogation ; haut droite : gestionnaire de couches, « Mes outils » (v1.1 : « Afficher tous les outils », en dernier, §12.2), puis les neuf outils
listables ; bas gauche (geopf **prépose** les widgets du bas : le dernier ajouté est en haut) : mini-carte, territoires, légendes. L'échelle
OL passe à `left: 3.5rem` (`MapView.css`). Sous 48em, les boutons des outils listables sont masqués (`.map-tool--listable > .gpf-btn-icon`) ;
ils s'ouvrent depuis la liste d'outils (le panneau occupe la largeur de la carte, CSS mobile de geopf) et, la liste se vidant à la sélection,
le focus revient au bouton de la liste (`returnFocusOnCollapse`). Le panneau d'un outil de droite s'ouvre à gauche de sa colonne, en haut ;
**les panneaux de la colonne du bas (légendes, territoires) s'ouvrent en haut à gauche de la carte**, pas à côté de leur bouton
(`PositionFactory`, mode DSFR : `top: 0`). Les feuilles DSFR des outils sont chargées avec eux (`src/map/geopfToolsStyles.ts`, ~26 kB gzip
hors du chargement initial).

### 10.3 Partage et impression

- Permalien (`src/map/permalink.ts`, `mapPermalink.ts`) : `?c=<lon>,<lat>&z=<zoom>&l=<fond>$GEOPORTAIL:OGC:WMTS(0;1;1;0),<couche>$GEOPORTAIL:OGC:WMS(1;opacité;visible;0)…&permalink=yes`,
  `l` brut comme cartes.gouv.fr. Lecture : `readPermalinkView` (vue initiale dans `useMap`), `readPermalinkBaseLayer` (fond initial du
  store), `readDeepLinks` (toutes les entrées hors fond, une `DeepLinkLayerNotice` chacune). Couches importées, croquis et calculs ne sont
  pas dans le lien (ils n'ont pas de nom GPF).
- Impression : `exportMapImage` compose les canvas OL (motif « export map »), « Télécharger en PNG » ou `window.print()` sur une feuille
  `.map-print-sheet` (seul contenu imprimé, `MapExplorer.css`). Un canvas « taint » (tuile sans CORS, couche importée) fait échouer l'export :
  message `PRINT_LABELS.exportFailed`.

### 10.4 Accessibilité et bruits amont (à ajouter au ticket du §5.7)

5. Panneaux des outils sans nom : `GEOPF_DIALOG_LABELS` étendu (`GPlegendsPanel`, `GPterritoriesPanel`, `GPcontrolListPanel`,
   `GPmousePositionPanel`, `GPelevationPathPanel`, `GProutePanel`, `GProuteResultsPanel`, `GPisochronPanel`, `GPisoResultsPanel`,
   `GPreverseGeocodingPanel`, `GPreverseGeocodingResultsPanel/List`, `GPdrawingPanel`, `GPimportPanel`, `GPimportGetCapPanel`,
   `GPimportMapBoxPanel`, `GPgetFeatureInfoPanel`, `GPlocationAutoCompleteList_<n>`, `gpf-territories-views-container-id`) ; Route et
   Isocurve créent leurs panneaux dans `setMap` : `labelDialogsOnInit` enveloppe `_initContainer` sur l'instance (`src/map/labelToolButtons.ts`).
6. Boutons sans nom : dépliage d'une légende (`GPcollapseLegend_ID_*`, `title=""`) et retrait d'un territoire
   (`gpf-territories-view-entry-button-id-*`) : `watchToolButtons` (observateur de mutations) pose « Afficher la légende : <titre> » et
   « Retirer le territoire : <titre> ». Bouton de `ControlList` nommé « Afficher plus » : renommé (« Afficher tous les outils » en v1.1) ;
   titre du panneau codé en dur « Mes outils » : remplacé par « Tous les outils » (M14, §12.4).
7. Les `<li>` de la liste d'outils (« Tous les outils ») ont `role="button"` et `tabindex="0"` (Entrée/Espace gérés), pas de `aria-pressed` : rôle interdit sur un
   `li` (axe `aria-allowed-role`) et `<ul>` sans élément de liste (axe `list`, sérieux). `fixToolButtons` en fait un menu (`ul`
   `role="menu"`, `li` `role="menuitem"`, rôles autorisés ; les éléments sont recréés à chaque ouverture, d'où l'observateur) et
   `menuKeyboard` (`useMapTools.ts`) applique le motif « menu button » : une seule entrée tabulable (première entrée focalisée à
   l'ouverture), flèches haut/bas en boucle, Début/Fin, Échap ferme la liste ; Entrée/Espace restent au contrôle (action par défaut
   empêchée). L'activation d'une entrée se fait au `keydown` et vide la liste : le retour du focus au bouton « Afficher tous les outils »
   (`returnFocusOnCollapse`) est **différé d'une tâche**, sinon Entrée active le bouton nouvellement focalisé dans le même évènement et
   rouvre la liste (observé à 375px : le panneau choisi s'ouvrait derrière la liste pleine largeur). Patch amont à signaler ; `check:map`
   passe axe-core (jeu de règles par défaut, comme la suite e2e) avec la liste d'outils ouverte et rejoue l'activation au clavier à 375px.
8. `LayerSwitcher._updateLayerGrayScale` appelle `console.warn("Greyscale only implemented for raster and vector tiles")` pour **chaque**
   couche vecteur ajoutée (mesures, croquis, calculs), sans option pour l'éviter : `check:map` compte ces avertissements (`UPSTREAM_WARNINGS`)
   au lieu d'échouer ; à signaler aussi.
9. Les formulaires de lieu (Route, Isocurve) appellent la complétion avec un texte vide ou numérique (`geocodage/completion?text=73%20`),
   que la GPF refuse (400, « Failed to load resource » en console) : `check:map` ne compte que ces requêtes-là (`isUpstreamRequestError` :
   texte de moins de trois caractères ou chiffres seuls) ; à signaler.

### 10.5 Vérification et sélecteurs e2e

`check:map` (M8) : quinze boutons nommés, aucune fenêtre sans nom, mesure de distance (texte d'un `.ol-overlay-container` en km), interrogation
d'une couche sols (accordéon GeoServer dans `GPgetFeatureInfoPanel-*`), légendes (`.legend-entry-container#<nom>`), permalien de la modale
« Partager » rouvert dans une page neuve (mêmes titres dans le gestionnaire), PNG téléchargé et `window.print` appelé, ouverture/fermeture
des panneaux, import WMS de `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` (`[id^="GPimportTypeSelect-"]` → `WMS`, `[id^="GPimportServiceUrl-"]`,
`[id^="GPimportSubmit-"]`, rubrique `label.GPimportGetCapRubriqueTitle` à déplier, entrée `.GPimportGetCapProposal` « Plan IGN »), mobile.

| Élément             | Sélecteur                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boutons des outils  | `getByRole('button', { name, exact: true })` avec les libellés de `check-map.ts` (`TOOL_BUTTONS`)                                                                     |
| Liste d'outils      | v1.1 : `getByRole('button', { name: 'Afficher tous les outils', exact: true })`, panneau titré « Tous les outils », entrées `[id^="GPcontrolListPanel-"] li` (§12.5) |
| Partager / Imprimer | boutons `Partager`, `Imprimer` de la barre d'outils ; champ `getByRole('textbox', { name: /^Lien permanent/ })` ; boutons `Télécharger en PNG`, `Lancer l’impression` |
| Panneaux            | `[id^="GProutePanel-"]`, `[id^="GPisochronPanel-"]`, `[id^="GPgetFeatureInfoPanel-"]`, `[id^="GPlegendsPanel-"]`…                                                     |

## 11. Catalogue des données sols (M9, 2026-11-05)

Référence : `IGNF/cartes.gouv.fr-entree-carto` (`src/components/carte/control/CatalogManager.vue`, options `useControlsOptions().catalog`
dans `src/composables/controls.js`) ; plan `doc/plans/M9.md`.

### 11.1 Choix

- **Contrôle geopf `Catalog`** (et non un panneau DSFR maison) : même widget que l'entrée carto, `addToMap: false` comme elle (c'est
  l'application qui ajoute les couches à partir des évènements `catalog:layer:add` / `catalog:layer:remove`, payload `{ name, service }`),
  `auto: false` (le contrôle ne cocherait que l'entrée dont la couche OL porte exactement son `name`/`service` ; l'application coche
  **par fiche**, `syncCatalogTicks`, §11.5 ; `attachLayerInfo` pose quand même `name` et `service` = `WMS` ou `WMTS` pour `checkLayersOnMap`,
  les légendes et GetFeatureInfo).
- **Configuration construite à l'exécution** (`src/map/catalogConfig.ts`, `buildCatalogData`) : `configuration.type: 'json'`,
  `configuration.data.layers[<nom>$GEOPORTAIL:OGC:<WMS|WMTS>] = { name, title, description, producer: [organisation], thumbnail,
  serviceParams: { id: 'OGC:WMS' }, metadata_urls: ['/rechercher-une-donnee/dataset/<id>'] }` ; une entrée par fiche (couche préférée
  WMTS > wms-r > wms-v, comme `preferredLayer`), les fiches sans couche dessinable resteraient en vue liste (aucune aujourd'hui : 7/7).
  Champs lus par le contrôle (`initConfigData`, `CatalogDOM.tmplElement`) : `serviceParams.id` (obligatoire), `name`, `title`,
  `description`, `producer`/`thematic` (tableaux), `thumbnail` (URL http ou data), `metadata_urls` (le lien « Voir la fiche détaillée »
  n'apparaît que si l'URL contient `catalogue/dataset` ou `rechercher-une-donnee/dataset`). Pas de `Gp.Config`, pas de réseau.
- **Vignettes** : `thumbnail` ajouté au fichier généré (`scripts/sols-layers/csw.ts`, `mri:graphicOverview/mcc:MD_BrowseGraphic/mcc:fileName`),
  7 fiches sur 7 (`https://data.geopf.fr/annexes/gissol-osf/thumbnail/<uuid>.png`). Le dépôt GeoNetwork (`POST
  https://data.geopf.fr/geonetwork/srv/api/search/records/_search?bucket=bucket`, filtre `groupPublished:"gissol-osf_g"`, CORS `*`,
  champs `overview`, `resourceAbstractObject`, `OrgForResourceObject`) donne les mêmes informations en direct ; non utilisé : la validation
  des noms de couches reste `sols-layers.json`, une fiche nouvelle demande de toute façon de régénérer le fichier, et le catalogue fonctionne
  hors ligne/sans dégradation. À reconsidérer si les fiches changent plus souvent que le fichier.
- **Un seul point d'entrée** : l'onglet « Données sols » du panneau latéral est retiré (`MapExplorer` ne garde que « Fonds de carte »,
  plus d'onglets, plus d'état `activeTab`) ; la vue `?vue=liste` reste l'alternative accessible complète ; les avis des liens profonds
  renvoient au « catalogue de la carte ».

### 11.2 Options (`CATALOG_OPTIONS`, `src/config/map.ts`, vérifiées dans `Catalog.d.ts`)

`position: 'top-right'` (élément **préposé** dans la colonne après `addControl`, le gestionnaire ayant été ajouté avant), `gutter: true`,
`collapsed: true`, `titlePrimary: 'Catalogue des données sols'`, `layerLabel: 'title'`, `layerThumbnail: true`, `size: 'lg'`,
`tabHeightAuto: false`, `addToMap: false`, `auto: false`, `optimisation: 'none'`, `search: { display, label, criteria: ['search',
'name'] }` (sous-chaîne normalisée, sans accents, sur les textes bruts du champ `search`, §11.3 point 14), `categories: [{ title: 'Données sols', id: 'sols',
producer: true, order: true, filter: null }]` (le type `Categories` déclare `field`, `value`, `clusterOptions` obligatoires : cast).
Bouton « Catalogue de cartes » renommé « Catalogue des données sols » (`labelToggleButton`), bouton primaire (`.map-catalog`, comme
l'entrée carto ; **M12** : l'icône geopf est un `::after` masqué dont le `background-color` est la couleur de l'icône, bleu France
comme notre fond primaire : forcée à `--text-inverted-blue-france`, sinon l'icône est invisible, surtout bouton pressé). Chargé à la demande (`loadCatalog`, feuille `geopfCatalogStyles.ts`).

### 11.3 Contournements amont (à ajouter au ticket du §5.7)

10. `createCatalogProducerLinks` construit les étiquettes de producteur vers `https://cartes.gouv.fr/catalogue/search?organization=…`
    pendant le chargement de la configuration (constructeur) et la méthode est déclarée **privée** dans le `.d.ts` : patchée sur le
    prototype avant construction (`useCatalog.patchProducerLinks`, une seule fois par classe, `WeakSet`) pour pointer vers
    `/rechercher-une-donnee/search?organization=…`.
11. Balisage du panneau (`CatalogDOM`) : l'attribut `role` sert de crochet JavaScript (`tabbutton`, `label-collapse-more-<cat>`,
    `button-collapse-more-<cat>`, `section-…`), rôles ARIA invalides (axe `aria-roles`, `aria-required-children` sur la liste d'onglets,
    `aria-allowed-attr` pour `aria-selected`) ; liste d'onglets nommée « presentation » ; `<h5>` vide quand `titleSecondary` est vide ;
    case à cocher sans nom (`<label for>` vide, le titre est un autre `<label>` avec `aria-controls`). `fixCatalogMarkup` et
    `fixToolButtons` (`src/map/labelToolButtons.ts`, observateur de mutations sur le widget) : `role="tab"`, crochets retirés (ils ne sont lus
    qu'à la construction du panneau), `aria-label` « Catégories du catalogue », `<h5>` vide retiré, `aria-label` « Ajouter à la carte :
    <titre> » sur chaque case. axe : 0 violation catalogue ouvert (`check:map`).
12. Le `<label for>` vide recouvre la case : au clic souris c'est le label qui reçoit l'évènement (il coche la case) ; au clavier, Espace.
13. Sous 576px geopf garde `min-width: 450px` sur le panneau (`DSFRcatalogStyle.css`) et l'ancre à droite de son bouton (`right: -4px`).
    Jusqu'à M12 `MapView.css` forçait `100vw` (panneau plein écran, qui recouvrait la colonne de boutons : gestionnaire de couches
    inaccessible sans fermer le panneau, rapport e2e v1 partie 2). **Depuis M12** : sous 48em le panneau laisse la colonne visible,
    `width: calc(100vw - 4.25rem)` (colonne 1w + 5w + 1w, marge gauche d'un demi-w) et `right: calc(100% + 0.5rem)` (1w à gauche du
    bouton) ; le gestionnaire et la liste d'outils restent atteignables catalogue ouvert, le bouton du catalogue (`aria-pressed`) et le
    « Fermer le panneau » de l'en-tête le ferment. Aucune option du widget ne couvre la hauteur ni le placement du panneau (`size`
    n'agit que sur la largeur, `tabHeightAuto` retire une classe `gpf-catalog-tabs-fixe` qu'aucune feuille ne définit).
15. **Hauteur du panneau (M12)** : les onglets DSFR se dimensionnent sur leur contenu (`.fr-tabs { height: var(--tabs-height) }`, posé par
    le script DSFR) et le `<dialog>` geopf n'a qu'un `max-height: 500px` : filtré sur une fiche (« carbone »), le panneau tombait à
    ≈ 210 px et coupait la fiche (D-carto-5, 1280×900). `MapView.css` : `.map-view { container-type: size }` puis sur le panneau ouvert
    `min-height: 20rem`, `max-height: min(32rem, calc(100cqh - 1rem))` (bornes sur l'échelle DSFR, 40w/64w, dans la carte quelle que
    soit sa hauteur), `.gpf-panel__body { flex: 1 1 auto; min-height: 0; overflow-y: auto }` et `.fr-tabs { height: auto }` (les
    onglets suivent leur contenu, le corps défile). `check:map` : panneau filtré ≥ 320 px avec la fiche entière ; à 375 px, gestionnaire
    atteignable (`elementFromPoint`) et ouvrable par-dessus le catalogue.
14. `CatalogDOM.tmplElement` insère `title`, `description` et `producer` en **`innerHTML`** (et `title`/producteur dans des attributs
    `title="…"`) : échappés (`src/text/escapeHtml.ts`) dans `buildCatalogData`. Deux fuites à contourner : la **recherche** du
    contrôle lit `layer[critère]` sur les objets de configuration (chaînes échappées : « Info&Sols » ne trouverait pas
    « Info&amp;Sols »), d'où un champ supplémentaire `search: [titre, résumé, producteur]` **bruts** et
    `search.criteria: ['search', 'name']` (les critères sont de simples noms de propriétés, les tableaux sont joints) ; et
    `createCatalogProducerLinks` reçoit le producteur échappé : `patchProducerLinks` construit l'URL sur `unescapeHtml(name)` et rend le
    `name` tel quel (il repart dans le gabarit). `name`, `thumbnail` et `metadata_urls` sont posés en attributs. Les vignettes sont
    **décoratives à dessein**
    (`<img>` sans texte alternatif porteur : le titre est le libellé de la case) ; le générateur ne garde une vignette que si son URL est
    `https:` sur un hôte de confiance (`TRUSTED_IMAGE_HOSTS` : `data.geopf.fr`, site GIS Sol ; `isTrustedImageUrl`, `src/config/urls.ts`).

### 11.4 Sélecteurs e2e

| Élément | Sélecteur |
|---|---|
| Bouton du catalogue | `getByRole('button', { name: 'Catalogue des données sols', exact: true })` (`aria-pressed`) |
| Panneau | `[id^="GPcatalogPanel-"]` (nommé « Catalogue des données sols ») ; recherche `#catalog-input-search-global` |
| Entrée | `[data-layeritem]` ; case `input[data-layer="<nom>:<WMS|WMTS>"]` nommée « Ajouter à la carte : <titre> » (Espace au clavier) ; vignette `img` ; « Voir la fiche détaillée » `a.fr-link` ; producteur `a.fr-tag` |
| Données sols | plus d'onglet : les couches s'ajoutent depuis le catalogue ; la liste complète reste en `?vue=liste` |
| Avis « Couche indisponible » | `getByRole('alert').filter({ hasText: 'Couche indisponible' })` (titre `h2`, nomme la donnée) : toute couche de la carte sans image, quel que soit son mode d'ajout |
| Avis « Catalogue indisponible » | `getByRole('alert').filter({ hasText: 'Catalogue indisponible' })`, avec le lien « Version accessible de la liste des données » (chunk du catalogue en échec) |

### 11.5 Revue M9 (2026-11-05)

- **Couche indisponible, quel que soit l'ajout** : l'avis vivait dans `DeepLinkNotice` (liens seulement) ; `MapNotices`
  (`src/components/map/MapNotices.tsx`) affiche désormais une `Alert` DSFR `warning` (`role="alert"`, titre `h2`) par couche du store
  présente dans `unavailableOverlays` (catalogue, lien, permalien), retirée avec la couche. `DeepLinkNotice` ne garde que les issues du lien.
- **Cochage par fiche** : `auto: false` ; `syncCatalogTicks(element, overlays, datasets)` coche l'entrée d'une fiche dès qu'**une** de ses
  couches est sur la carte (un lien peut poser une couche autre que la préférée : `rrp_loiret_…` vs entrée `rrp_dept_loiret_…`) et décoche
  les autres ; appelé à chaque mutation du widget (`watchToolButtons(element, sync)`) et à chaque changement de `overlays`. Cocher une
  entrée dont la fiche est déjà sur la carte n'ajoute rien (`addCatalogEntry`), la décocher retire **toutes** les couches de la fiche
  (`removeCatalogEntry`).
- **Catalogue indisponible** : si le chunk `loadCatalog` échoue, `setCatalogueUnavailable(true)` (store) et `CatalogueUnavailableNotice`
  renvoie à « Version accessible de la liste des données ».
- Échappement HTML et vignettes de confiance : §11.3 point 14. Patch du prototype appliqué une fois : §11.3 point 10.
- **Revue 2** : l'échappement fuyait dans l'URL de l'étiquette producteur (`organization=INRAE%20-%20Info%26amp%3BSols`) et dans la
  recherche du widget : URL sur le nom brut (`unescapeHtml`), recherche sur le champ brut `search` (§11.3 point 14) ; `check:map`
  vérifie l'`href` exact, le texte « INRAE - Info&Sols » et la recherche « Info&Sols » (7 données). Avis « Couche indisponible »
  **masquable** (`closable`, « Masquer le message ») : il reste au-dessus de la carte (le panneau du catalogue est ancré dans la carte,
  un avis par-dessus la carte recouvrirait ses widgets) et revient si la couche est retirée puis remise.
- `check:map` : donnée Loiret ajoutée depuis le catalogue → avis « Couche indisponible » puis retrait ; lien `l=` vers `rrp_loiret_…` →
  entrée `rrp_dept_loiret_…` cochée, décocher retire la couche et l'avis.

## 12. v1.1 (M13)

### 12.1 Pied de page extensible et en-tête

- **Motif d'origine** : `CgfrFooter.vue` (IGNF/cartes.gouv.fr-vue-components, utilisé par cartes.gouv.fr-entree-carto). Le pied de page
  DSFR complet est rendu (`SiteFooter.tsx`, balisage calqué sur `apps/accueil/src/_includes/partials/footer.njk`, contenu de
  `@sols/brand`) ; replié, la classe `compact-footer--collapsed` ne laisse que `.fr-footer__bottom` et les blocs `.fr-footer__body`,
  `.fr-footer__partners`, `.fr-footer__bottom-copy` portent `hidden` (une règle `.compact-footer [hidden] { display: none }` est
  nécessaire : le `display: flex` du DSFR l'emporte sur la feuille de style du navigateur). Le bouton bascule l'état puis
  `setTimeout(() => window.scrollTo({ top: open ? document.body.scrollHeight : 0, behavior }), 0)` ; `behavior: 'smooth'` à l'ouverture
  sauf `prefers-reduced-motion: reduce`. Le focus reste sur le bouton (même élément, libellé changé).
- **`Footer` de react-dsfr écarté** : il impose ses liens bas (libellé d'accessibilité, ordre), réduit les liens de contenu à des domaines
  (`domains`) et ne peut pas accueillir le bouton hors de `fr-footer__bottom-list`. `fr-footer__content-item` est une classe DSFR sans CSS
  absente de la liste typée de `fr.cx` : chaîne brute.
- **Mise en page (`App.css`, ≥ 48em)** : `display: grid; grid-template-rows: auto minmax(20rem, 1fr) auto; min-height: 100dvh`.
  `min-height` et non `height` : un `height: 100dvh` (v1, flex) rognait le pied déplié au lieu d'agrandir le document. La rangée `1fr` se
  résout contre le `min-height` (CSS Grid §12.7.1) : `main` a une hauteur définie, la chaîne flex de la carte (`.map-view { height: 100% }`)
  fonctionne et OpenLayers suit par son ResizeObserver (canvas = hauteur de `.map-view`, vérifié). Pied déplié :
  `.app-layout--map:has(> .compact-footer:not(.compact-footer--collapsed))` passe la rangée à `minmax(80dvh, 1fr)` : à 1280×900 la carte
  passe de 683 à 679 px (75 %) au lieu de tomber à 589 px avec un plancher de 70dvh (la barre d'outils au-dessus de la carte prend ~40 px).
  Le plancher replié (20rem) évite tout défilement sur les écrans bas. Les liens d'évitement DSFR sont en `position: absolute` : pas de rangée.
- **Piège `fr-enlarge-link`** : le DSFR étend le lien de la marque par `a::before { position: absolute; inset: 0 }` jusqu'au premier ancêtre
  positionné, normalement `.fr-header__brand.fr-enlarge-link`. Le `position: relative` posé en M7 sur `.fr-header__service` (pour la marque
  Observatoire en `::after`) confinait ce calque au bloc titre : Marianne et logo GIS Sol n'étaient pas cliquables. La marque est désormais
  un fond (`background: var(--osf-mark) 1.25rem center / 3rem 3rem no-repeat`, ≥ 62em) ; ne jamais repositionner un descendant de
  `.fr-header__brand`. Vérifié par `elementFromPoint` (l'ancien CSS réinjecté donne `false, false`).
- **Menus « Aide » (contrat E10, PR #70)** : items `{ label, href, hrefTemplate?, external?, icon?, description? }` (`HeaderMenuItem`,
  champs facultatifs : la marque de `main` reste valide). `itemHref` résout `{lang}` en `fr` (pas de sélecteur de langue ici) ; un item
  `external` ou à `href` absolu reçoit `target="_blank" rel="noopener external"` et `title="<libellé> - nouvelle fenêtre"`. Icône de l'item
  avant le libellé (`fr-link--icon-left` + classe d'icône, si listée dans `HEADER_MENU_ICONS`, sinon rien) ; l'icône « lien externe » après
  est celle du DSFR (`[target=_blank]::after`), poussée à droite comme sur cartes.gouv.fr (`.header-menu__label { flex: 1 }`). Badge :
  `badgeStyles.carto` (E10) → `SERVICE_BADGE_CLASSES`, liste blanche de couleurs et d'icônes, repli violet glycine + `fr-icon-map-pin-2-fill`.
  `check:map` ne cherche plus `cartes.gouv.fr` que dans `.fr-header__brand` (les liens « Aide » y mènent depuis E10) et vérifie les liens
  externes de « Aide ». Les icônes DSFR étant des data URI inlinées, comparer les `mask-image` de `::before` et `::after`, pas leur nom.
- **Icônes et build parallèles** : `react-dsfr update-icons` réécrit `dsfr/utility/icons/icons.min.css` dans `node_modules` ; avec bun, ce
  fichier est un lien physique partagé par tous les worktrees (7 liens observés) : un build lancé en parallèle dans une autre brique peut
  retirer les icônes `ri-*` du bundle. Relancer `bun run build` juste avant `check:map` et vérifier `grep ri-share-line dist/assets/*.css`.
- **Sélecteurs e2e** : bouton `getByRole('contentinfo').getByRole('button', { name: 'Haut de page' })` (replié) /
  `{ name: 'Fermer' }` (déplié), `aria-expanded`, `aria-controls="footer"` ; état `footer.compact-footer--collapsed` ; logos
  `.fr-footer__partners img`. `check:map` (bloc M13) : hauteur de document, `scrollY`, hauteur de `.map-view` et du canvas, axe déplié,
  bascule à 375 px, test de clic sur `.fr-header__logo`, `.fr-header__operator`, `.fr-header__service`.

### 12.2 Barre d'outils retirée, catalogue de cartes, outils à la demande (PR 2)

- **Plus de `map-explorer__toolbar` ni de panneau latéral** (`MapExplorer` = avis + carte) : la vue carte occupe toute la largeur. Le
  bouton « Imprimer » est un contrôle OpenLayers maison (`src/map/printControl.ts`, `usePrintControl`) habillé comme les boutons geopf
  (`gpf-widget gpf-widget-button`, `gpf-btn gpf-btn-icon fr-btn fr-btn--tertiary fr-icon-printer-line`, `aria-label` « Imprimer »), déplacé
  dans `#position-container-top-left` après les contrôles geopf (zoom, plein écran, import, GetFeatureInfo) ; **id `GPprint-<n>` obligatoire**
  (le `PanelManager` de `Controls/Widget.js` lit `element.id.match(/(\w+)-[0-9]+/)[1]` sur chaque widget d'une colonne à l'ouverture d'un
  panneau : sans id, `TypeError` et GetFeatureInfo/Légendes ne s'ouvrent plus) et `position: static` (OL pose `absolute` : le bouton
  recouvrait le zoom) ; il ouvre la modale DSFR
  `printModal` (`src/components/map/printModal.ts`, `openPrintModal`). **Partage retiré** (`ShareModal`, `mapPermalink`, `SHARE_LABELS`) ;
  la lecture des permaliens/liens profonds (`permalink.ts`, `deepLink.ts`) reste. **Vue liste conservée mais plus liée** depuis la carte
  (`?vue=liste` ; l'avis « Catalogue indisponible » y renvoie encore) ; le magasin perd `isPanelOpen`/`togglePanel`.
- **Catalogue renommé « Catalogue de cartes »** (`CONTROL_LABELS.catalog`, `titlePrimary`, `GEOPF_DIALOG_LABELS.GPcatalogPanel`) avec deux
  catégories (`CATALOG_CATEGORIES`) filtrées sur un champ `kind` des entrées (`CATALOG_KIND_FIELD`, valeurs `CATALOG_KINDS`) : « Données
  sols » (`sols`, producteur, tri) et **« Fonds de cartes »** (`fonds`, onglet `tabbutton-1_fonds`). Les entrées fonds sont les
  `BASE_LAYER_CANDIDATES` publiés dans les capacités WMTS (`useBaseLayerCatalogue().layers`, passés à `useCatalog(map, layers)` ; le
  contrôle est créé aussitôt (le bouton n'attend pas une GPF lente) puis **reconstruit sur place** à l'arrivée des fonds, même panneau
  ouvert, dans la même vue (M14, §12.4 ; en M13 la reconstruction attendait la fermeture du panneau, et l'onglet « Fonds de cartes »
  restait vide tant qu'il était ouvert), clé `<nom>$GEOPORTAIL:OGC:WMTS`, titre des capacités, sans producteur (`producer: []` →
  `createCatalogProducerLinks` renvoie `null` : le gabarit lit `producers[0].name` dès que la liste est définie). Cocher un fond →
  `setActiveBaseLayer` ; `syncCatalogTicks(root, overlays, datasets, baseLayers, activeBaseLayerId)` coche le seul fond actif (et le recoche
  après un décochage : un fond reste toujours affiché). Cases nommées « Afficher le fond de carte : <titre> » (`checkboxes-fonds`,
  `fixToolButtons`). La recherche globale du widget couvre les deux onglets.
- **Barre de recherche centrée** (≥ 48em : `left: 50%; transform: translateX(-50%)`, largeur bornée par les deux colonnes de boutons) ;
  **bouton d'effacement** `GPsearchInputReset-` masqué tant que le champ est vide (`:has(> input:placeholder-shown)` sur son parent, le
  bouton n'est pas dans `.GPInputGroup` mais frère du champ dans `.gpf-panel__content`). cartes.gouv.fr garde sa barre en haut à gauche
  et n'a pas de `GPsearchInputReset-` (bouton « Effacer la saisie » en flux, affiché seulement avec du texte).
- **Outils à la demande** (`DEFAULT_TOOLS` = MeasureLength, MeasureArea, Drawing, Route, par `CLASSNAME` geopf) : les autres outils
  listables reçoivent `map-tool--on-demand` et leur bouton est masqué (`MapView.css`) jusqu'à ce que l'outil soit choisi dans
  **« Afficher tous les outils »** (ControlList renommé, placé **en dernier** de la colonne de droite, panneau titré « Tous les outils »,
  M14) :
  l'entrée de la liste clique le bouton de l'outil (comportement amont, `ControlListDOM`), qui passe `aria-pressed="true"` ;
  `revealOnOpen` (observateur d'attribut) ajoute alors `map-tool--shown` et le bouton reste. Sur cartes.gouv.fr les six premiers outils
  sont dessinés et les autres repoussés hors écran par geopf (`margin-left: -9504px`) : la liste y ouvre l'outil sans ajouter son bouton ;
  ici le bouton est ajouté (demande du brief). Même comportement à toutes les largeurs (la règle mobile qui cachait tous les outils
  listables est retirée).

### 12.3 Disposition des contrôles (PR 3)

- **Plus de contrôle d'attribution** (`GeoportalAttribution`, bouton « Sources des données », `CONTROL_LABELS.attribution`) : demande du
  brief ; cartes.gouv.fr n'en affiche pas non plus (`.ol-attribution` absent). Les attributions restent posées sur les sources
  (`GPF_ATTRIBUTION`, `SOLS_ATTRIBUTION`) pour la feuille d'impression (`exportMap.mapSources`).
- **Plein écran en bas à droite** (`MAP_TOOLS_OPTIONS.fullScreen.position: 'bottom-right'`, `#position-container-bottom-right`, comme sur
  cartes.gouv.fr) ; **échelle** OL à sa gauche (`MapView.css` : `left: auto; right: 4rem` = 2w + 5w + 1w, `bottom: 0.5rem`), texte et
  trait en `--text-action-high-blue-france` (M19 : couleurs de cartes.gouv.fr, §14.2) (`.ol-scale-line-inner`, OL les tirait de `--ol-foreground-color`/`--ol-subtle-foreground-color`,
  gris) ; la colonne bas gauche garde légendes, territoires et mini-carte.
- `check:map` : pas de `.ol-attribution`, plein écran dans la colonne bas droite à ≤ 16 px des bords, échelle à 4–24 px à sa gauche, couleurs
  de l'échelle = jeton action dans les deux thèmes.

### 12.4 Défauts mineurs de la passe e2e 4 (M14)

Rapport `doc/e2e/REPORT.md` « Passe 4 » (PR #76) ; plan `doc/plans/M14.md`.

- **D-carto-9, titre de la liste d'outils** : `ControlList._initContainer` écrit « Mes outils » en dur dans l'en-tête du panneau (aucune
  option, à toutes les largeurs ; le rapport l'a vu sur mobile). `labelPanelTitle` (`src/map/labelControls.ts`) le remplace à la création
  par `CONTROL_LABELS.controlListTitle` « Tous les outils », qui nomme aussi la fenêtre (`GEOPF_DIALOG_LABELS.GPcontrolListPanel`) ; le
  bouton reste « Afficher tous les outils ». À signaler en amont (option de titre).
- **D-carto-7, infobulle sur le titre du panneau** : geopf dessine le nom du bouton en infobulle CSS (`::before`,
  `content: attr(aria-label)`, `DSFRgeneralWidget.css`) au survol et au focus clavier, à côté du bouton, là où s'ouvre son panneau : bouton
  pressé, elle couvrait le titre et le bouton « Fermer le panneau » du catalogue (et la liste d'outils). `MapView.css` :
  `.gpf-widget:has(> dialog) > .gpf-btn-icon[aria-pressed='true']::before { display: none }`. Nom accessible inchangé ; les boutons sans
  panneau (mesures : pressées = actives) gardent leur infobulle ; aucun bouton geopf à panneau ne dessine son icône en `::before` (relevé
  sur tous les widgets).
- **Bouton « Imprimer »** (vu en vérifiant D-carto-7) : la classe d'icône DSFR posée sur le bouton (`fr-icon-printer-line`, icône en
  `::before`) était écrasée par l'infobulle geopf : bouton vide au survol, infobulle masquée par l'icône. L'icône est un `span` décoratif
  (`aria-hidden`) centré en absolu ; le bouton prend les classes des boutons geopf (`gpf-btn--tertiary` : `position: relative`, l'infobulle
  s'ancre sur lui), garde leur boîte (l'infobulle part du `padding`, puis `translateX(24px)`) et perd son `title` (infobulle en double).
- **D-carto-8, « Photographies aériennes » restée décochée** : deux causes, reproduites avec Playwright à 375 px (profil Pixel 5).
  1. Catalogue ouvert avant les capacités WMTS (retardées de 2,5 s) : l'onglet « Fonds de cartes » restait **vide** tant que le panneau
     restait ouvert (3/3), la reconstruction attendant sa fermeture. geopf ne sait pas ajouter d'entrées à un contrôle construit :
     `addLayerConfig` (public) appelle une méthode absente (`createCatalogLinks`), trie un objet (`layersList.sort`) et passe `layersList`
     comme `data` à `createCatalogContentEntries`, qui lit `data.layers` (même code sur `main` amont, à signaler). Le contrôle est donc
     reconstruit **aussitôt**, construit ouvert (`collapsed: false`, appliqué par `setMap` : ni clic ni `PanelManager`, les autres
     panneaux ne bougent pas), et `src/map/catalogView.ts` reporte la vue : onglet (clic sur `tabbutton-<n>_<id>`, ids stables), texte de
     recherche (posé, puis bouton de recherche : filtre immédiat, à partir de trois caractères comme le champ geopf), défilement de
     `.gpf-panel__body` et focus (id de l'élément ou de son ancêtre identifié, uid du widget remplacé, puis rang parmi les focusables).
     geopf insère les entrées après un `setTimeout` (`_createCatalogContentCategoryTabContent`), après `catalog:loaded` : recherche,
     défilement et focus d'une entrée attendent une case par entrée configurée (`entriesRendered`) ; bouton, onglets, recherche et
     en-tête reçoivent le focus aussitôt. Le focus n'est rendu que s'il est perdu (sur `body`). Après correctif : 0/5 échec, console vide.
  2. Cas du rapport (Plan IGN coché, puis Espace sans effet) : juste après le clic sur un onglet, le panneau DSFR passe de
     `visibility: hidden` à `visible` par une transition (`transition: visibility 0.3s`) et reste caché **une image** (16 à 33 ms
     mesurés) ; `locator.focus()` de Playwright n'attend pas la visibilité, le focus échoue sans erreur et Espace part sur l'onglet (1/10 à
     375 px). Hors de portée d'un utilisateur, rien à corriger dans l'application : la suite e2e (`03-carto.spec.ts`) doit attendre
     `toBeVisible()` avant `focus()`, comme `check:map`.
- `check:map` (bloc M14) : titre de la liste à 375 et 1280 px ; infobulle du catalogue au survol bouton relâché, aucune panneau ouvert,
  ni sur la liste d'outils ouverte au clavier, gardée sur une mesure active ; « Imprimer » survolé : infobulle et icône centrée ;
  capacités WMTS retenues pendant qu'on ouvre le catalogue sur « Fonds de cartes » (vide), tape « photo » et garde le focus sur l'onglet :
  un seul widget, reconstruit, resté ouvert et rempli, même onglet, recherche appliquée (Plan IGN masqué), focus rendu à l'onglet,
  « Photographies aériennes » cochée au clavier, tuiles ORTHOIMAGERY demandées, console vide.

### 12.5 Sélecteurs e2e (PR 2 et 3)

| Élément | Sélecteur |
|---|---|
| Catalogue | `getByRole('button', { name: 'Catalogue de cartes', exact: true })` ; onglets `#tabbutton-0_sols`, `#tabbutton-1_fonds` ; fonds `input[name="checkboxes-fonds"][data-layer="<nom>:WMTS"]` nommés « Afficher le fond de carte : <titre> » |
| Imprimer | `.map-print button` (`aria-label` « Imprimer », icône `span.fr-icon-printer-line`, sans `title`), dans `#position-container-top-left` ; modale `#imprimer-la-carte` |
| Tous les outils | `getByRole('button', { name: 'Afficher tous les outils', exact: true })` (dernier de `#position-container-top-right`) ; panneau `getByRole('dialog', { name: 'Tous les outils' })`, titre `[id^="GPcontrolListPanel-"] .gpf-panel__title` « Tous les outils » (M14) ; entrées `[id^="GPcontrolListPanel-"] li` ; outil à la demande caché : `.map-tool--on-demand:not(.map-tool--shown)` |
| Infobulles | `getComputedStyle(bouton, '::before').content` = `"<nom>"` au survol bouton relâché ; `display: none` bouton pressé d'un widget à panneau (M14) |
| Fonds de cartes juste après un changement d'onglet | attendre `toBeVisible()` sur la case avant `focus()` (panneau DSFR caché une image, §12.4) |
| Supprimés | « Masquer/Afficher le panneau », `#panneau-lateral`, « Partager », « Version accessible de la liste des données » sur la carte, onglet DSFR « Fonds de carte », bouton « Sources des données » (`.ol-attribution`) |
| Plein écran, zoom, échelle (M16) | `#position-container-bottom-right` contient, dans l'ordre, `[id^="GPfullScreen-"]` (bouton « Plein écran ») puis `[id^="GPzoom-"]` (`#GPzoomIn` « Zoomer », `#GPzoomOut` « Dézoomer ») ; `.ol-scale-line` à leur gauche ; conteneurs `[id^="position-container-"]` dans l'ordre top-left, top-right, bottom-left, bottom-right (ordre du clavier) |
| Vignettes du catalogue (M16) | `[data-layeritem] .catalog-thumbnail-container img` ; fonds : `src` sous `https://data.geopf.fr/annexes/ressources/metadata/thumbnail/` ; entrée sans image : conteneur masqué (`display: none`) |
| Avis de l'onglet « Fonds de cartes » (M15) | `[id$="-panel_fonds"] .map-catalog__notice` (`role="status"`, `data-status` = `loading`, `error` ou `empty`) ; bouton `getByRole('button', { name: 'Recharger la page' })` en cas d'échec ; absent dès que les entrées sont là |

### 12.6 Courses du fond de carte et onglet « Fonds de cartes » vide (M15)

Rapport e2e « Passe 4 » (PR #76, D-carto-11) ; plan `doc/plans/M15.md`.

- **D-carto-11, Plan IGN absent de la liste à 375 px** (test de stabilité e2e : « Plan IGN » cherché **5 s** après l'affichage de la
  carte). Mesures Playwright (Pixel 5, 375×812, aperçu local, script de reproduction hors dépôt) avant correctif : 0/30 en série,
  0/40 avec le test e2e lui-même, **2/90** en trois boucles parallèles (premier GetCapabilities sans réponse, abandonné à 3 s, nouvel
  essai lent : Plan IGN à 6,5–6,7 s) ; deux requêtes bloquées de suite (`page.route`) : 6/6 en retard (7,8 s) ; GPF qui répond
  après ~3 s : 10/10 **sans fond, définitivement** (chacun des cinq essais abandonné juste avant sa réponse). `curl` : 2/30 puis 3/40
  requêtes sans en-têtes en 12–15 s, les autres en 0,1–1 s, corps reçu en moins de 0,1 s : la GPF bloque **avant** les en-têtes.
- Pistes écartées (code lu, mesures) : identifiant du fond perdu à la reconstruction du catalogue (le magasin n'est écrit que sur un
  clic d'entrée ; `checkLayersOnMap` et `syncCatalogTicks` posent `checked` sans évènement) ; gestionnaire non rafraîchi (une seule
  instance, `setMap` liste les couches présentes puis écoute `add` ; conteneurs de position jamais recréés ; état OpenLayers relu par
  la fibre React : une couche, une ligne) ; capacités sans PLANIGNV2 (toutes les réponses complètes la publient). Dans nos mesures, un
  chargement sans Plan IGN à 5 s n'a **jamais** de canvas non plus : le cas « canvas présent » du rapport n'a pas été reproduit.
- **Cause trouvée en vérifiant le correctif** : la GPF peut aussi **s'arrêter au milieu du corps** : en-têtes à 1,9 s puis corps
  complet à 13,2 s (1 chargement sur ~200, journal des requêtes Playwright) ; `curl` ne l'a pas montré sur 40 requêtes. L'ancien
  correctif ne bornait que l'attente des en-têtes : ce chargement restait sans fond tant que le corps n'arrivait pas.
- **Correctif** : `src/map/fetchHedged.ts` (remplace `fetchWithTimeout`), pour les capacités WMTS et WMS. Dès que **aucune**
  requête n'a progressé (en-têtes ou octets du corps) pendant `GPF_REQUEST_HEDGE_DELAY_MS` (1,5 s), une autre requête part **à côté**
  (les lentes ne sont pas abandonnées), jusqu'à `GPF_REQUEST_ATTEMPTS` (5) ; la première **lue en entier** gagne (corps mis en
  mémoire, rendu dans une `Response`), les autres sont annulées ; une erreur réseau, un corps coupé ou une erreur HTTP envoie aussitôt
  la suivante ; `GPF_REQUEST_DEADLINE_MS` (16 s) **sans aucun progrès** → `TimeoutError`, alerte. Un réseau lent qui reçoit des octets
  n'est jamais coupé ni doublé. TanStack Query ne relance plus après l'échéance (`shouldRetryGpfRequest`), une fois après une erreur
  HTTP ou un document illisible. La borne de 5 requêtes vaut pour les **blocages** (attente, échéance) : des échecs **rapides**
  (erreur réseau ou HTTP) envoient aussitôt la suivante, épuisent les 5, puis TanStack relance une série (`GPF_REQUEST_RETRIES`) :
  jusqu'à **10 requêtes** au total. Le corps d'une réponse en erreur HTTP est abandonné (`response.body.cancel()`) : seul son statut
  sert (revue M15).
- **Piège, `cache: 'no-store'`** : sans lui, Chromium fait attendre une requête identique en vol derrière la première (verrou du cache
  HTTP) : la requête doublée restait bloquée avec elle (5/90 chargements sans fond au premier essai du correctif, invisible avec
  `page.route`, qui désactive le cache). Les capacités GPF n'ont ni `Cache-Control`, ni `ETag`, ni `Last-Modified` : rien n'est perdu.
- Après correctif (même aperçu, mêmes scripts) : **0/200** chargements mobiles parallèles (4 à la fois) sans Plan IGN à 5 s, le plus
  lent à 3,45 s ; deux requêtes bloquées de suite : 5/6 dans les 5 s (la sixième : seule requête servie, en 3,5 s par la GPF) ; GPF
  à ~3 s : 0/12 sans fond. **Pour la suite e2e** : attendre « Plan IGN » (attente bornée, 20 s) plutôt qu'un délai fixe de 5 s,
  comme `check:map` ; une GPF lente reste possible.
- **Onglet « Fonds de cartes » vide** pendant le chargement des capacités : `useBaseLayerCatalogue().status` (`loading`, `error`,
  `empty`, `ready`, `baseLayersStatus`) → `useCatalog(map, layers, status)` → `showBaseLayersNotice` (`src/map/catalogNotice.ts`) pose
  en tête du panneau `[role=tabpanel][id$=-panel_fonds]` un conteneur `role="status"` (gardé d'un état à l'autre, contenu remplacé)
  avec une alerte DSFR `fr-alert--sm` : info « Chargement des fonds de cartes de la Géoplateforme… », erreur avec bouton « Recharger
  la page » (`fr-icon-refresh-line`, `location.reload()` : les capacités ne sont pas en cache), avertissement si aucun fond prévu
  n'est publié ; rien dès que les entrées sont là (le widget est reconstruit avec elles, §12.4). Idempotent : appelé à chaque
  mutation du widget (geopf construit les panneaux après un délai) et à chaque changement d'état. Textes dans `MAP_NOTICES`.
- `check:map` (bloc M15) : 40 chargements mobiles neufs, 4 à la fois, Plan IGN listé et canvas présent dans les 5 s à chaque fois ;
  deux premières requêtes sans réponse : Plan IGN dans les 5 s ; GPF à 3,2 s : Plan IGN listé ; capacités retenues : avis de
  chargement (`role="status"`) dans l'onglet, puis entrées et plus d'avis, console vide ; capacités en échec : avis d'erreur, « Recharger
  la page » recharge la carte (Plan IGN listé ensuite). Captures `doc/screenshots/M15/`.

### 12.7 Vignettes des fonds de cartes, zoom sous le plein écran (M16)

Demande du propriétaire (fin de v1.1) ; plan `doc/plans/M16.md`.

- **Vignettes vides** : les entrées « Fonds de cartes » n'avaient pas de `thumbnail` ; avec `layerThumbnail: true`, `Catalog.js`
  (`initConfigData`) met `"default"`, `CatalogDOM.tmplThumbnail` ne rend alors aucune `<img>` et `DSFRcatalogStyle.css` peint une
  vignette d'attente vide (fond SVG de `.catalog-thumbnail-default`). cartes.gouv.fr tire les vignettes de sa configuration de
  couches (`IGNF/cartes.gouv.fr-entree-carto`, `public/data/entreeCarto.json`, champ `thumbnail`, clé `<nom>$GEOPORTAIL:OGC:WMTS`),
  fichiers des annexes GPF `annexes/ressources/metadata/thumbnail/` ; geopf-ext n'en dérive aucune. Relevé et vérifié en `curl`
  le 2026-11-06 (200 `image/jpeg`) :

  | Fond | Couche | Vignette |
  |---|---|---|
  | Plan IGN | `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` | `vignette-plan-ign.jpg` |
  | Photographies aériennes | `ORTHOIMAGERY.ORTHOPHOTOS` | `vignette-bd-ortho.jpg` |
  | Cartes IGN (non publiée) | `GEOGRAPHICALGRIDSYSTEMS.MAPS` | `vignette-scan-25.jpg` |
  | Relief du terrain | `ELEVATION.SLOPES` | `vignette-bd-alti.jpg` |
  | Carte de l'état-major | `GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40` | `vignette-scan-EM-40k.jpg` |
  | Photographies aériennes 1950-1965 | `ORTHOIMAGERY.ORTHOPHOTOS.1950-1965` | `vignette-bd-orthohisto.jpg` |

  `gpfThumbnailUrl` (`src/config/urls.ts`), champ `thumbnail` de `BASE_LAYER_CANDIDATES`, repris par `availableBaseLayers` puis
  `buildCatalogData` (seulement si `isTrustedImageUrl`). **Repli sans image** : `MapView.css` masque `.catalog-thumbnail-container`
  sans `<img>` (plus de vignette vide), et `dropBrokenThumbnails` (`src/map/catalogThumbnails.ts`, évènement `error` capturé sur le
  widget : geopf crée les `<img>` par `innerHTML`) retire une image qui ne se charge pas (plus d'image cassée) **ou qui n'est toujours pas chargée au bout de
  `THUMBNAIL_LOAD_TIMEOUT_MS` (10 s)** : une requête de vignette CSW bloquée laissait une case vide (revue M16). Les vignettes se
  chargent même panneau fermé ou onglet masqué (mesuré : 12/12 en moins de 6 s au bureau), le délai part donc de leur insertion ;
  `check:map` retient une vignette CSW et vérifie qu'elle est retirée sans case vide. Les sept fiches
  « Données sols » gardent leurs vignettes CSW (`check:map`).
- **Catalogue geonetwork** (`/rechercher-une-donnee/`, vérifié sur la page de recherche et la fiche des stocks de carbone) : pas de
  vignette vide équivalente. L'aperçu carte d'une fiche n'a pas de choix de fond : un seul fond XYZ configuré (`[[map_layer]]` de
  `apps/rechercher-une-donnee/config/default.toml`, Plan IGN en tuiles WMTS), sans vignette ; les cartes de résultats montrent les
  vignettes CSW (toutes chargées). Rien à signaler au catalogue.
- **Zoom sous le plein écran** : `MAP_TOOLS_OPTIONS.zoom.position: 'bottom-right'`, comme cartes.gouv.fr (`zoomOptions` et
  `fullscreenOptions` à `bottom-right`, plein écran déclaré avant le zoom dans `Controls.vue`). `createMapControls` ajoute le plein
  écran puis le zoom : `GeoportalZoom` cible son conteneur et s'y ajoute à la suite (`appendChild`), sous le plein écran (le
  `PositionFactory` de geopf, lui, *préfixe* dans les colonnes du bas). Aucune règle CSS nouvelle : l'échelle (`right: 4rem`,
  `bottom: 0.5rem`) reste à gauche de la colonne, à côté de « Dézoomer ». Mesuré à 375, 768 et 1280 px : « Dézoomer » à 6 px du bas,
  plein écran 4 px au-dessus de « Zoomer », échelle 8 px à gauche.
- **Ordre du clavier** : `GeoportalZoom` et `GeoportalFullScreen` créent chacun leur propre conteneur de position s'il manque ; créé
  en premier, `position-container-bottom-right` passait avant les autres dans le DOM (sur `main` déjà : haut gauche, bas droite, haut
  droite, bas gauche). `ensurePositionContainers` (`src/map/positionContainers.ts`, appelé avant les premiers contrôles) crée les
  quatre conteneurs dans l'ordre de lecture (mêmes id et classes que geopf, qui les réutilise). Tab depuis la carte : outils du haut
  à gauche, du haut à droite, du bas à gauche, puis « Plein écran », « Zoomer », « Dézoomer », puis la recherche (chargée après).
- `check:map` : pile plein écran puis zoom dans `#position-container-bottom-right`, alignés, « Dézoomer » à ≤ 16 px du bas, échelle
  à 4–24 px à gauche, conteneurs dans l'ordre de lecture, la recherche ne recouvre pas le zoom (375, 768, 1280 px) ; vignettes GPF des
  fonds et CSW des sept données sols chargées, aucune vignette vide, image forcée en échec retirée (1280 et 375 px), console vide.
  Captures `doc/screenshots/M16/`.


## 13. En-tête compact (M17, ticket #5)

Demande du propriétaire : « le même en-tête compact que guichet-collaboratif, seulement sur /explorer-les-cartes ».
L'edito et le catalogue gardent leur en-tête.

### 13.1 Référence lue

IGNF/cartes.gouv.fr-guichet-collaboratif, branche `develop` (`bd456e3`), introduit par `f3427f82` « Passage du header en
mode compact (#295) » : `src/components/Layout/AppHeader.tsx`, `src/css/app-header.css` (retouché par `659e9716`),
`src/components/Layout/Header/HeaderMenu.tsx`, `HeaderMenus.tsx`, `src/css/map-view.css`. Guichet n'utilise **pas** le
`Header` de react-dsfr : balisage DSFR écrit à la main, `<header class="fr-header fr-header--compact">`
(`fr-header--compact` n'est pas un modificateur DSFR 1.14), `fr-container--fluid`, et un `fr-header__menu fr-modal` vide
caché (« Required by DSFR JS »). cartes.gouv.fr/creer-une-carte (cité dans le ticket) a l'en-tête DSFR standard (117 px à
1280 px, menu « Menu » sous 62em) : seule guichet sert de modèle.

| Élément | guichet (`app-header.css`) | Ici (`SiteHeader.css`) |
|---|---|---|
| Rangée | `height: 3.5rem`, `padding: 0.5rem 1rem`, bordure basse `--border-default-grey` | idem (+ `box-sizing: border-box`, `margin: 0`) |
| Marque | `brand-top` 2.5rem, `gap: 0.25rem` | idem ; mise en page DSFR lg (marque sans fond ni ombre) à toutes les largeurs |
| Marianne | drapeau seul 2.0625rem × 0.75rem, texte en `font-size: 0`, devise masquée | idem |
| Opérateur | image 1.688rem × 1.875rem (logo cartes.gouv.fr) | GIS Sol : hauteur 1.875rem, largeur selon le logo (96 px) ; masqué sous 36em (M-6) |
| Service | slogan masqué, badge à partir de 48em (`margin-left: 0.625rem`) | slogan non rendu, badge idem ; marque Observatoire en fond, 1.875rem, à partir de 48em |
| Outils | `fr-header__tools-links` en flex, `gap: 0.25rem`, boutons `size="small"`, chevron tourné, bouton ouvert sur `--background-open-blue-france` | idem (`fr-btn--sm`, `title` = libellé comme cartes.gouv.fr) ; sous 48em icône + chevron seuls, libellé en règles `fr-sr-only` (M-6) |
| Panneau | `width: 18rem`, `max-width: calc(100vw - 2rem)`, ombre `--overlap-shadow` | idem, fond `--background-overlap-grey` gardé |

### 13.2 Choix et pièges

- **`SiteHeader` écrit en balisage DSFR** (comme guichet) : le `Header` de react-dsfr ajoute toujours le bouton « Menu »
  et la modale mobile, et y duplique les outils. Un seul lien dans la marque (titre du service, `title` = `homeLinkTitle`),
  étendu à tout le bloc par `fr-enlarge-link` ; toujours aucun `position` sur un descendant de `.fr-header__brand` (§12.1).
- **Modale « Paramètres d'affichage »** : le `Header` react-dsfr la montait. `Display` de `@codegouvfr/react-dsfr/Display`
  est un composant **vide** (déprécié, `return null`) : il faut `@codegouvfr/react-dsfr/Display/Display` (le module que
  le `Header` importe ; même `fr-theme-modal` que `headerFooterDisplayItem` du pied de page). Un test le vérifie.
  **Chemin interne (pas d'API publique)** : à revérifier à chaque montée de version de react-dsfr (le module existe, exporte
  toujours `Display` et monte bien la modale).
- **Script DSFR `HeaderLinks`** (enregistré sur `.fr-header__tools-links`) lit `.fr-header__menu-links` sans vérifier sa
  présence : un `div.fr-header__menu-links` vide est gardé, caché (`hidden` ne suffit pas, règle CSS). Sans la classe
  `fr-header__menu fr-modal` de guichet : sous 62em le script DSFR active cette modale et écrit quatre avertissements
  « Modal - missing accessible name » dans la console.
- Au-dessus de la carte à toutes les largeurs : l'en-tête prend le `z-index` DSFR lg (`--ground + 750`) partout.
- **Largeur de la liste (M18)** : à partir de 62em, le DSFR fixe `.fr-menu__list { width: 20rem }` (navigation.css, lg). Avec le
  panneau de 18rem repris de guichet (dont la liste est un `fr-raw-list`, sans largeur), les liens débordaient de 2rem : sous
  « Services », jusqu'à 1296 px à 1280 px, avec défilement horizontal. `.header-menu__panel .fr-menu__list` prend `width: 100%`
  du panneau. `check:map` (M18) mesure les liens, pas seulement le panneau, et `scrollWidth <= innerWidth` menu ouvert, de
  320 à 1920 px.
- La question M-5 (contraste du bouton « Menu » au survol de la marque) disparaît sur la carto : `check:map` exige
  désormais 0 violation grave au survol aussi.

### 13.3 Mesures (aperçu local, Chromium sans interface)

| Largeur | En-tête avant | En-tête après | Carte avant → après (hauteur, fenêtre de 800–900 px) |
|---|---|---|---|
| 1280 | 117 px | 56 px | 624 → 684 px (fenêtre 800) |
| 768 | 169 px | 56 px | 647 → 759 px (fenêtre 900) |
| 375 | 165 px (outils dans le menu « Menu ») | 56 px (outils visibles) | 568 → 568 px (fenêtre 812 ; la page défilait de 45 px, plus maintenant) |

Une rangée sans débordement de 320 à 1280 px ; titre tronqué (ellipse) seulement à 320 px.

### 13.4 Sélecteurs e2e

| Élément | Sélecteur |
|---|---|
| En-tête | `header#en-tete.fr-header.fr-header--compact` ; plus de `#en-tete-menu-button`, de `.fr-header__navbar` ni de modale `.fr-header__menu` |
| Menus | `.fr-header__tools` puis `getByRole('button', { name: 'Aide' \| 'Services' })`, visibles à toutes les largeurs (sous 48em, nom accessible = libellé masqué visuellement) |
| Retour à l'accueil | clic sur `.fr-header__logo`, `.fr-header__operator` (≥ 36em) ou `.fr-header__service` → `/` |
| Slogan | absent de la carto |

`check:map` (bloc M17) : à 320, 375, 768, 1280 et 1920 px, en-tête ≤ 57 px sur une rangée sans débordement ni bouton « Menu »,
carte collée sous l'en-tête avec son canevas, « Aide » et « Services » visibles, panneau dans l'écran et au-dessus de la
carte, Échap ferme et rend le focus, clic sur la Marianne → `/`, console vide ; « Paramètres d'affichage » ouvre la
modale et passe en sombre ; axe sans violation grave « Services » ouvert (375 sombre, 1280 clair et sombre).

## 14. Géolocalisation sous « Avancée », couleurs de l'échelle (M19)

Demande du propriétaire : « la géolocalisation sous la recherche avancée, comme cartes.gouv.fr/explorer-les-cartes et
guichet-collaboratif ; l'échelle aux couleurs de cartes.gouv.fr, fond non transparent ». Plan `doc/plans/M19.md`.

### 14.1 Moteur de recherche : `SearchEngineAdvanced`

- **Références lues** : IGNF/cartes.gouv.fr-entree-carto `main` (`1f890d3`), `src/components/carte/control/SearchEngine.vue`
  (`SearchEngineAdvanced` + `InseeAdvancedSearch`, `LocationAdvancedSearch`, `CoordinateAdvancedSearch`, `ParcelAdvancedSearch`),
  options dans `src/components/carte/Controls.vue` (`searchEngineOptions`) ; IGNF/cartes.gouv.fr-guichet-collaboratif `develop`
  (`bd456e3`), `src/features/navigation/controls/ToolsControl.tsx` et `GuichetSearchEngineControl.ts` (classe dérivée de
  `SearchEngineAdvanced`, `CoordinateAdvancedSearch` seul selon la communauté). Aucune des deux n'utilise d'option de position
  ni de `target` pour la géolocalisation : c'est la structure du contrôle. Sources geopf lues (1.0.0-beta.16) :
  `Controls/SearchEngine/SearchEngineAdvanced.{js,d.ts}`, `SearchEngineBase.js`, `SearchEngineGeocodeIGN.js`,
  `CoordinateAdvancedSearch.js`, `InseeAdvancedSearch.js`, `LocationAdvancedSearch.js`, `ParcelAdvancedSearch.js`, `typedefs.js`,
  `Services/IGNSearchService.js`, `InseeSearchService.js`, `Search.js`, CSS `DSFRadvancedSearchEngineStyle.css`,
  `GPFadvancedSearchEngine.css` (importée par `AbstractAdvancedSearch.js`).
- **Structure** (`_initContainer`) : widget `GPsearchEngine-Advanced-<n>` qui contient la barre `GPsearchEngine-<n>`
  (`SearchEngineGeocodeIGN`, `options.target` = le widget) ; dans la barre, `.GPOptionsContainer` avec « Avancée »
  (`GPSearchEngine-advanced-btn-*`, `aria-label` « Afficher les options avancées » renommé ici, `aria-expanded`, `aria-controls`) et
  « Effacer la saisie » ; sous la barre, `.GPAdvancedContainer` dont le **premier enfant est « Me géolocaliser »**
  (`GPSearchEngine-locate`), puis un accordéon DSFR par formulaire. Un second « Me géolocaliser » est dans l'en-tête des
  suggestions (`.GPautoCompleteHeader`), affiché quand le champ a le focus. « Avancée » n'est ajouté que s'il y a au moins un
  formulaire (`_searchForms.length`). L'ancienne option `displayButtonGeolocate` (bouton `GPshowGeolocate-*` à côté de la
  barre) n'existe pas dans ce contrôle.
- **Mesures, cartes.gouv.fr** (Chromium sans interface, 1280×800, 2026-11-13) : barre 48 px de haut ; panneau collé sous la
  barre (`top` = bas de la barre) ; « Me géolocaliser » 153×32 px, à 12 px sous la barre et 12 px du bord gauche du panneau ;
  focus sur lui à l'ouverture (Entrée/clic sur « Avancée »). **Ici, après** : mêmes valeurs à 320, 375, 768 et 1280 px
  (panneau à 0 px sous la barre, bouton à 12/12 px), aucun bouton de la carte recouvert par la barre ni par le panneau.
- **Nom de « Avancée »** : geopf pose `aria-label` « Afficher les options avancées », qui ne contient pas le texte visible
  « Avancée » : axe `label-content-name-mismatch` (grave, RGAA 6.1 / WCAG 2.5.3) sur toutes les pages de `check:map`
  (premier passage, 9 échecs). `createSearchEngine` le renomme `CONTROL_LABELS.advancedSearch` « Recherche avancée »
  (même texte que son `title` geopf) par le champ public `advancedBtn`. Lacune amont, à ajouter au ticket du §5.7.
- **Choix** : `MAP_TOOLS_OPTIONS.search` = `placeholder`, `ariaLabel` (nomme le champ, qui n'a pas de `<label>` :
  `labelSearchInput` est retiré) ; `MAP_TOOLS_OPTIONS.coordinateSearch` = formulaire « Coordonnées » seul (systèmes de
  `MOUSE_POSITION_SYSTEMS`, enregistrés par le formulaire via `CRS.loadByName`). Les trois autres formulaires de cartes.gouv.fr
  appellent `geo.api.gouv.fr` / `apicarto.ign.fr`, écrits en dur en amont, hors GPF : question M-7. Pas de `serverUrl` : le
  géocodage garde les adresses GPF par défaut de geoportal-access-lib (`data.geopf.fr/geocodage/completion` et `/search`),
  et un `searchOptions.serviceOptions.serverUrl` passerait par `Search.setUrl`, qui fait un `eval` (§5.7).
- `loadSearchEngine()` charge `SearchEngineAdvanced` et `CoordinateAdvancedSearch` dans le morceau de la recherche ;
  `createSearchEngine(module)` (`src/hooks/useMapControls.ts`) les assemble. `DSFRadvancedSearchEngineStyle.css` est importée
  dans `geopf.ts` avec `DSFRsearchEngineStyle.css`.
- **CSS** (`MapView.css`) : les règles visent le widget extérieur `[id^='GPsearchEngine-Advanced-']` (un
  `[id^='GPsearchEngine-']` attrape aussi la barre intérieure). Même emplacement qu'avant : entre les colonnes sous 48em
  (`left: 3.5rem`, `width: calc(100% - 7rem)`), centrée au-dessus (largeur 420 px comme cartes.gouv.fr, bornée par les
  colonnes). Sous 36em, « Avancée » n'affiche que son chevron (`font-size: 0` ; nom « Recherche avancée » et `title` gardés), sinon
  le champ n'a plus de place à 320 px (0 px mesuré) ; il garde 102 px à 320 px, 155 px à 375 px. Les règles de M3 sur
  `GPsearchInputReset-` (bouton de l'ancien contrôle) sont retirées : l'effacement est `GPSearchEngine-erase-btn-*`, affiché
  par geopf quand le champ contient du texte (« Avancée » est alors masqué, comme sur cartes.gouv.fr).
- **Clavier** (comportement amont, identique à cartes.gouv.fr) : champ (rôle `combobox`), Tab → « Me géolocaliser » des
  suggestions, Tab → « Avancée », Entrée → focus sur « Me géolocaliser » du panneau, Tab → « Coordonnées ». Échap ne ferme
  pas le panneau (un clic ou le focus hors du panneau le ferme) : limite amont, à ajouter au ticket du §5.7. Le clic sur
  « Me géolocaliser » pose un repère « Ma localisation » (popup `GPSearchPopup`, boutons « Fermer », « Supprimer ») et
  centre la carte ; le panneau reste ouvert.
- **Console** : `SearchEngineAdvanced` ajoute une interaction `Select` sur sa couche de repères. Au premier clic sur la carte,
  sa détection d'objets lance le banc d'essai des lectures de canevas d'OpenLayers 10.11 (`benchmarkCanvasReads`,
  `render/canvas/ExecutorGroup.js`, contextes sans `willReadFrequently` exprès) : Chrome écrit **une fois par page**
  « Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to
  true ». Même avertissement sur cartes.gouv.fr (mesuré : 0 avant, 1 après six clics, ici comme là-bas). Bruit amont :
  `check:map` le compte dans les notes (`OL_CANVAS_BENCHMARK_WARNING`) au lieu d'échouer.
- **Tests** : `src/map/searchEngine.test.ts` monte le vrai `SearchEngineAdvanced` dans jsdom (géolocalisation en tête du
  panneau, « Avancée » dans la barre, focus à l'ouverture) ; jsdom n'a pas `innerText`, que geopf utilise pour les textes des
  boutons : textes vérifiés par `check:map`. À relancer à chaque montée de version de geopf.

### 14.2 Échelle

- **Référence** : `src/components/carte/control/ScaleLine.vue` de l'entrée carto (même commit) :
  `.ol-scale-line { background: var(--background-default-grey) }` et, en sombre seulement,
  `html[data-fr-theme="dark"] .ol-scale-line-inner { color/border-color: var(--text-action-high-blue-france) }` ; en clair,
  les valeurs par défaut d'OpenLayers (`#333`, trait `#666`). Lecture du propriétaire confirmée : fond opaque.

  | Mesure (styles calculés) | cartes.gouv.fr clair | ici avant | ici après | cartes.gouv.fr sombre | ici avant | ici après |
  |---|---|---|---|---|---|---|
  | Fond `.ol-scale-line` | `rgb(255,255,255)` | blanc à 80 % | `rgb(255,255,255)` | `rgb(22,22,22)` | `#161616` à 80 % | `rgb(22,22,22)` |
  | Texte | `rgb(51,51,51)` | `rgb(0,0,145)` | `rgb(58,58,58)` (`--text-default-grey`, le plus proche) | `rgb(133,133,246)` | idem | `rgb(133,133,246)` |
  | Trait | `rgb(102,102,102)` | `rgb(0,0,145)` | `rgb(102,102,102)` (`--text-mention-grey`) | `rgb(133,133,246)` | idem | `rgb(133,133,246)` |

  Marges, rayon, position identiques (`padding: 2px`, `border-radius: 4px`, `right: 64px`, `bottom: 8px`). Contraste du texte
  sur le fond (WCAG, calculé par `check:map`) : 11,4:1 en clair, 5,8:1 en sombre.

### 14.3 Vérification et sélecteurs e2e

`check:map` (bloc M19, 320/375/768/1280 px) : plus de `GPshowGeolocate-*`, aucun « Me géolocaliser » visible au repos, parcours
clavier ci-dessus, « Me géolocaliser » premier enfant du panneau, 0–2 px sous la barre, 0–16 px du bord, au premier plan
(`elementFromPoint`), aucun bouton visible des colonnes recouvert (les panneaux geopf fermés gardent un « Fermer » en
`visibility: hidden`, ignoré), champ ≥ 96 px, Entrée → repère « Ma localisation » (position
accordée et simulée), axe sans violation grave panneau ouvert (375 et 1280 px), console vide ; bloc des thèmes : fond, texte et
trait de l'échelle = jetons ci-dessus, contraste ≥ 4,5:1. Captures `doc/screenshots/M19/`.

| Élément | Sélecteur |
|---|---|
| Recherche | widget `[id^="GPsearchEngine-Advanced-"]` ; champ `getByRole('combobox', { name: 'Rechercher un lieu ou une adresse' })` (plus `textbox`) |
| « Avancée » | `getByRole('button', { name: 'Recherche avancée' })` (`CONTROL_LABELS.advancedSearch`), `aria-expanded` ; panneau `.GPAdvancedContainer` |
| Géolocalisation | `.GPAdvancedContainer > .GPSearchEngine-locate` (« Me géolocaliser », premier enfant) ; celui des suggestions `.GPautoCompleteHeader .GPSearchEngine-locate` ; repère : `.GPSearchPopup .GPPopupContent` « Ma localisation » |
| Supprimé | `[id^="GPshowGeolocate-"]` (« Activer la géolocalisation »), `[id^="GPsearchInputReset-"]` |

**Impact sur la suite e2e** (`e2e/`, hors de la brique) : le test « plein écran en bas à droite, échelle à sa gauche en bleu
action (clair) » de `e2e/tests/03-carto.spec.ts` attend `--text-action-high-blue-france` pour le texte de l'échelle en thème
clair : il faut désormais `--text-default-grey` en clair (trait `--text-mention-grey`), `--text-action-high-blue-france` en
sombre, et un fond `--background-default-grey` opaque. Aucun test e2e ne vise la recherche ni la géolocalisation (relevé du
2026-11-13).

## 15. Pied de page replié sur une ligne (M21)

- **Constat** (`check:map` sur `main`) : entre 1024 et 1199 px, le pied de page replié mesurait 85 px au lieu de 60. « Paramètres
  d'affichage » passait à la ligne et prenait 25 px à la carte. Depuis #94 les six entrées bas (cinq liens et « Paramètres d'affichage ») demandent 975 px avec l'espacement
  DSFR md (`.fr-footer__bottom-item` : `margin-left` et `::before` `margin-right` à 0.75rem). À 1024 px, la barre en offre 976,
  dont 141 pour « Haut de page » (125 px) et sa marge : il en manquait 140. À 1100 px il en manquait 64 ; à partir de 1199 px
  tout tenait.
- **Référence** : `CgfrFooter.vue` (IGNF/cartes.gouv.fr-vue-components `3ae3f94`), replié dans l'entrée carto
  (`src/views/Main.vue`, `compact`).
  - Le bouton replié est en icône seule (`icon-only`, `aria-label` et `title` « Plus d'informations », 40×40, en
    `position: absolute` dans un `padding-right: 4rem`).
  - Le pied de page a une hauteur fixe (`height: 3.5rem`) et l'espacement DSFR md.
  - Mesuré en ligne le 2026-11-13 : une ligne de 1100 à 1280 px. **À 1024 px, cartes.gouv.fr passe aussi à la ligne** :
    « Paramètres d'affichage » est rogné sous la barre de 56 px (capture `doc/screenshots/M21/reference-pied-de-page-1024.png`).
- **Correctif** (`SiteFooter.css`, pied de page replié, de 62em à 74.99em seulement) :
  - « Haut de page » en icône seule, comme la référence. Le texte est gardé (`font-size: 0`), donc le nom accessible est
    inchangé. `title` vaut le libellé (`SiteFooter.tsx`), comme pour un bouton icône seule DSFR. Le bouton fait 46 px.
  - Les liens prennent l'espacement DSFR des petits écrans (0.25rem au lieu de 0.75rem autour des séparateurs).
  - Aucun lien n'est retiré ni masqué ; la taille de texte DSFR (0.75rem) est inchangée.
- **Mesures après** :
  - Une ligne de 60 px de 1000 à 1440 px ; la carte passe de 659 à 684 px entre 1024 et 1199 px (fenêtre de 800 px).
  - Inchangé à 320, 375 et 768 px (177, 152 et 96 px, libellé visible), à partir de 1200 px, et déplié.
  - Entre 992 et 999 px, la barre fait toujours deux lignes (il manque quelques pixels), comme avant.
- **`check:map`** :
  - Le bloc M7 (pied de page ≤ 64 px collé à la carte, pas de défilement) passe à 1024, 1100, 1199, 1280 et 1440 px.
  - Bloc M21, de 320 à 1440 px. Toutes largeurs : six entrées nommées (cinq liens et « Paramètres d'affichage »), `title`, libellé visible hors de 62–75em, pas de
    défilement horizontal. À partir de 1024 px : ≤ 60 px, une seule ligne, bouton dans la barre, liens dans l'écran. Déplié
    à 768, 1024 et 1280 px : « Fermer » avec son libellé, espacement 0.75rem.
  - Revue M19 : l'avertissement « willReadFrequently » de la mesure du canevas d'OpenLayers n'est toléré qu'**une fois par
    page** ; au-delà, `watchConsole` échoue.

