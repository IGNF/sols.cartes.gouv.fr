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
| `src/hooks/useMapControls.ts`                       | zoom, plein écran, attributions geopf + échelle OL dans un effet ; `SearchEngine` chargé à la demande puis ajouté si la carte est toujours montée  |
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
| Zoom                        | `GeoportalZoom` (étend `ol/control/Zoom`)               | `position: 'top-left'` ; libellés « Zoomer »/« Dézoomer » posés par geopf (`aria-label`)                                                                                                          |
| Plein écran                 | `GeoportalFullScreen` (étend `ol/control/FullScreen`)   | `position`, `tipLabel`                                                                                                                                                                            |
| Attributions                | `GeoportalAttribution` (étend `ol/control/Attribution`) | `collapsible`, `collapsed`, `tipLabel` ; sans `Gp.Config`, affiche les `attributions` de la source OL (`GPF_ATTRIBUTION`) ; retire l'attribution OL par défaut                                    |
| Échelle                     | `ol/control/ScaleLine`                                  | geopf-ext n'en fournit pas ; `units: 'metric'`                                                                                                                                                    |
| Recherche + géolocalisation | `SearchEngine`                                          | `collapsed: false`, `placeholder`, `displayButtonGeolocate: true`, `displayButtonAdvancedSearch: false`, `displayButtonCoordinateSearch: false`, `resources: { search: false }`, `zoomTo: 'auto'` |
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
  Mesure du 2026-11-05 : instructions 97,0 %, branches 87,8 %, fonctions 99,0 %, lignes 98,6 % (`src/**` et `scripts/sols-layers/**`,
  hors `main.tsx` et tests).
- `bun run check:map` (Playwright, aperçu `PORT=8101 bun run preview:all`) : disposition et noms à 375/768/1280 px, couche sols au
  clavier, liens `l=` et alias, clavier, vue liste (55 vérifications). Robustesse face à la GPF : attente de `load` puis
  d'éléments précis (jamais `networkidle`), assertions des liens profonds par attente (jusqu'à 20 s, la vérification en direct des
  capacités peut être lente), erreurs de tuiles GPF tolérées jusqu'à 10 % des requêtes de tuiles (comme la suite e2e, M-2) et
  signalées en note ; toute autre erreur console fait échouer.
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

| Élément                     | Sélecteur conseillé                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carte                       | `getByRole('region', { name: 'Carte interactive des données sols' })`, canvas `.map-view canvas`                                                                                                                                                                                                                                                                 |
| Bouton du panneau latéral   | dans la barre d'outils au-dessus de la carte (M7) : `getByRole('button', { name: 'Masquer le panneau' })` / `'Afficher le panneau'` (`aria-controls="panneau-lateral"`). **Depuis M6 : panneau ouvert par défaut à partir de 48em (DSFR `md`), fermé en dessous** (projet mobile 375 px de l'e2e : cliquer « Afficher le panneau » avant d'utiliser les onglets) |
| Onglets                     | `getByRole('tab', { name: 'Fonds de carte' })`, `getByRole('tab', { name: 'Données sols' })`                                                                                                                                                                                                                                                                     |
| Fond orthophotos            | radio de libellé « Photographies aériennes » : cliquer le `label` (`label` avec texte exact), le libellé DSFR recouvre l'`input` ; « Plan IGN » coché par défaut                                                                                                                                                                                                 |
| Ajouter une couche sols     | `getByRole('button', { name: /^Ajouter à la carte\s*: <titre de la donnée>$/ })` (le nom calculé peut être « …carte: titre »)                                                                                                                                                                                                                                    |
| Gestionnaire de couches     | `getByRole('button', { name: 'Ma sélection de cartes' })` ; titres des couches `[id^="GPtitle_ID_"]`                                                                                                                                                                                                                                                             |
| Lien profond qui fonctionne | `?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` (alias : `?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v`) ; éviter `rrp_loiret_*` (M-4)                                                                                                                                                              |
| Avis du lien                | `getByRole('alert')` « Couche introuvable », « Lien invalide », « Couche indisponible » ; `getByRole('status')` « Format non pris en charge »                                                                                                                                                                                                                    |
| Vue liste                   | `?vue=liste`, `getByRole('heading', { level: 1, name: 'Liste des données sols' })`, `getByRole('article')` (7)                                                                                                                                                                                                                                                   |
| Lien vers la vue liste      | `getByRole('link', { name: 'Version accessible de la liste des données' })`                                                                                                                                                                                                                                                                                      |
| Recherche                   | `getByRole('textbox', { name: 'Rechercher un lieu ou une adresse' })`                                                                                                                                                                                                                                                                                            |
| Contrôles                   | « Zoomer », « Dézoomer », « Plein écran », « Sources des données », « Réinitialiser l'orientation » (masqué tant que la carte n'est pas tournée)                                                                                                                                                                                                                 |

Attendre `load` puis un délai plutôt que `networkidle` : une requête GPF lente peut retarder l'inactivité réseau de plus de 30 s.

## 8. Correctifs M6 (2026-11-05)

### 8.1 D-carto-1 : carte sans canvas

- Cause, mesurée : la requête GetCapabilities WMTS de la GPF est parfois acceptée puis **jamais servie** (ni en-têtes, ni erreur).
  Dans le navigateur, 3 à 4 chargements sur 20 restaient sans fond, donc sans canvas (OpenLayers ne crée le canvas qu'au rendu d'une
  couche) et sans entrée dans « Ma sélection de cartes », indéfiniment ; avec `curl`, 5 requêtes sur 25 sans réponse au bout de 12 s,
  les autres en 0,15 à 0,23 s. TanStack Query ne réessayait pas : la requête n'échouait jamais. Les liens profonds WMS semblaient
  épargnés parce que la couche sols dessine un canvas même sans fond.
- Correctif : `src/map/fetchWithTimeout.ts` abandonne une requête sans en-têtes de réponse au bout de `GPF_REQUEST_TIMEOUT_MS` (3 s ;
  le téléchargement du corps n'est pas limité, un réseau lent n'est pas pénalisé), puis `GPF_REQUEST_RETRIES` (4) nouveaux essais
  espacés de 300 ms, pour les capacités WMTS et WMS. Pire cas ≈ 16 s, alerte « n'ont pas pu être chargés » ensuite.
- Vérifié : 0 chargement sans canvas sur 40 (bureau) ; les chargements où le premier essai bloquait obtiennent le canvas en 4 à 6 s.
  `bun run check:map` charge la page 20 fois dans des contextes neufs et exige un canvas à chaque fois (attente 20 s).

### 8.2 Panneau latéral sur mobile

- `initialPanelOpen` (store) : ouvert si `matchMedia('(min-width: 48em)')` (DSFR `md`), fermé sinon ; ouvert sans `matchMedia`.
  À 375 px, la carte commence au-dessus du pli (y ≈ 490 px), « Afficher le panneau » reste avant la carte ; clavier inchangé.
- Impact e2e (projet mobile) : ouvrir le panneau avant de cibler les onglets « Fonds de carte » / « Données sols ».

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

Haut gauche : zoom, plein écran (M3), import, interrogation ; haut droite : gestionnaire de couches, « Mes outils », puis les neuf outils
listables ; bas gauche (geopf **prépose** les widgets du bas : le dernier ajouté est en haut) : mini-carte, territoires, légendes. L'échelle
OL passe à `left: 3.5rem` (`MapView.css`). Sous 48em, les boutons des outils listables sont masqués (`.map-tool--listable > .gpf-btn-icon`) ;
ils s'ouvrent depuis « Mes outils » (le panneau occupe la largeur de la carte, CSS mobile de geopf) et, la liste se vidant à la sélection,
le focus revient au bouton « Mes outils » (`returnFocusOnCollapse`). Le panneau d'un outil de droite s'ouvre à gauche de sa colonne, en haut ;
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
   « Retirer le territoire : <titre> ». Bouton de `ControlList` nommé « Afficher plus » : renommé.
7. Les `<li>` de « Mes outils » ont `role="button"` et `tabindex="0"` (Entrée/Espace gérés), pas de `aria-pressed` : rôle interdit sur un
   `li` (axe `aria-allowed-role`) et `<ul>` sans élément de liste (axe `list`, sérieux). `fixToolButtons` en fait un menu (`ul`
   `role="menu"`, `li` `role="menuitem"`, rôles autorisés ; les éléments sont recréés à chaque ouverture, d'où l'observateur) et
   `menuKeyboard` (`useMapTools.ts`) applique le motif « menu button » : une seule entrée tabulable (première entrée focalisée à
   l'ouverture), flèches haut/bas en boucle, Début/Fin, Échap ferme la liste ; Entrée/Espace restent au contrôle (action par défaut
   empêchée). L'activation d'une entrée se fait au `keydown` et vide la liste : le retour du focus au bouton « Mes outils »
   (`returnFocusOnCollapse`) est **différé d'une tâche**, sinon Entrée active le bouton nouvellement focalisé dans le même évènement et
   rouvre la liste (observé à 375px : le panneau choisi s'ouvrait derrière la liste pleine largeur). Patch amont à signaler ; `check:map`
   passe axe-core (jeu de règles par défaut, comme la suite e2e) avec « Mes outils » ouvert et rejoue l'activation au clavier à 375px.
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
| « Mes outils »      | `getByRole('button', { name: 'Mes outils', exact: true })`, entrées `[id^="GPcontrolListPanel-"] li`                                                                  |
| Partager / Imprimer | boutons `Partager`, `Imprimer` de la barre d'outils ; champ `getByRole('textbox', { name: /^Lien permanent/ })` ; boutons `Télécharger en PNG`, `Lancer l’impression` |
| Panneaux            | `[id^="GProutePanel-"]`, `[id^="GPisochronPanel-"]`, `[id^="GPgetFeatureInfoPanel-"]`, `[id^="GPlegendsPanel-"]`…                                                     |

## 11. Catalogue des données sols (M9, 2026-11-05)

Référence : `IGNF/cartes.gouv.fr-entree-carto` (`src/components/carte/control/CatalogManager.vue`, options `useControlsOptions().catalog`
dans `src/composables/controls.js`) ; plan `doc/plans/M9.md`.

### 11.1 Choix

- **Contrôle geopf `Catalog`** (et non un panneau DSFR maison) : même widget que l'entrée carto, `addToMap: false` comme elle (c'est
  l'application qui ajoute les couches à partir des évènements `catalog:layer:add` / `catalog:layer:remove`, payload `{ name, service }`),
  `auto: true` (le contrôle coche les entrées des couches déjà sur la carte en lisant les propriétés **propres** `name` et `service` des
  couches OL : `attachLayerInfo` les pose, `service` = `WMS` ou `WMTS`).
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
`tabHeightAuto: false`, `addToMap: false`, `auto: true`, `optimisation: 'none'`, `search: { display, label, criteria: ['title',
'description', 'producer', 'name'] }` (sous-chaîne normalisée, sans accents), `categories: [{ title: 'Données sols', id: 'sols',
producer: true, order: true, filter: null }]` (le type `Categories` déclare `field`, `value`, `clusterOptions` obligatoires : cast).
Bouton « Catalogue de cartes » renommé « Catalogue des données sols » (`labelToggleButton`), bouton primaire (`.map-catalog`, comme
l'entrée carto). Chargé à la demande (`loadCatalog`, feuille `geopfCatalogStyles.ts`).

### 11.3 Contournements amont (à ajouter au ticket du §5.7)

10. `createCatalogProducerLinks` construit les étiquettes de producteur vers `https://cartes.gouv.fr/catalogue/search?organization=…`
    pendant le chargement de la configuration (constructeur) et la méthode est déclarée **privée** dans le `.d.ts` : patchée sur le
    prototype avant construction (`useCatalog.createCatalog`) pour pointer vers `/rechercher-une-donnee/search?organization=…`.
11. Balisage du panneau (`CatalogDOM`) : l'attribut `role` sert de crochet JavaScript (`tabbutton`, `label-collapse-more-<cat>`,
    `button-collapse-more-<cat>`, `section-…`), rôles ARIA invalides (axe `aria-roles`, `aria-required-children` sur la liste d'onglets,
    `aria-allowed-attr` pour `aria-selected`) ; liste d'onglets nommée « presentation » ; `<h5>` vide quand `titleSecondary` est vide ;
    case à cocher sans nom (`<label for>` vide, le titre est un autre `<label>` avec `aria-controls`). `fixCatalogMarkup` et
    `fixToolButtons` (`src/map/labelToolButtons.ts`, observateur de mutations sur le widget) : `role="tab"`, crochets retirés (ils ne sont lus
    qu'à la construction du panneau), `aria-label` « Catégories du catalogue », `<h5>` vide retiré, `aria-label` « Ajouter à la carte :
    <titre> » sur chaque case. axe : 0 violation catalogue ouvert (`check:map`).
12. Le `<label for>` vide recouvre la case : au clic souris c'est le label qui reçoit l'évènement (il coche la case) ; au clavier, Espace.
13. Sous 576px geopf garde `min-width: 450px` sur le panneau (`DSFRcatalogStyle.css`) : `MapView.css` force `100vw` (le panneau est ancré
    à droite de l'écran, `right: -4px`).

### 11.4 Sélecteurs e2e

| Élément | Sélecteur |
|---|---|
| Bouton du catalogue | `getByRole('button', { name: 'Catalogue des données sols', exact: true })` (`aria-pressed`) |
| Panneau | `[id^="GPcatalogPanel-"]` (nommé « Catalogue des données sols ») ; recherche `#catalog-input-search-global` |
| Entrée | `[data-layeritem]` ; case `input[data-layer="<nom>:<WMS|WMTS>"]` nommée « Ajouter à la carte : <titre> » (Espace au clavier) ; vignette `img` ; « Voir la fiche détaillée » `a.fr-link` ; producteur `a.fr-tag` |
| Données sols | plus d'onglet : les couches s'ajoutent depuis le catalogue ; la liste complète reste en `?vue=liste` |
