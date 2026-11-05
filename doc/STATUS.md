# STATUS v0

| Task | Brick     | Status             | PR       | Notes                                                                                                                                          |
| ---- | --------- | ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| X1   | root      | done               | #11      | Monorepo root, bun workspaces, doc/, preflight.                                                                                                |
| X2   | root      | done               | #12      | Agent definition files; not loadable mid-session, general-purpose fallback used in v0.                                                         |
| E1   | edito     | done               | #14      | Eleventy 3 + DSFR 1.14.2, header/footer partials, lint html-validate, smoke test.                                                              |
| E2   | edito     | done               | #18      | Home page from the mockup section order, four footer pages, header text aligned with Figma.                                                    |
| E3   | edito     | done               | #19      | Markdown articles collection, list page, article layout, placeholder article.                                                                  |
| E4   | edito     | done               | #20      | sitemap.xml, robots.txt, canonical/description check, link checker in test.                                                                    |
| E5   | edito     | done               | #23      | i18n /fr and /en, rerouting pages on the old paths, hreflang, DSFR translate switcher.                                                         |
| E6   | edito     | done               | #25      | Review follow-ups: x-default to /fr, switcher title, partage strings in i18n.                                                                  |
| C1   | catalogue | done               | #17      | Investigation: ref v1.6.2, group filter gissol-osf_g, sub-portal API not routed (C-1).                                                         |
| C2   | catalogue | done               | #21      | Pinned shallow clone v1.6.2 + 2 script-applied patches, served under /rechercher-une-donnee.                                                   |
| C3   | catalogue | done               | #26      | French UI, DSFR header/footer generated from doc/agents/edito.md, sols only (patch 0003).                                                      |
| C4   | catalogue | done               | #28      | "Voir sur la carte" through external_viewer_url_template.                                                                                      |
| M1   | carto     | done               | #16      | Vite + React 19 + react-dsfr 1.36, header/footer parity, Vitest + Testing Library.                                                             |
| M2   | carto     | done               | #24      | OpenLayers 10 + geopf-ext layer switcher, WMTS Plan IGN v2 from capabilities, Zustand + TanStack Query.                                        |
| M3   | carto     | done               | #29      | Tools (zoom, scale, attribution, fullscreen, search, rotation), 5 validated base layers, "Fonds de carte" panel, bounded tile retry.           |
| M4   | carto     | done               | #32      | build-sols-layers script (CSW → JSON validated against capabilities), "Données sols" panel, deep links.                                        |
| M5   | carto     | done               | #36      | 174 tests (97 % statements), keyboard access, list view ?vue=liste, l= permalink reader.                                                       |
| X3   | root      | done               | #22, #27 | build:all assembles the three bricks in 1 min 22 s (dist 20 MB); preview:all serves / , /rechercher-une-donnee, /explorer-les-cartes on :8080. |
| X4   | root      | done               | #13      | GitHub Actions per brick, path-filtered.                                                                                                       |
| X5   | root      | open, do not merge | #15      | Draft Docker image workflow, kept unmerged on purpose.                                                                                         |
| C5   | catalogue | done               | #31      | e2e fixes: upstream a11y patch 0004, one main, header alignment, ES scope patch 0005.                                                          |
| C6   | catalogue | done               | #35      | Link format switched to cartes.gouv.fr `l=` (human decision C-3).                                                                              |
| T1   | e2e       | done               | #30      | Playwright suite, first pass.                                                                                                                  |
| T2   | e2e       | done               | #37      | Second pass on final main: 49 passed, 5 skipped (axe mobile), 0 failed in the isolated review run; D-carto-1 residual (~1/20) documented.      |
| M6   | carto     | done               | #39      | Capabilities fetch timeout + retries (hanging GPF requests caused the missing canvas); side panel closed by default below md.                  |
| X7   | root      | done               | #34      | Human answers to QUESTIONS.md, init.md committed.                                                                                              |
| X8   | root      | done               | #38      | doc/v0/REPORT.md, final status (merged without agent review at the usage cut; superseded by X9).                                               |
| C7   | catalogue | done               | #40      | Record page: 0 critical/serious axe (patch 0004 + overlay CSS), search gap collapsed, preview base map on Plan IGN WMTS.                       |
| X9   | root      | done               | #41      | Closing update of STATUS and REPORT after M6, C7 and T2.                                                                                       |
| X11  | root      | done               | #43      | v1: shared `@sols/brand` package (header/footer spec, logos, illustrations), refine.md and figma skill committed.                              |
| E7   | edito     | done               | #45      | v1 header/footer from the brand package, help page, no nav bar, display settings, partners.                                                    |
| E8   | edito     | done               | #50      | v1 home content from the mockup: texts, Sans/Avec frieze, use-case illustrations, data cards, agenda carousel, partners.                       |
| C8   | catalogue | done               | #53      | v1 header/footer injected from the edito reference, badge « Rechercher », display settings hidden (C-6).                                       |
| C9   | catalogue | done               | #44      | Autocomplete and filters verified in scope, unavailable filters removed, keyword chips (config only).                                          |
| C10  | catalogue | done               | #49      | Record-level « Voir sur la carte » links (patch 0006); WFS loop not reproduced (C-5); dark mode documented.                                    |
| M7   | carto     | in review          | #47      | v1 layout (map fills the viewport, compact footer), header v1 with badge « Explorer », OL controls themed.                                     |
| M8   | carto     | todo               |          | geopf-ext tool set as cartes.gouv.fr entrée carto.                                                                                             |
| M9   | carto     | todo               |          | Add data from our catalogue like entrée carto (geopf-ext Catalog widget).                                                                      |
| T3   | e2e       | todo               |          | Third pass after v1.                                                                                                                           |
| C11  | catalogue | done               | #54      | Keyword chips toggle with aria-pressed (patch 0007).                                                                                           |
| X12  | root      | done               | #48      | Transparent OSF mark; CI workflows watch packages/**.                                                                                          |
| X13  | root      | done               | #51      | INRAE svg viewBox, illustration mapping.                                                                                                       |
| X14  | root      | done               | #52      | Tight viewBox for the INRAE logo (measured).                                                                                                   |
| X15  | root      | done               |          | v1 status update, brand README wording.                                                                                                        |
