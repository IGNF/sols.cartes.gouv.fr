# Rapport e2e (T3, passe 3, première partie)

Date : 2026-11-05. Base : `origin/main` 360b0c0 (v1 : X11, E7, E8, C8 à C11, M7 fusionnés ; M8 et M9 pas encore). Les trois briques ont été construites (`bun run build:all`, sans erreur) et servies sur le port 8133. Chromium headless, projets `desktop` (1280x900) et `mobile` (375x812). Aucun appel réseau simulé.

Lancer : `cd e2e && bun i && PORT=8133 bun run test` (`dist/` doit exister ; `reuseExistingServer` hors CI : la suite teste le serveur déjà présent sur le port, un avertissement est affiché). Exécution séquentielle, 1 retry. Captures JPEG (< 300 kB, qualité abaissée automatiquement si besoin) et JSON axe écrits dans `doc/e2e/`. Contrôle de types : `bun run typecheck`.

Résultat du dernier passage complet : **78 réussis, 8 ignorés, 0 échec, 0 flaky**. Ignorés : axe sur mobile (6), Échap du sous-menu sur mobile (la modale du menu burger se ferme en entier, comportement DSFR), filtres du catalogue sur mobile (repliés dans « Affiner votre recherche »).

## Passe 3 : ce qui a changé dans la suite

- En-tête v1 : plus de barre de navigation ; liens vers catalogue et carte dans le menu « Services » (ouverture souris et clavier, Échap sur desktop, retour du focus) ; pas de « Se connecter », aucun lien vers cartes.gouv.fr, logo GIS Sol ; badge « Rechercher » (catalogue) et « Explorer » (carte), aucun sur l'edito.
- Pied de page v1 : partenaires IGN, INRAE, GIS Sol (lien `https://www.gissol.fr/observatoire-des-sols-de-france/`), « Paramètres d'affichage » (edito, carte ; masqué sur le catalogue), pied compact sur la carte.
- Home v1 (sections), page `/fr/aide/` avec `#contact`, thème sombre via les paramètres d'affichage.
- Catalogue : puces « Mots-clés suggérés » à bascule (`aria-pressed`, paramètre `keyword`, résultats, clavier), filtres Thèmes et Mot-clé seuls, lien « Voir sur la carte » de la fiche (même onglet, couche affichée).
- Carte : mise en page plein viewport (pas de défilement à 1280x900), `h1` sr-only, barre d'outils au-dessus de la carte, panneau fermé par défaut sur mobile.
- Axe : ajout de `/fr/aide/` ; fiche toujours bloquante. Captures : ajout de l'aide et des deux en-têtes (menu « Services » ouvert).
- Test de stabilité de la carte conservé (M6) : 20 chargements, aucun sans canvas.

## Synthèse

| # | Scénario | Statut | Preuve |
|---|---|---|---|
| 1a | `/` redirige vers `/fr/` | PASS | desktop + mobile |
| 1b | `/fr/` : un `h1` visible, 0 erreur console | PASS | desktop + mobile |
| 1c | En-tête v1 de l'edito : sans `#navigation-principale`, sans « Se connecter », sans lien cartes.gouv.fr, logo GIS Sol, sans badge | PASS | desktop + mobile |
| 1d | Pied de page v1 : partenaires, lien GIS Sol corrigé, paramètres d'affichage | PASS | |
| 1e | Menu « Services » : Entrée ouvre, Échap ferme, focus rendu (desktop) | PASS | mobile : ouverture seulement |
| 1f | Menu « Services » mène au catalogue et à la carte (200, un h1 visible) | PASS | |
| 1g | Page `/fr/aide/` avec `#contact` | PASS | |
| 1h | Paramètres d'affichage : thème sombre sur `/fr/` | PASS | `data-fr-theme="dark"` |
| 1i | Sections de la home v1 | PASS | h2 des six sections, « Accéder au portail » |
| 1j | Sélecteur de langue atteint `/en/` | PASS | |
| 2a | Catalogue : au moins 1 résultat (7), toutes les requêtes `_search` filtrées | PASS | |
| 2b | Fiche : ouverture, titre, console limitée aux erreurs documentées | PASS | |
| 2c | `organisations` redirige vers la recherche | PASS | |
| 2d | En-tête catalogue : badge « Rechercher », marque vers `/`, pas de navigation, pas de paramètres d'affichage | PASS | |
| 2e | Puces de mots-clés : bascule, `keyword=RRP`, cumul clavier | PASS | |
| 2f | Filtres Thèmes et Mot-clé seuls | PASS (desktop) | mobile ignoré |
| 2g | Lien « Voir sur la carte » de la fiche : format `l=`, même onglet, couche dans la carte | PASS | deux variantes (bouton historique et lien de la section liens) |
| 3a | Carte : canvas, tuiles WMTS 200, gestionnaire de couches | PASS | flakes GPF comptés en annotation |
| 3b | Fonds de carte : photographies aériennes au clavier, tuiles 200 | PASS | |
| 3c | « Données sols » : ajout/retrait de `stock_carbone_fao_fr_wmsv`, GetMap 200 image | PASS | |
| 3d | Liens profonds WMS, WMTS, inconnu (« Couche introuvable ») | PASS | |
| 3e | Vue liste sans carte | PASS | |
| 3f | Mise en page v1 : badge « Explorer », `h1` sr-only, pied compact, barre d'outils au-dessus de la carte, pas de défilement de page | PASS | |
| 3g | Menu « Services » de la carte vers le catalogue | PASS | |
| 3h | Stabilité du rendu : 20 chargements avec canvas et Plan IGN | PASS | 0/20 desktop et mobile |
| 4 | axe sur `/fr/`, `/fr/aide/`, catalogue, fiche, carte, liste : 0 critical/serious | PASS | 1 violation modérée (`heading-order`, catalogue) |
| 5 | Captures desktop + mobile (6 pages) et 2 en-têtes | PASS | `doc/e2e/*.jpg`, toutes < 300 kB |

BLOCKED : aucun. Non couvert, en attente de la partie 2 : outils geopf (M8) et widget Catalog (M9).

### Flakes GPF

Chaque test enregistre `requêtes / non-200` en annotation ; tolérance 10 % des requêtes, au moins 2, uniquement sur `data.geopf.fr`. Aucun flake bloquant sur ce passage complet.

## Défauts par brique

### edito
- D-edito-1 (visuel, mineur) : la capture de la home montre le hero sans visuel d'application, la rangée « Sponsors » absente (voulu) ; rien d'autre. Pas de défaut fonctionnel.
- Un `h2` vide existe dans la page (titre de la modale des paramètres d'affichage) : sans effet visible.

### catalogue
- D-cat-1 (a11y, modérée, amont) : `heading-order` sur la recherche (titres de résultats en `h4`).
- D-cat-2 (comportement) : sur mobile, les filtres Thèmes et Mot-clé sont repliés dans « Affiner votre recherche » ; pas un défaut, mais le test ne les contrôle qu'en desktop.
- Le test historique du bouton « Voir sur la carte » (titre sur l'hôte `gn-ui-button`) passe toujours.

### carto
- D-carto-1 : stabilité du rendu corrigée par M6, 0/20 chargements sans canvas sur ce passage (desktop et mobile).
- D-carto-3 (divergence maquette) : voir « Figma ».
- Pas de défaut fonctionnel.

## Violations axe-core (toutes sévérités)

Fichiers bruts : `doc/e2e/axe-*.json`.

| Page | Règle | Impact | Noeuds |
|---|---|---|---|
| `/fr/` | aucune | | 0 |
| `/fr/aide/` | aucune | | 0 |
| catalogue | `heading-order` | moderate | 1 |
| fiche | aucune | | 0 |
| carte | aucune | | 0 |
| liste | aucune | | 0 |

## Captures

Fichiers : `doc/e2e/{home,aide,catalogue,carto,liste,fiche}-{desktop,mobile}.jpg` et `doc/e2e/en-tete-{home,carto}-{desktop,mobile}.jpg` (home, aide et liste en pleine page).

- Home : héros à fond bleu pâle avec boutons et trois chiffres, frise « Sans / Avec », tuiles, cas d'usage illustrés (images chargées), cartes de données avec étiquettes et bandeau bleu, agenda en carrousel (3 cartes visibles, boutons précédent/suivant), articles, partenaires (logos IGN, INRAE, GIS Sol), pied de page avec partenaires. Pas de débordement ; mobile correct.
- En-têtes : logo République, GIS Sol, logo OSF, séparés par un filet, titre et signature ; badge « EXPLORER » sur la carte ; menus « Aide » et « Services » avec sous-titres (« Le catalogue des données sols », etc.). Mobile : tiroir avec Aide, Services déplié, sélecteur de langue.
- Carte : carte plein cadre sous l'en-tête, barre d'outils (Masquer le panneau, version accessible de la liste), panneau « Fonds de carte » à gauche, pied de page compact sur une ligne. Pas d'écran blanc.
- Catalogue, liste, fiche : voir passes précédentes ; plus de vide sous la recherche ; la capture de la fiche garde une zone au-dessus du résumé qui dépend du chargement de l'aperçu.

## Comparaison Figma

Home (`doc/design/figma-home-1440-light.png`), nouvelles divergences seulement : la home v1 reprend l'ordre et le contenu de la maquette (héros avec chiffres, service Sans/Avec, cas d'usage illustrés, données, agenda, partenaires). Écarts restants : pas de capture d'application dans le héros, pas de vidéo, pas de rangée « Sponsors », encart « Derniers articles » ajouté, pied de page DSFR clair avec partenaires (la maquette a un pied sombre, divergence connue Q7).

Carte (`carto-1-10562.png`), nouvelles divergences :
- le panneau latéral « Fonds de carte / Données sols » est présent alors que la maquette n'a qu'une carte pleine page (les outils et l'ajout de données de la maquette sont les tâches M8/M9) ;
- pas de « Se connecter » (voulu) ;
- le pied de page compact n'a pas « Conditions générales d'utilisation » (la maquette l'a) ; ordre des liens différent (maquette : Plan du site en premier) ;
- le menu « Services » et le badge « Explorer » correspondent à la maquette ; la barre d'outils au-dessus de la carte est un ajout.
