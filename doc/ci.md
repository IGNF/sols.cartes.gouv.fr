# Intégration continue

Quatre workflows GitHub Actions, filtrés par chemin pour ne lancer que ce qui est touché ; tous se déclenchent aussi sur `packages/**` (paquet partagé `@sols/brand`). Les versions d'outils viennent de `.bun-version` (bun) et `.nvmrc` (Node), lues par `bun-version-file` et `node-version-file`.

| Workflow | Déclencheurs (`paths`) | Étapes |
|---|---|---|
| `ci-root.yml` | `scripts/**`, `e2e/**`, `package.json`, `bun.lock`, `.bun-version`, le workflow | prettier, `tsc --strict` sur `scripts/`, `build-all --skip-build` |
| `ci-edito.yml` | `apps/accueil/**`, `package.json`, `bun.lock`, `.bun-version`, le workflow | `bun run --if-present lint`, `test`, `build` dans `apps/accueil` |
| `ci-carto.yml` | `apps/explorer-les-cartes/**`, `package.json`, `bun.lock`, `.bun-version`, le workflow | `bun run --if-present lint`, `typecheck`, `test`, `build` dans `apps/explorer-les-cartes` |
| `ci-catalogue.yml` | `apps/rechercher-une-donnee/**`, `doc/agents/edito.md` (source de l'en-tête/pied de page injectés au build), `.nvmrc`, le workflow | `npm ci`, `lint`, `test` (si présents), `build` ; toutes les étapes sont sautées tant que `apps/rechercher-une-donnee/package-lock.json` n'existe pas |

Les briques bun partagent le lockfile racine, donc une PR qui modifie `bun.lock` relance les deux workflows bun. `bun run --if-present` évite un échec quand une brique n'expose pas encore `lint`, `typecheck` ou `build` (même sémantique que `scripts/run-all.ts`). L'étape `test` est protégée explicitement par un `jq -e '.scripts.test' package.json` : sans script `test`, bun retombe sur le binaire `/usr/bin/test` du PATH et sort en erreur, `--if-present` ne suffit donc pas. Ne pas « simplifier » cette étape.

Chaque workflow a un `timeout-minutes` et un bloc `concurrency` (un seul run par workflow et par ref ; les runs précédents ne sont annulés que sur `pull_request`, pour que chaque commit de `main` garde une conclusion).

Les fichiers Markdown sont exclus de `prettier --check .` (`.prettierignore`) ; `bun run format:docs` / `format:docs:check` les formatent explicitement (`doc/**/*.md` et les `*.md` racine) sans être imposés en CI pour l'instant.

Les workflows tournent sur `pull_request` et sur `push` vers `main`.

## Prévisualisation GitHub Pages (`SITE_BASE`)

`deploy-pages.yml` publie le site complet sur <https://ignf.github.io/sols.cartes.gouv.fr/> (site de projet, donc sous le préfixe `/sols.cartes.gouv.fr/`). Déclencheurs : `push` sur la branche `feat/gh-pages-deploy` et `workflow_dispatch` ; l'environnement Pages (source « GitHub Actions ») se configure dans les réglages du dépôt. Étapes : bun + Node, `bun install`, `SITE_BASE=/sols.cartes.gouv.fr/ bun run build:all`, puis `configure-pages`, `upload-pages-artifact` (`dist/`) et `deploy-pages`.

La variable d'environnement `SITE_BASE` (défaut `/`, normalisée pour commencer et finir par `/`) est lue à un seul endroit, `scripts/site-base.mjs`, par toutes les briques ; avec la valeur par défaut, dev, `preview:all` et la production ne changent pas :

- edito : `pathPrefix` + `HtmlBasePlugin` d'Eleventy (href, src et meta refresh du HTML produit) ; les pictogrammes SVG (`<use href>`) passent par le filtre `htmlBaseUrl` ;
- carto : `base` Vite = `${SITE_BASE}explorer-les-cartes/`, et les chemins absolus de `@sols/brand/brand.json` sont préfixés au build (plugin de `vite.config.ts`) ;
- catalogue : `upstream.json` et le patch 0002 gardent `/rechercher-une-donnee/` ; sous un autre préfixe, `scripts/build.mjs` passe `--base-href`, et `prepare.mjs` préfixe les chemins de l'en-tête/pied de page générés et de la copie de `config/default.toml` ;
- `build-all` ajoute `404.html` (redirige les chemins du catalogue et de la carto vers l'entrée de la brique, sinon message « Page non trouvée ») et `.nojekyll` à la racine de `dist/`, uniquement quand `SITE_BASE` n'est pas `/`. La structure de `dist/` ne change pas.

Limite : GitHub Pages n'a pas de repli SPA ; un lien profond du catalogue (`/rechercher-une-donnee/dataset/<id>`) ouvert directement aboutit à l'accueil du catalogue.

## Points d'attention

- `main` n'a pas encore de règle de protection. Le jour où des checks deviennent obligatoires, un workflow filtré par chemin qui ne se déclenche pas reste « pending » : prévoir un job jumeau en `paths-ignore` ou un workflow unique avec `dorny/paths-filter`.
- `.github/labeler.yml` n'est consommé par aucun workflow ; son format (listes de globs) correspond à `actions/labeler` v4 et devra être réécrit (`changed-files` / `any-glob-to-any-file`) si un labeler v5 est ajouté.

## Vérifier localement

```bash
actionlint   # https://github.com/rhysd/actionlint
```

## Vérification X3 (2026-11-05)

`bun run build:all` sur `main` (5d76437) : edito (Eleventy, 24 fichiers), catalogue (clone v1.6.2 + `npm ci` + `nx build datahub`), carto (Vite) en 1 min 22 s ; `dist/` pèse 20 Mo. `bun run preview:all` (port 8080) répond 200 sur `/`, `/fr/`, `/mentions-legales/` (reroutage), `/rechercher-une-donnee/`, `/rechercher-une-donnee/search` (repli SPA), `/rechercher-une-donnee/assets/configuration/default.toml`, `/explorer-les-cartes/`, `/explorer-les-cartes/x` (repli SPA), `/sitemap.xml`. Attention : un autre serveur `preview-all` lancé depuis un worktree occupe parfois le port 8080 ; utiliser `PORT=<autre>` pour tester en parallèle.
