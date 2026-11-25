# CLAUDE.md: Observatoire des sols

Portal for soil data from INRAE so-called 'gisSol', served by the Géoplateforme (GPF). Production URL: `sols.cartes.gouv.fr`.
Project board: https://github.com/orgs/IGNF/projects/104/

## Architecture (3 bricks, 1 domain)

| Brick | Role | Stack |
|---|---|---|
| `edito` | Static pages: presentation, articles, redirects to GISSol | Eleventy (SSG), DSFR |
| `catalogue` | Dataset catalogue, "sols" data only | IGNF/geonetwork-ui (see rules below, `https://github.com/IGNF/geonetwork-ui`) |
| `carto` | Map entry, reference data + GIS Sol data | React + TypeScript, `@codegouvfr/react-dsfr`, `geopf-extensions-openlayers` |

All data comes from `https://data.geopf.fr` (WMS / WFS / WMTS) and the INRAE datastore in this geojson. There is no backend and no database.

## Layout

| Path | Brick | Directory | Package manager |
|---|---|---|---|
| `/` | edito | `apps/accueil` | bun (workspace) |
| `/rechercher-une-donnee` | catalogue | `apps/rechercher-une-donnee` | npm (Angular/Nx tooling, outside the bun workspace) |
| `/explorer-les-cartes` | carto | `apps/explorer-les-cartes` | bun (workspace) |

Root scripts live in `scripts/` and read the app registry in `scripts/apps.ts`. The DSFR version shared by all bricks is pinned in the root `package.json` (`config.dsfrVersion`). Documentation lives in `doc/` (`doc/agents/` for agent notes, `doc/plans/` for task plans, `doc/STATUS.md`, `doc/agents/QUESTIONS.md`).

## Commands

```bash
bun i                   # install root + bun workspaces (edito, carto)
bun run dev:accueil     # edito dev server, http://localhost:8081
bun run dev:catalogue   # catalogue dev server, http://localhost:4200 (npm inside the app)
bun run dev:carto       # carto dev server, http://localhost:5173
bun run lint            # lint every brick that defines a lint script
bun run test            # tests, same rule
bun run build:all       # builds the three bricks and assembles ./dist
bun run preview:all     # serves ./dist on http://localhost:8080
```

Run lint + type-check + tests on the touched brick before every PR. 

## Conventions

- **DSFR first**: use DSFR components and tokens before writing custom CSS. Plain `.css` only for new code.
- **Accessibility (RGAA)**: semantic HTML, labels, keyboard navigation, contrast. Map features need a non-map alternative when possible.
- **URLs**: centralised in one constants file. No URL, layer name or endpoint hardcoded inline.
- **Language**: UI strings in French. EN with i18n.
- **TypeScript**: strict mode, no `any` without a comment, named default-exported function components, props typed with `interface`/`type`.
- **State** (carto): proposal, same as guichet-collaboratif: Zustand for client state, TanStack Query for server/GPF state, never duplicate server state in a store.
- **Reuse**: look for an existing component, hook or util before creating one.
- **No `console.log`**, no commented-out code, no unused dependencies in committed code.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`...), one logical change each.

## Brick-specific rules

**edito** (tickets 1/2/3)
- Output must stay static and fast. No client-side JS unless needed; if added, say why in the PR.
- Every page has a title, meta description and proper heading hierarchy (SEO and agent indexing).
- Be careful if you need to download images and put them in assest over size/format. 

**catalogue** (tickets 7/8/9)
- Do not edit upstream geonetwork-ui code. Prefer configuration, theming and composition. Any unavoidable patch must be listed in `doc/catalogue-patches.md` with the reason and an upstream link.
- Only "sols" datasets are exposed.
- Generic swagger can be found here `https://web.app.ufz.de/geonetwork/doc/api/index.html`

**carto** (tickets 4/5/6)
- Layers and services come from the GPF. Check layer names against GetCapabilities, never guess them.
- Check the geopf-extensions API in official JSDoc before using a control or layer option: https://ignf.github.io/geopf-extensions-openlayers/jsdoc/

## Working with the project board

1. Only pick tickets that have acceptance criteria. If a ticket is ambiguous, comment on it with precise questions and stop. Do not guess scope.
2. Branch name: `feat/<issue-number>-short-slug` or `fix/<issue-number>-short-slug`.
3. Open a **PR** with a short summary, how it was tested, and screenshots for any UI change from chrome browser.
4. Keep PRs small: one ticket, one brick when possible.
5. Move the card to the "ready to deploy" column once checks pass.

## Autonomy levels

- You're more or less free to do everything, as long as you're not writing everywhere from this local folder and the distant repository: https://github.com/IGN/sols.cartes.gouv.fr.
- Try to be as autonomous as you can, and as said, write in `QUESTIONS.md` if necessary.

## Design (Figma)

- Source of truth: <https://www.figma.com/design/8G2DLGMfv3MoFmf8lRy7rG/sols.cartes.gouv.fr>. Each UI ticket links its frame under section 'Figma' (if design is concerned).
- Build from DSFR components and tokens. Match the mockup's layout and content, not pixel-perfect custom styling.
- If a mockup conflicts with DSFR or accessibility (RGAA), do not improvise: comment on the ticket, tag the dev, and wait.
- If the mockup is missing or unclear, ask on the ticket instead of designing it yourself.
- Always try to use dsfr colors, police, icons and components whenever possible. For exemple closet color possible if the one in design is not already a dsfr variable.

## Definition of done

- Lint, type-check, tests and build pass on the touched brick
- Works in the browser (map: tested with real GPF layers), no console errors
- DSFR and accessibility checked
- No hardcoded URL, no untranslated string, no leftover debug code
- Docs updated if behaviour, commands or architecture changed
- Each group of tasks should lead to a PR that you review and merge


## References
 
- DSFR: use the `react-dsfr` skill (`.claude/skills/`), and https://www.systeme-de-design.gouv.fr/
- geopf-extensions (use the tag matching the installed version, not `main`):
  - Usage guide: https://github.com/IGNF/geopf-extensions-openlayers/blob/main/doc/DOCUMENTATION.md
  - API (JSDoc): https://ignf.github.io/geopf-extensions-openlayers/jsdoc/
  - Examples: `demos/`, `samples-src/` and `snippets/` in the repo
  - React integration reference: IGNF/cartes.gouv.fr-guichet-collaboratif
- geonetwork-ui: https://github.com/IGNF/geonetwork-ui (project-specific config and theming notes in `doc/agents/geonetwork-ui.md`, TODO)
- GPF services: https://data.geopf.fr
- Skill used by geonetwork-ui : `geospatial-sdk-map-layers` (`.claude/skills/`) just for better understanding and integration of map layers within the UI since geonetwork-ui needs to 
be use as its own state. 

## Tests

Unit test should cover most of the base code with `@testing-library/react`


## Complementary references
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Feel free to refer to other cartographic project from IGNF link to cartes.gouv mentionned in this README: `https://github.com/IGNF/cartes.gouv.fr`