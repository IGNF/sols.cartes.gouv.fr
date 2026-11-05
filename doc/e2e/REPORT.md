# Rapport e2e (T2, seconde passe)

Date : 2026-11-05. Base : `origin/main` avec M3, M4, M5, M6 (#39), C5, C6 et C7 (#40) fusionnés. Les trois briques ont été reconstruites (`bun run build:all`, sans erreur) et servies sur un port libre (8105). Chromium headless, projets `desktop` (1280x900) et `mobile` (375x812). Aucun appel réseau simulé : tuiles et GetMap viennent de `data.geopf.fr`, le catalogue interroge son API réelle.

Lancer : `cd e2e && bun i && bun run test` (le `webServer` démarre `preview:all` ; `dist/` doit exister). Attention : `reuseExistingServer` est actif hors CI (`!process.env.CI`), un avertissement est affiché : la suite teste le serveur déjà présent sur le port (`PORT`, 8102 par défaut), pas forcément le `dist/` courant. Exécution séquentielle (`workers: 1`) et 1 retry. Les captures JPEG (< 300 kB, vérifié par le test) et les JSON axe sont écrits dans `doc/e2e/`.

Résultat du dernier passage complet : 48 réussis, 5 ignorés (axe sur mobile, volontaire), 0 échec, **1 flaky** (stabilité du rendu, mobile : 1 chargement sans canvas sur 20 au premier essai, 0/20 au retry ; voir D-carto-1). Contrôle de types : `bun run typecheck` (tsconfig strict).

## Évolution depuis la passe 1

- Les deux scénarios PENDING (M3 fonds de carte, M4 lien profond) sont exécutés et passent ; le lien profond utilise désormais le format cartes.gouv.fr (`?l=...$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no`).
- Catalogue : la limite connue « agrégations sans filtre » est fermée (C5) : toutes les requêtes `_search` portent `gissol-osf_g`, assertion stricte.
- axe : catalogue (critical/serious de la passe 1) et carto (`label-content-name-mismatch`) corrigés ; home, catalogue, carto et vue liste : 0 critical/serious.
- Nouveaux scénarios : vue liste sans carte, « Voir sur la carte », redirection `organisations`, axe et captures de la fiche et de la vue liste.
- D-carto-1 (intermittent, résiduel après M6 ; test : « stabilité du rendu » dans `tests/03-carto.spec.ts`, annotations `sans canvas` et `Plan IGN absent`) : la carte s'affiche encore rarement sans canvas ni fond Plan IGN, sans erreur réseau ni console. Mesures sur ce build : desktop 0/20 puis 1/20 (deux passages), mobile 1/20 puis 0/20 (retry). Avant M6 : 2-3/20. Reproduire : charger `/explorer-les-cartes/` une vingtaine de fois en contextes neufs et compter les chargements sans `canvas` 5 s après le chargement.

## Synthèse

| # | Scénario | Statut | Preuve |
|---|---|---|---|
| 1a | `/` redirige vers `/fr/` | PASS | desktop + mobile |
| 1b | `/fr/` : un `h1` visible, en-tête, pied de page, 0 erreur console | PASS | desktop + mobile |
| 1c | Liens d'en-tête vers catalogue et carto : 200 et `h1` | PASS | desktop + mobile (un `h1` masqué de modale DSFR existe sur la carte, toléré) |
| 1d | Sélecteur de langue atteint `/en/` | PASS | desktop + mobile |
| 2a | Catalogue : au moins 1 résultat (7 observés), toutes les requêtes `_search` filtrées `gissol-osf_g`, erreurs console | PASS | 7 résultats ; 0 requête sans filtre, agrégations comprises |
| 2b | Fiche : ouverture, titre, erreurs console limitées aux documentées | PASS | tolérées : légende invalide, 400/404/502/503 GPF sur le fond de l'aperçu |
| 2c | `/rechercher-une-donnee/organisations` redirige vers la recherche | PASS | |
| 2d | Fiche `stock_carbone` : « Voir sur la carte » ouvre `/explorer-les-cartes/?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no` dans le même onglet, couche dans la liste, pas d'avis | PASS | aucun nouvel onglet |
| 3a | Carto : canvas, tuiles WMTS 200, gestionnaire de couches (Plan IGN) | PASS | flake GPF compté, voir ci-dessous |
| 3b | « Fonds de carte » : photographies aériennes au clavier, tuiles ORTHOIMAGERY 200 | PASS | |
| 3c | « Données sols » : ajout au clavier de `stock_carbone_fao_fr_wmsv`, GetMap 200 `image/*`, titre dans le gestionnaire, retrait | PASS | |
| 3d | Lien profond WMS (format cartes.gouv.fr) : couche ajoutée, GetMap 200, `image/*` | PASS | |
| 3e | Lien profond WMTS `INRAE_CARTE-SOLS` : couche ajoutée, pas d'alerte | PASS | |
| 3f | Lien profond inconnu : alerte « Couche introuvable » | PASS | |
| 3g | `?vue=liste` : un `h1`, 7 données, 7 liens catalogue, aucun canvas ni requête de tuile GPF | PASS | |
| 3h | Stabilité du rendu de la carte : 20 chargements en contextes neufs, canvas `.map-view canvas` et Plan IGN dans la liste (`tests/03-carto.spec.ts`, « stabilité du rendu ») | PASS (flaky) | desktop 0/20 sans canvas ; mobile 1/20 au premier essai puis 0/20 au retry (Plan IGN absent : mêmes comptes). Passage précédent (même build M6) : 1/20 desktop. Le test échoue tant qu'un chargement manque, D-carto-1 n'est donc pas totalement éteint |
| 4a | axe `/fr/` | PASS | 0 violation |
| 4b | axe `/rechercher-une-donnee/` | PASS | 1 violation modérée (`heading-order`) |
| 4c | axe `/explorer-les-cartes/` | PASS | 0 violation |
| 4d | axe `/explorer-les-cartes/?vue=liste` | PASS | 0 violation |
| 4e | axe fiche (bloquant depuis C7) | PASS | 0 critical/serious |
| 5 | Captures desktop + mobile : home, catalogue, carto, liste, fiche | PASS | `doc/e2e/*.jpg`, toutes < 300 kB |

BLOCKED : aucun.

### Flakes GPF (comptés séparément)

Chaque test enregistre `requêtes / non-200` en annotation (`flake GPF`) ; seuil : 10 % des requêtes, au moins 2. Observés durant cette passe, tous côté GPF (question M-2) :
- 400/404 sur tuiles `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` (WMTS, TileMatrix 6) : plusieurs occurrences, dont 2 sur 10 tuiles lors d'un passage mobile ;
- 502 sur un GetMap `data.geopf.fr/wms-r` (Plan IGN v2) dans l'aperçu d'une fiche.
Environnement (catalogue, pour C7) : lors d'un passage, la capture de la recherche a échoué une fois (résultats non affichés en 60 s, `waitForCatalogueResults`) puis réussi au retry ; non reproduit sur le dernier passage complet.
Les erreurs GPF ci-dessus sont tolérées uniquement quand elles visent `data.geopf.fr` (`wmts`, `wms-v`, `wms-r`).

## Défauts par brique

### edito

Aucun défaut. Écarts de design : voir « Figma ».

### catalogue

- D-cat-1 (a11y, fiche) : corrigé par C7 : 0 critical/serious sur la fiche (étaient `button-name` 6, `label` 4, `color-contrast` 10, `aria-tab-name` 1).
- D-cat-2 (a11y, modérée) : `heading-order` sur la recherche (titres de résultats en `h4`), déjà documenté.
- D-cat-3 (visuel) : l'espace sous la recherche est réduit par C7 (~32 px). Sur la fiche, la capture montre encore une zone vide au-dessus du résumé (aperçu cartographique non rendu au moment de la capture : la capture n'attend pas la carte d'aperçu ; à vérifier à la main).

### carto

- D-carto-1 (intermittent, résiduel après M6 ; test : « stabilité du rendu » dans `tests/03-carto.spec.ts`, annotations `sans canvas` et `Plan IGN absent`) : la carte s'affiche encore rarement sans canvas ni fond Plan IGN, sans erreur réseau ni console. Mesures sur ce build : desktop 0/20 puis 1/20 (deux passages), mobile 1/20 puis 0/20 (retry). Avant M6 : 2-3/20. Reproduire : charger `/explorer-les-cartes/` une vingtaine de fois en contextes neufs et compter les chargements sans `canvas` 5 s après le chargement.
- D-carto-2 : flake GPF (M-2) confirmé, côté serveur, non corrigeable dans la brique.
- Panneau latéral (M6) : fermé par défaut à 375 px, la carte démarre au-dessus du pli (voir capture mobile).

## Violations axe-core (toutes sévérités)

Fichiers bruts : `doc/e2e/axe-*.json`.

| Page | Règle | Impact | Noeuds |
|---|---|---|---|
| `/fr/` | aucune | | 0 |
| catalogue | `heading-order` | moderate | 1 |
| carto | aucune | | 0 |
| liste | aucune | | 0 |
| fiche | aucune | | 0 |

## Captures

Fichiers : `doc/e2e/{home,catalogue,carto,liste,fiche}-{desktop,mobile}.jpg` (home et liste en pleine page).

- Home : en-tête, hero, sections, pied de page présents, pas de débordement ; mobile correct.
- Catalogue : liste complète avec vignettes, filtres, pied de page ; vide résiduel sous la recherche (D-cat-3).
- Carto : panneau « Fonds de carte » (5 radios) à gauche, carte Plan IGN à droite, recherche, zoom, plein écran, gestionnaire de couches ; pas d'écran blanc sur ces captures. Mobile : panneau au-dessus, carte sous le pli.
- Liste : sept données lisibles, services, liens « point d'accès » et « voir sur la carte », lien « Fiche de la donnée dans le catalogue », pas de débordement mobile.
- Fiche : titre, étiquettes, mots-clés, contact ; zone vide au-dessus du résumé (aperçu non rendu à la capture).

## Comparaison Figma (home)

Seules les divergences nouvelles depuis la passe 1 : aucune sur la home (inchangée). Le hero, la section « Le service » et le pied de page restent ceux déjà consignés (`doc/design/README.md`). Les pages carto, liste et fiche n'ont pas de maquette dans `doc/design/`.
