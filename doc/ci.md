# Intégration continue

Quatre workflows GitHub Actions, filtrés par chemin pour ne lancer que ce qui est touché. Les versions d'outils viennent de `.bun-version` (bun) et `.nvmrc` (Node), lues par `bun-version-file` et `node-version-file`.

| Workflow | Déclencheurs (`paths`) | Étapes |
|---|---|---|
| `ci-root.yml` | `scripts/**`, `package.json`, `bun.lock`, `.bun-version`, le workflow | prettier, `tsc --strict` sur `scripts/`, `build-all --skip-build` |
| `ci-edito.yml` | `apps/accueil/**`, `package.json`, `bun.lock`, `.bun-version`, le workflow | `bun run --if-present lint`, `test`, `build` dans `apps/accueil` |
| `ci-carto.yml` | `apps/explorer-les-cartes/**`, `package.json`, `bun.lock`, `.bun-version`, le workflow | `bun run --if-present lint`, `typecheck`, `test`, `build` dans `apps/explorer-les-cartes` |
| `ci-catalogue.yml` | `apps/rechercher-une-donnee/**`, `.nvmrc`, le workflow | `npm ci`, `lint`, `test` (si présents), `build` ; toutes les étapes sont sautées tant que `apps/rechercher-une-donnee/package-lock.json` n'existe pas |

Les briques bun partagent le lockfile racine, donc une PR qui modifie `bun.lock` relance les deux workflows bun. `bun run --if-present` évite un échec quand une brique n'expose pas encore `lint`, `typecheck` ou `build` (même sémantique que `scripts/run-all.ts`). L'étape `test` est protégée explicitement par un `jq -e '.scripts.test' package.json` : sans script `test`, bun retombe sur le binaire `/usr/bin/test` du PATH et sort en erreur, `--if-present` ne suffit donc pas. Ne pas « simplifier » cette étape.

Chaque workflow a un `timeout-minutes` et un bloc `concurrency` (un seul run par workflow et par ref ; les runs précédents ne sont annulés que sur `pull_request`, pour que chaque commit de `main` garde une conclusion).

Les fichiers Markdown sont exclus de `prettier --check .` (`.prettierignore`) ; `bun run format:docs` / `format:docs:check` les formatent explicitement (`doc/**/*.md` et les `*.md` racine) sans être imposés en CI pour l'instant.

Les workflows tournent sur `pull_request` et sur `push` vers `main`.

## Points d'attention

- `main` n'a pas encore de règle de protection. Le jour où des checks deviennent obligatoires, un workflow filtré par chemin qui ne se déclenche pas reste « pending » : prévoir un job jumeau en `paths-ignore` ou un workflow unique avec `dorny/paths-filter`.
- `.github/labeler.yml` n'est consommé par aucun workflow ; son format (listes de globs) correspond à `actions/labeler` v4 et devra être réécrit (`changed-files` / `any-glob-to-any-file`) si un labeler v5 est ajouté.

## Vérifier localement

```bash
actionlint   # https://github.com/rhysd/actionlint
```
