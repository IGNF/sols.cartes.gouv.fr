# sols.cartes.gouv.fr : Observatoire des sols

Portail des données sols (GIS Sol, INRAE) servies par la Géoplateforme. Trois briques sous une seule origine :

| Chemin | Brique | Dossier | Stack |
|---|---|---|---|
| `/` | edito | `apps/accueil` | Eleventy + DSFR |
| `/rechercher-une-donnee` | catalogue | `apps/rechercher-une-donnee` | geonetwork-ui (Angular), fork IGNF |
| `/explorer-les-cartes` | carto | `apps/explorer-les-cartes` | React + TypeScript + react-dsfr + geopf-extensions-openlayers |

Pas de backend : toutes les données viennent de `https://data.geopf.fr` (WMS, WMTS, WFS, CSW).

## Prérequis

- [Bun](https://bun.com) ≥ 1.4 (edito, carto, scripts racine)
- Node ≥ 24 et npm (brique catalogue uniquement, outillage Angular/Nx)

## Commandes

```bash
bun i                   # installe la racine et les workspaces bun (edito, carto)
bun run dev:accueil     # http://localhost:8081
bun run dev:catalogue   # http://localhost:4200
bun run dev:carto       # http://localhost:5173
bun run lint            # lint de chaque brique
bun run test            # tests de chaque brique
bun run build:all       # construit les trois briques et assemble ./dist
bun run preview:all     # sert ./dist sur http://localhost:8080
```

La brique catalogue s'installe avec `npm install` dans `apps/rechercher-une-donnee` (voir `doc/agents/geonetwork-ui.md`).

## Conventions

- DSFR version unique pour toutes les briques : `config.dsfrVersion` dans `package.json` racine.
- Commits conventionnels (`feat:`, `fix:`, `docs:`...), une modification logique par commit ; `commitlint` est configuré.
- Règles de travail et définition de « terminé » : `CLAUDE.md`.
- Documentation : `doc/` (`doc/STATUS.md` pour l'avancement, `doc/agents/` pour les notes techniques, `doc/agents/QUESTIONS.md` pour les décisions à valider).
