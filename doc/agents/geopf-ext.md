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

## 5. geopf-extensions-openlayers

À compléter en M2 (version installée, imports compatibles Vite, CSS à charger, pièges).
