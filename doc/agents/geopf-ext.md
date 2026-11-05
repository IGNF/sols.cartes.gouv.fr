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

## 5. geopf-extensions-openlayers (M2, 2026-11-05)

### 5.1 Versions et sources lues

| Paquet | Version | Remarque |
|---|---|---|
| `geopf-extensions-openlayers` | 1.0.0-beta.16 (tag `1.0.0-beta.16`) | dépend de `ol ^10.8`, `@gouvfr/dsfr 1.14.4`, `geoportal-access-lib 3.4.7` ; pair `@panoramax/web-viewer` (non installé) |
| `ol` | 10.11.0 | |
| `zustand` / `@tanstack/react-query` | 5.0 / 5.106 | |

Lu dans `node_modules/geopf-extensions-openlayers` : `README.md`, `DOCUMENTATION.md` (identique à celui du tag), `src/index.d.ts`,
`src/packages/Layers/LayerWMTS.{js,d.ts}`, `src/packages/Utils/Config.js`, `src/packages/Controls/LayerSwitcher/LayerSwitcher.{js,d.ts}`,
`src/packages/Controls/Control.js`, la démo `demos/react-project` du tag. JSDoc : https://ignf.github.io/geopf-extensions-openlayers/jsdoc/
(la page n'affiche pas de numéro de version ; se fier aux `.d.ts` installés). Intégration React de référence :
IGNF/cartes.gouv.fr-guichet-collaboratif, branche `develop` (`src/features/navigation/MainMap.tsx`, `controls/layerSwitcherControl.ts`,
`src/hooks/navigation/useGpConfig.ts`, `layers/useGetWMTSLayer.tsx`, `capabilities/useGetCapabilitiesWMTS.ts`).

### 5.2 Imports qui marchent avec Vite

- Le paquet n'a pas de champ `exports` : les **imports profonds** fonctionnent et ont des types (`.d.ts` à côté de chaque `.js`).
  `import LayerSwitcher from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';`
  (type d'options : `LayerSwitcherOptions` exporté du même module).
- **Fragilité** : ces chemins (`src/packages/...`) ne sont pas une API publique et peuvent changer d'une version bêta à l'autre.
  La version est donc **épinglée exactement** dans `apps/explorer-les-cartes/package.json` (`"geopf-extensions-openlayers": "1.0.0-beta.16"`,
  sans `^` ni `~`). Toute montée de version : vérifier chaque import profond, les `.d.ts` utilisés et relancer tests + contrôle Playwright.
- **Ne pas importer l'index racine** (`from 'geopf-extensions-openlayers'`) : il réexporte le contrôle `Panoramax`, qui importe
  `@panoramax/web-viewer` (dépendance pair non installée) et tire tous les widgets.
- Chaque contrôle importe son propre CSS (`import "../../CSS/Controls/.../*.css"`) : Vite le gère sans configuration.
- La carte (OpenLayers + geopf-ext) est chargée en différé (`React.lazy` dans `App.tsx`) : morceau `MapView-*.js` ~670 kB
  (193 kB gzip), `chunkSizeWarningLimit` relevé à 1000 kB dans `vite.config.ts`.

### 5.3 CSS

- `ol/ol.css` puis `geopf-extensions-openlayers/css/Dsfr.css` (thème DSFR des widgets, 332 kB ; il **suppose le DSFR déjà chargé**,
  fourni ici par react-dsfr 1.14.2 ; ne pas charger `@gouvfr/dsfr` 1.14.4 en plus). `css/Classic.css` est le thème non-DSFR : inutile.
- Importés dans `src/components/map/MapView.tsx`, donc dans le morceau différé.

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
- À revoir si un widget qui dépend de `Gp.Config` (moteur de recherche, etc.) est ajouté en M3.

### 5.5 Architecture React (style guichet-collaboratif)

| Élément | Rôle |
|---|---|
| `src/store/useMapStore.ts` (Zustand) | état client : instance `map`, `activeBaseLayerId`, `isPanelOpen` |
| `src/hooks/useWmtsCapabilities.ts` (TanStack Query) | état serveur : capacités WMTS GPF, jamais recopiées dans le store |
| `src/hooks/useMap.ts` | crée **une** carte dans un effet, la publie dans le store, `setTarget(undefined)` + `dispose()` au démontage (couvre le double montage StrictMode) |
| `src/hooks/useBaseLayer.ts` | `useMemo` crée la couche depuis les capacités, l'effet l'insère en position 0 et la retire au nettoyage |
| `src/hooks/useLayerSwitcher.ts` | ajoute le `LayerSwitcher` dans un effet, `removeControl` au nettoyage |
| `src/config/map.ts` | fonds (`BASE_LAYERS`), vue initiale, options du `LayerSwitcher` et des contrôles OL, libellés |

L'état OpenLayers (vue, visibilité, opacité, ordre) reste dans les objets OL : pas de copie dans React.

### 5.6 LayerSwitcher : options et comportement

- Signature : `new LayerSwitcher({ layers?: LayerSwitcherLayersConfig[], options?: LayerSwitcherOptions })`.
- Options utilisées (vérifiées dans `LayerSwitcher.d.ts`) : `position: 'top-right'`, `collapsed: true`, `panel: true`,
  `counter: true`, `allowDelete: false`, `allowEdit: false`.
- Dans `setMap`, le contrôle ajoute les couches déjà présentes puis **écoute `map.getLayers()` (`add`/`remove`)** : ajouter ou
  retirer une couche de la carte suffit, inutile d'appeler `addLayer`. Libellé et description lus dans les propriétés OL
  `title` et `description` (réactives via `layer.set`).

### 5.7 Pièges

- Les fenêtres du `LayerSwitcher` (`dialog.fr-modal` `GPlayersList-*`, `GPlayerInfoPanel-*`, `GPlayerStylePanel-*`) n'ont pas de nom
  accessible ; le JS du DSFR l'écrit en avertissement console (`Modal #... missing accessible name`). Contournement :
  `labelSwitcherDialogs` pose un `aria-label` sur `control.element` **avant** `map.addControl` (libellés dans `src/config/map.ts`).
- Les conteneurs de position des widgets ont des id globaux (`position-container-top-right`...) : **une seule carte geopf-ext par page**.
- Les contrôles OL par défaut sont en anglais : libellés français passés à `defaults(...)` (`zoomOptions`, `rotateOptions`, `attributionOptions`).
- Clavier : le conteneur de carte a `tabIndex=0` (interactions clavier OL : flèches, `+`/`-`) ; règle jsx-a11y
  `no-noninteractive-tabindex` autorisée pour le rôle `region`. Le bouton du gestionnaire de couches s'atteint en 3 Tab depuis la carte
  et s'ouvre avec Entrée.
- GPF WMTS : réponses `400 Layer GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2 unknown` intermittentes sur des `GetTile` valides (environ 3 %, reproduit en `curl`) ; tuile vide et « Failed to load resource » en console. Côté serveur, voir `QUESTIONS.md` M-2.
- `ol/format/WMTSCapabilities.read` renvoie un objet même pour un document invalide : `parseWmtsCapabilities` exige `Contents`.
- Tests : `ol/Map` et le module `LayerSwitcher` sont simulés (`vi.mock`) ; `createWmtsLayer` et le parseur utilisent un extrait réel
  des capacités (`src/test/fixtures/wmts-capabilities.xml`, importé avec `?raw`).
