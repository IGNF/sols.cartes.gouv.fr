# STATUS v0

| Task | Brick | Status | PR | Notes |
|---|---|---|---|---|
| X1 | root | done | #11 | Monorepo root, bun workspaces, doc/, preflight. |
| X2 | root | done | #12 | Agent definition files; not loadable mid-session, general-purpose fallback used in v0. |
| E1 | edito | done | #14 | Eleventy 3 + DSFR 1.14.2, header/footer partials, lint html-validate, smoke test. |
| E2 | edito | done | #18 | Home page from the mockup section order, four footer pages, header text aligned with Figma. |
| E3 | edito | done | #19 | Markdown articles collection, list page, article layout, placeholder article. |
| E4 | edito | done | #20 | sitemap.xml, robots.txt, canonical/description check, link checker in test. |
| E5 | edito | done | #23 | i18n /fr and /en, rerouting pages on the old paths, hreflang, DSFR translate switcher. |
| E6 | edito | done | #25 | Review follow-ups: x-default to /fr, switcher title, partage strings in i18n. |
| C1 | catalogue | done | #17 | Investigation: ref v1.6.2, group filter gissol-osf_g, sub-portal API not routed (C-1). |
| C2 | catalogue | done | #21 | Pinned shallow clone v1.6.2 + 2 script-applied patches, served under /rechercher-une-donnee. |
| C3 | catalogue | in review | #26 | French UI, DSFR header/footer generated from doc/agents/edito.md, sols only (patch 0003). |
| C4 | catalogue | in progress | | "Voir sur la carte" link through external_viewer_url_template. |
| M1 | carto | done | #16 | Vite + React 19 + react-dsfr 1.36, header/footer parity, Vitest + Testing Library. |
| M2 | carto | done | #24 | OpenLayers 10 + geopf-ext layer switcher, WMTS Plan IGN v2 from capabilities, Zustand + TanStack Query. |
| M3 | carto | in progress | | Map tools and base-layer catalogue. |
| M4 | carto | todo | | |
| M5 | carto | todo | | |
| X3 | root | done | #22, #27 | build:all assembles the three bricks in 1 min 22 s (dist 20 MB); preview:all serves / , /rechercher-une-donnee, /explorer-les-cartes on :8080. |
| X4 | root | done | #13 | GitHub Actions per brick, path-filtered. |
| X5 | root | open, do not merge | #15 | Draft Docker image workflow, kept unmerged on purpose. |
