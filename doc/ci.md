# Intégration continue

Quatre workflows GitHub Actions, filtrés par chemin pour ne lancer que la brique touchée :

| Workflow | Déclencheurs (chemins) | Étapes |
|---|---|---|
| `ci-root.yml` | `scripts/**`, `package.json`, `bun.lock` | prettier, `tsc --strict` sur `scripts/`, `build-all --skip-build` |
| `ci-edito.yml` | `apps/accueil/**` | `bun run lint`, `test`, `build` dans `apps/accueil` |
| `ci-carto.yml` | `apps/explorer-les-cartes/**` | `bun run lint`, `typecheck`, `test`, `build` dans `apps/explorer-les-cartes` |
| `ci-catalogue.yml` | `apps/rechercher-une-donnee/**` | `npm ci`, `lint`, `test` (si présents), `build` avec Node 24 |

Chaque brique doit donc exposer ces scripts dans son `package.json`. Les workflows tournent sur `pull_request` et sur `push` vers `main`.

Validation locale sans GitHub : `act` n'est pas installé ; les workflows ont été vérifiés par `actionlint` si disponible, sinon par un parse YAML.
