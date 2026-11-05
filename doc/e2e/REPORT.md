# Rapport e2e (T1, première passe)

Date : 2026-11-05. Base : `origin/main` (carto M1/M2 seulement ; M3, M4, M5 non fusionnés). Les trois briques ont été construites (`bun run build:all`) sans erreur et servies sur `:8102`. Chromium headless, projets `desktop` (1280x900) et `mobile` (375x812). Aucun appel réseau n'est simulé : les tuiles viennent de `data.geopf.fr`, le catalogue interroge son API réelle.

Lancer : `cd e2e && bun i && bun run test` (le `webServer` démarre `preview:all`, `dist/` doit exister). Les captures JPEG (< 300 kB, vérifié par le test) et les JSON axe sont écrits directement dans `doc/e2e/`. Attention : `reuseExistingServer` est actif, la suite teste donc le serveur déjà présent sur le port (`PORT`, 8102 par défaut), pas forcément le `dist/` courant ; arrêter tout serveur existant avant de tester un nouveau build.

## Synthèse

| # | Scénario | Statut | Preuve |
|---|---|---|---|
| 1a | `/` redirige vers `/fr/` | PASS | desktop + mobile |
| 1b | `/fr/` : un seul `h1`, en-tête, pied de page, aucune erreur console | PASS | `h1` = 1, 0 `console.error`/`pageerror` |
| 1c | Lien d'en-tête vers `/rechercher-une-donnee/` : 200 et `h1` | PASS | desktop + mobile |
| 1d | Lien d'en-tête vers `/explorer-les-cartes/` : 200 et un seul `h1` visible | PASS | `h1:visible` = 1 ; note : un `h1.fr-modal__title` masqué (modale react-dsfr « Paramètres d'affichage ») existe, toléré |
| 1e | Sélecteur de langue atteint `/en/` | PASS | desktop + mobile |
| 2a | Catalogue : au moins 1 résultat (nombre annoncé noté, 7 attendus), requêtes de résultats (`size` > 0) filtrées `gissol-osf_g` | PASS | 7 résultats observés, filtre présent sur toutes les requêtes de résultats |
| 2a' | Requêtes d'agrégation (`size` 0) sans le filtre | KNOWN LIMIT | voir D-cat-1 et `doc/catalogue-patches.md` « Limites connues » |
| 2b | Fiche : ouverture et titre | PASS | erreurs console limitées aux deux documentées (légende invalide, 400 WMTS/légende) |
| 3a | Carto : `canvas`, tuiles WMTS 200, sélecteur de couches s'ouvre | PASS (flake M-2 observé) | une exécution sur ~30 a loggé 404 sur `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` TileMatrix=6 ; toléré et compté (<= 10 %) |
| 3b | Panneau « Fonds de carte » vers orthophotos | PENDING (M3) | seul « Plan IGN » est listé dans « Gestionnaire de couches » ; `test.skip` explicite |
| 3c | Lien profond `?layer=rrp_loiret_gpkg_11-09-2026_wmsv&type=WMS&url=...` et couche sols dans le sélecteur | PENDING (M4) | `test.skip` |
| 4a | axe `/fr/` | PASS | 0 violation |
| 4b | axe `/rechercher-une-donnee/` | FAIL | 2 critical, 1 serious (détail ci-dessous) |
| 4c | axe `/explorer-les-cartes/` | FAIL | 1 serious |
| 5 | Captures desktop + mobile des 3 pages | PASS | `doc/e2e/*.jpg` (JPEG q70 produits par le test, qui échoue au-delà de 300 kB) |

BLOCKED : aucun (tous les appels réseau ont abouti).

## Défauts par brique

### edito

Aucun défaut bloquant. Écarts de design : voir « Comparaison Figma ».

### catalogue

- D-cat-1 (scope, KNOWN LIMIT, non bloquant) : au chargement de `/rechercher-une-donnee/`, plusieurs requêtes `_search` d'agrégation (`size: 0`, facettes `cl_topic.key`, contacts/organisations) n'ont pas `gissol-osf_g` dans le corps (1 à 5 selon le moment, 5 en desktop). Les facettes Thèmes/organisations peuvent donc compter des fiches hors sols. Reproduire : ouvrir la page, DevTools > Réseau > filtrer `_search`, inspecter les requêtes `size":0`. Test : `e2e/tests/02-catalogue.spec.ts`.
- D-cat-2 (a11y, critical) `aria-valid-attr-value`, 3 noeuds, ex. `gn-ui-button[title="Thèmes"]`.
- D-cat-3 (a11y, critical) `button-name`, 4 noeuds (boutons sans texte, ex. `.border-0`).
- D-cat-4 (a11y, serious) `nested-interactive`, 2 noeuds (`gn-ui-button[title="Thèmes"]`).
- D-cat-5 (visuel) : grand vide (~150 px desktop, ~190 px mobile) entre le champ de recherche et les filtres ; vignette du premier résultat vide.
- D-cat-6 (visuel) : les entrées du menu principal sont décalées par rapport aux autres pages (« Accueil » à x=164 px contre 40 px sur home/carto, desktop).

Probable upstream (geonetwork-ui) pour D-cat-2/3/4 : à confirmer avant de patcher (`doc/catalogue-patches.md`).

### carto

- D-carto-1 (a11y, serious) `label-content-name-mismatch` : bouton `#GPshowLayersListPicto-*` (nom accessible « Ma sélection de cartes », texte visible « 1 »).
- Note (non bloquante) : un second `h1` existe dans le DOM, le titre masqué de la modale DSFR « Paramètres d'affichage » (`h1.fr-modal__title`). Un seul `h1` est visible ; légitime côté DSFR.
- D-carto-2 : flake M-2 (404 ponctuel de tuile Plan IGN v2) confirmé, côté GPF ; non corrigeable dans la brique.
- Écart : le panneau « Fonds de carte » n'existe pas encore (M3) ; couche sols et lien profond (M4) à tester en passe 2.

## Violations axe-core (toutes sévérités)

Fichiers bruts : `doc/e2e/axe-*.json`.

| Page | Règle | Impact | Noeuds |
|---|---|---|---|
| `/fr/` | aucune | | 0 |
| catalogue | `aria-valid-attr-value` | critical | 3 |
| catalogue | `button-name` | critical | 4 |
| catalogue | `nested-interactive` | serious | 2 |
| catalogue | `heading-order` | moderate | 1 |
| catalogue | `landmark-main-is-top-level` | moderate | 1 |
| catalogue | `landmark-no-duplicate-main` | moderate | 1 |
| catalogue | `landmark-unique` | moderate | 1 |
| carto | `label-content-name-mismatch` | serious | 1 |

Les trois règles `landmark-*` du catalogue viennent d'un second `main` (`#home-page > main`) imbriqué dans le `#contenu` de l'en-tête/pied DSFR injectés.

## Captures

Fichiers : `doc/e2e/{home,catalogue,carto}-{desktop,mobile}.jpg` (home en pleine page, les autres en fenêtre).

- Home : en-tête, hero, sections, pied de page présents ; pas de débordement. Mobile OK.
- Catalogue : en-tête/menu OK ; vide sous la recherche (D-cat-5), vignette blanche ; sur mobile le bloc « Affiner votre recherche » est bleu foncé (thème geonetwork-ui, hors DSFR), texte « Agrandir » peu contrasté.
- Carto : carte rendue (Plan IGN, pas d'écran blanc), contrôles zoom et couches visibles ; mobile : menu burger OK, carte pleine largeur. Défaut : le menu principal n'apparaît que via le burger, normal.

## Comparaison Figma (home, `doc/design/figma-home-1440-light.png`)

Écarts attendus (voir `doc/design/README.md`) : pas de logo GIS Sol dans l'en-tête, pas de « Aide / Services / Se connecter », pied de page DSFR clair au lieu du bloc sombre, pas de visuel d'application, chiffres (60 ans, 12+, 100 %), cas d'usage illustrés, agenda, partenaires, bandeau « arrive bientôt ».
Écarts supplémentaires : hero sans accroche « Toute la connaissance des sols de France réunie en un seul endroit » (titre provisoire « Observatoire des sols », fond bleu pâle) ; section « Le service » sans la vidéo ni le comparatif avant/après ; trois cartes « Trouver / Comprendre / Utiliser » présentes mais descriptions provisoires ; bandeau bleu « Accéder au portail » absent ; section « Derniers articles » et encart « Le GIS Sol » ajoutés (absents du Figma).
