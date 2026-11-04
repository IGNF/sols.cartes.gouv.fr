# init.md: Observatoire des sols, v0

You are the **orchestrator**. `CLAUDE.md` is binding; read it, then the skills in `.claude/skills/`. This file says what to build for v0 and how to run the work.
Do not stop to ask questions. If a decision is blocked, log it in `doc/agents/QUESTIONS.md` (question, options, your default) and continue on whatever is unblocked. Stop and report only for irreversible decisions.

## 1. Goal of v0

A locally running skeleton of `sols.cartes.gouv.fr`: three apps served under one origin.

| Path | Brick | Directory |
|---|---|---|
| `/` | edito (Eleventy + DSFR) | `apps/accueil` |
| `/rechercher-une-donnee` | catalogue (geonetwork-ui, Angular) | `apps/rechercher-une-donnee` |
| `/explorer-les-cartes` | carto (React + TS + geopf-ext) | `apps/explorer-les-cartes` |

Out of scope: deployment, Docker/K8s, authentication, final editorial content, pixel-perfect design.
Never invent soil data or editorial facts. Placeholder content is French by default, neutral, and translated with i18n.

## 2. Data source: what "sols" means

The only definition of the sols scope is:

```
https://data.geopf.fr/csw/gissol-osf_c?REQUEST=GetRecords&SERVICE=CSW&VERSION=2.0.2&RESULTTYPE=results&elementSetName=full&TYPENAMES=gmd:MD_Metadata&OUTPUTSCHEMA=http://standards.iso.org/iso/19115/-3/mdb/2.0
```
or in `doc/agents/gissol-osf_c.xml`
Seems to be done in catalogue through ?organization=INRAE - Info%26Sols if you can just sneak this param.

- This filter is enough to expose only the "sols" datasets. The same set is visible on our generic instance: `https://cartes.gouv.fr/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols`
- Before building on it, `curl` the CSW and count records (7 in theory). Record the structure (identifiers, links to WMS/WMTS/WFS) in `doc/agents/gpf-sols-data.md`.
- Never hardcode record contents in source. Generated files must come from a script that can be re-run.
- If a browser cannot call the CSW (CORS), do not work around it silently: use a build-time script or a dev proxy, and document the choice.

## 3. Git rules (resolves a conflict in CLAUDE.md)

CLAUDE.md says "never merge to main" and also "review and merge each PR". For v0:
- Create the integration branch from `main`. **Only touch `main` trough PR to keep trace.**
- Each task works on `feat/<task-id>-<slug>` created from latest state of main, in its own git worktree. It ends in a PR into `main`.
- The orchestrator merges a PR into `main` only after the reviewer approves.
- Conventional Commits, one logical change each. No force-push, no history rewrite, no deploy.
- Do not create GitHub issues, you can still add comment in addition of question in docs. Use the task ids below in branch names and PR titles.

## 4. Agents

Create `.claude/agents/<name>.md` (frontmatter: `name`, `description`, `tools`, `model`) for each role below. If a new file is not loadable in this session, spawn a general-purpose agent with the same role prompt instead. Subagents cannot spawn subagents, so **only the orchestrator launches agents**.

| Agent | Scope (may write only here) | Model |
|---|---|---|
| `edito-dev` | `apps/accueil`, `doc/agents/edito.md` | opus |
| `catalogue-dev` | `apps/rechercher-une-donnee`, `doc/agents/geonetwork-ui.md`, `doc/catalogue-patches.md` | opus |
| `carto-dev` | `apps/explorer-les-cartes`, `doc/agents/geopf-ext.md` | opus |
| `reviewer` | read-only; may run lint, tests, build | opus |
| `e2e-tester` | `e2e/`, `doc/e2e/` | sonnet |

The three `*-dev` agents each own one brick and do not edit another brick's directory. Each loads CLAUDE.md and reads only the docs it needs, section by section.
If an agent repeatedly blocks on something, you can use a higher model temporarily.

## 5. Pipeline for every task

1. **Plan**: the brick agent writes `doc/plans/<task-id>.md` (goal, files, steps, tests; 30 lines max) and no code. If the task is big, the plan lists ordered sub-tasks.
2. **Implement**: the same agent implements in its worktree, one sub-task at a time, running lint, type-check, tests and build for its brick.
3. **Review**: a fresh `reviewer` checks the diff against the plan, the CLAUDE.md conventions and the Definition of done. Verdict: `APPROVE` or a numbered list of required fixes.
4. **Fix loop**: at most 2 rounds of implement, then review. If still not approved, log it in `QUESTIONS.md` and move on.
5. **Merge** into `main` (see section 3), then update `doc/STATUS.md` (task id, status, PR, notes).

Run the three bricks in parallel (one worktree each). Tasks inside a brick run in order.

## 6. Tasks

### Phase A: foundation (orchestrator, sequential, before any fan-out)
- **X1** Monorepo root: bun workspaces for edito and carto, root scripts (`dev:accueil`, `dev:catalogue`, `dev:carto`, `lint`, `test`, `build:all`, `preview:all`), shared editorconfig/prettier, `.gitignore`, `doc/`, one pinned DSFR version for all bricks. Fix the broken "Layout..." line in CLAUDE.md and the `acceuil` typo (use `accueil`).
- **X2** Agent definition files (section 4).

### Phase B: bricks (parallel)

**edito** (`edito-dev`)
- **E1** Eleventy + DSFR scaffold. Header (nav to the three sections), footer, layout with title, meta description, heading hierarchy. Save the header/footer markup as partials; the other bricks reproduce it.
- **E2** Home page: short presentation, links to catalogue and carto, link to GISSol. Placeholder text only.
- **E3** Articles: markdown collection, list page, article template, one placeholder article.
- **E4** SEO and indexing: `sitemap.xml`, `robots.txt`, canonical URLs. Static build output to `dist/`. A link-check script as the test.
- **E5** Translation with rerouting amoung /fr and /en using i18n

**catalogue** (`catalogue-dev`)
- **C1** Investigation, documented in `doc/agents/geonetwork-ui.md`: how the generic instance applies the `organization=INRAE - Info&Sols` filter, and which supported mechanism does the same here (config file, search preset or URL filter). Verify in the IGNF/geonetwork-ui repo; do not guess option names. Check that the CSW from section 2 and that filter return the same set.
- **C2** Scaffold the catalogue app from geonetwork-ui by configuration, theming and composition only (no edits to upstream code), served under `/rechercher-une-donnee`. If bun does not work with its Angular tooling, use the package manager it requires inside this app only, and document it.
- **C3** French UI, DSFR-consistent header/footer matching the edito partials, only sols datasets exposed.
- **C4** A "view on the map" link per dataset to `/explorer-les-cartes` if the configuration allows it; otherwise document why not. Log any unavoidable patch in `doc/catalogue-patches.md`.

**carto** (`carto-dev`, use the `react-dsfr` skill)
- **M1** Vite + React + TS strict + `@codegouvfr/react-dsfr` + Vitest + Testing Library, base path `/explorer-les-cartes`, URL constants file, header/footer matching the edito partials.
- **M2** Map core with geopf-extensions (that is based on OpenLayers) (check the docs of the installed version, never guess options). GPF background layer, layer switcher, hooks in the style of IGNF/cartes.gouv.fr-guichet-collaboratif. Zustand for client state, TanStack Query for server state.
- **M3** Maps is fully working, with required tools and access to a catalogue of predefined raster base layers, `Plan IGNv2`, and orthophotos.
- **M4** Sols layers: a script `scripts/build-sols-layers` generates a layers JSON from the CSW (section 2). Layer names are validated against GetCapabilities. The app lists the datasets in a panel and adds one to the map.
- **M5** Unit tests for hooks and components; keyboard access and a non-map alternative for the dataset list.

### Phase C: integration (orchestrator)
- **X3** `build:all` writes `dist/` with `/` from edito, `/rechercher-une-donnee`, `/explorer-les-cartes`; `preview:all` serves it on `http://localhost:8080`.
- **X4** GitHub Actions: lint, test and build per brick (path-filtered).
- **X5** You can prepare a docker workflow with a pending PR *DO not merge especially this one* for future image build

## 7. Final test (agent-run, no human)

`e2e-tester` runs `preview:all` and Playwright (headless Chromium; install it if missing). You have access to chrome & claude extension.
Scenarios:
1. Home loads, nav links to the two other sections work, no console errors.
2. Catalogue shows at least 1 record, all from the sols scope. A record page opens.
3. Carto: the map canvas renders, background tiles from `data.geopf.fr` return 200, adding a sols layer sends a successful request and the layer shows in the switcher.
4. axe-core on the three pages: no critical or serious violations.
5. Screenshots (desktop and mobile) saved to `doc/e2e/`. The agent opens them and notes visible defects. If a Figma connection exists, compare with the frames from CLAUDE.md; otherwise skip and say so.

Failures become fix tasks for the owning brick agent (same pipeline, max 2 cycles). If a network call is blocked, mark the scenario `BLOCKED` with the reason. Do not mock it silently.

## 8. Deliverables

- Everything merged into `main`, with `doc/STATUS.md`, `QUESTIONS.md`, `plans/` and `e2e/`.
- `doc/v0/REPORT.md`: what works, what is BLOCKED, what needs a human (content validation, RGAA audit beyond axe, design review), and the open questions.