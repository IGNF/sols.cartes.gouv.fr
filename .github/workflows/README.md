# Workflows de CI

Chaque brique a son workflow, déclenché seulement quand ses fichiers changent (push sur `main` et pull requests). Aucun déploiement ici ; jetons en lecture seule.

| Workflow                                 | Se déclenche sur                                                                                          | Vérifie                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`ci-edito.yml`](ci-edito.yml)           | `apps/accueil/`, `packages/`, `doc/agents/edito.md`                                                       | lint (build Eleventy + html-validate), tests                |
| [`ci-catalogue.yml`](ci-catalogue.yml)   | `apps/rechercher-une-donnee/`, `packages/`, docs et fichiers de l’edito qu’elle lit                       | lint, tests, build du datahub patché                        |
| [`ci-carto.yml`](ci-carto.yml)           | `apps/explorer-les-cartes/`, `packages/`                                                                  | lint, type-check, tests, build                              |
| [`ci-root.yml`](ci-root.yml)             | `scripts/`, `e2e/`, `packages/`                                                                           | Prettier, type-check des scripts racine et de `e2e/`        |
| [`ci-commits.yml`](ci-commits.yml)       | toute pull request                                                                                        | messages Conventional Commits (commitlint)                  |

Les suites navigateur (`e2e/`, `bun run check:map`) tournent contre les vrais services de la Géoplateforme : elles se lancent à la main, pas en CI.
