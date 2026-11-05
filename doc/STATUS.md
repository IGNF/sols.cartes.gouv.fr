# STATUS v0

| Task | Brick | Status | PR | Notes |
|---|---|---|---|---|
| X1 | root | done | #11 | Monorepo root, bun workspaces, doc/, preflight. |
| X2 | root | done | #12 | Agent definition files; not loadable mid-session, general-purpose fallback used in v0. |
| E1 | edito | done | #14 | Eleventy 3 + DSFR 1.14.2, header/footer partials, lint html-validate, smoke test. |
| E2 | edito | done | #18 | Home page from the mockup section order, four footer pages, header text aligned with Figma. |
| E3 | edito | done | #19 | Markdown articles collection, list page, article layout, placeholder article. |
| E4 | edito | done | #20 | sitemap.xml, robots.txt, canonical/description check, link checker in test. |
| E5 | edito | in progress | | i18n /fr and /en with rerouting. |
| C1 | catalogue | done | #17 | Investigation: ref v1.6.2, group filter gissol-osf_g, sub-portal API not routed (C-1). |
| C2 | catalogue | in review | #21 | Pinned shallow clone + 2 script-applied patches, served under /rechercher-une-donnee. |
| C3 | catalogue | in progress | | French UI, DSFR header/footer, sols only. |
| C4 | catalogue | todo | | |
| M1 | carto | done | #16 | Vite + React 19 + react-dsfr 1.36, header/footer parity, Vitest + Testing Library. |
| M2 | carto | in progress | | Map core with geopf-extensions-openlayers. |
| M3 | carto | todo | | |
| M4 | carto | todo | | |
| M5 | carto | todo | | |
| X3 | root | in progress | | Root housekeeping (design refs, status, agent rules); build:all/preview:all verification once C2 and M2 land. |
| X4 | root | done | #13 | GitHub Actions per brick, path-filtered. |
| X5 | root | open, do not merge | #15 | Draft Docker image workflow, kept unmerged on purpose. |
