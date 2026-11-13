# Rapport e2e (T5, passe 5)

## Passe 5, résultat final (après #96, #93 à #95 et le correctif #98)

Base : `origin/main` fusionné, trois briques reconstruites, suite complète sur le port 8352 (arrêté ensuite) : **145 réussis, 11 ignorés, 0 échec, 0 flaky**. Le test « le menu Services reste dans l'écran à l'ouverture » passe sur desktop sans modification : le défaut de débordement du panneau est corrigé. Les sections ci-dessous décrivent le premier passage (avant correctif).

## Passe 5 : en-tête compact de la carte (#5, PR #96) et liens légaux (#93, #94, #95)

Date : 2026-11-13. Base : `origin/feat/5-compact-header` fusionné avec `origin/main` (#93 #94 #95) ; les trois briques reconstruites, suite complète sur le port 8351 (arrêté ensuite). La branche de #96 ne contenait pas encore #94 : ces tests exigent #94 sur la base (ils passeront quand #96 sera rebasée sur main).

Résultats : **143 réussis, 11 ignorés, 1 échec, 1 flaky** (catalogue « ouvre une fiche avec un titre », desktop : résultats du catalogue absents au premier essai, bruit amont connu).

Tests adaptés (changements voulus, assertions inchangées sur le fond) : `openServicesMenu` et `openAideMenu` n'ouvrent le burger que s'il existe (`openBurgerIfAny`, edito et catalogue gardent le leur) ; Échap et chevron de la carte sans burger (chevron : `.header-menu__chevron`, le premier `<span>` est le libellé) ; bloc marque : `.fr-header__operator` ignoré sous 36em ; listes de liens `cartes.gouv.fr` autorisées de l'en-tête (« Publier une donnée ») et du pied de page (CGU, données personnelles).

Ajouts (`07-en-tete-compact-legal.spec.ts`) : hauteur ≤ 57 px, pas de burger ni de débordement, Aide/Services atteignables sur mobile carto, « Publier une donnée » dans Services sur les trois briques (externe, `_blank`, `noopener`), deux liens légaux externes du pied de page, `/mentions-legales/` depuis le pied de page (h1, titre, axe sans violation grave).

Défaut réel (FAIL) : **carto, desktop 1280 px, menu « Services » ouvert** : les liens du panneau font 320 px dans un panneau de 288 px ancré à droite (x = 976) ; ils dépassent de 16 px (bord droit à 1296 px), l'icône « lien externe » de « Publier une donnée » touche le bord de l'écran et `scrollWidth` du document vaut 1296 pour 1280. Absent à 375 px. Les liens de 320 px existent aussi sur l'edito, où le panneau n'est pas collé au bord. Gravité : mineure à modérée (clipping, RGAA).

## Passe 4 : v1.1 (en-tête, carte M13)

Date : 2026-11-06. Base : `origin/main` 7759161 (E10 #70, C13 #71, E11 #72, M13 #73, #74, #75 fusionnés), les trois briques reconstruites (`bun run build:all`, sans erreur), suite complète sur le port 8142 (arrêté ensuite).

Résultats mesurés (la flakiness varie d'un passage à l'autre, ne pas se fier à un seul run) :
- Moi, passage complet après #77 (M14) : **128 réussis, 11 ignorés, 0 échec, 1 flaky** (puces de mots-clés du catalogue, desktop, premier essai en échec). Stabilité du rendu : 0/20 sans canvas et 0/20 sans Plan IGN (desktop et mobile). Ignorés : axe sur mobile (9), tracé de mesure à la souris sur mobile, filtres du catalogue sur mobile.
- Relecteur, spécifications 01 à 03 seules, un passage : **79 réussis, 1 ignoré, 0 échec, 4 flaky** : « Voir sur la carte » (desktop, `02-catalogue.spec.ts`), canvas et tuiles (desktop, `03-carto.spec.ts`), onglet « Fonds de cartes » (desktop, case non trouvée) et stabilité mobile (1/20 chargements sans Plan IGN dans la liste des couches).
- Antérieur à #77 : moi 128 réussis, 0 flaky ; relecteur, deux passages complets : 126 réussis, 2 flaky chacun.
- Après ce tour : `03-carto.spec.ts`, 32 réussis (hors test de stabilité de 2 minutes), 0 flaky, sur mon port.
Corrections de test conservées : attente bornée (20 s) des entrées de l'onglet « Fonds de cartes » avec un nouveau clic d'onglet si la liste est vide (l'onglet reste vide tant que les capacités WMTS n'arrivent pas, puis le catalogue est reconstruit), case visible avant `focus()` + Espace, délai du test de stabilité 40 s par chargement, Échap dans « Aide » vérifié aussi sur mobile. Les assistants de réessai de clic (`openAideMenu`, `openServicesMenu`) sont voulus : bornés à 15 s, ils couvrent un clic avant que le JS DSFR soit prêt (`data-fr-js` posé avant l'attache des gestionnaires).

| # | Scénario | Statut | Preuve |
|---|---|---|---|
| 1m | Menu « Aide » fr, en (« Help ») : deux liens externes `https://cartes.gouv.fr/aide/<lang>/` et `.../aide/fr/nous-ecrire/`, `target="_blank"`, `rel="noopener external"`, icône avant (masque) et icône « lien externe » après | PASS | edito fr/en, catalogue, carte ; desktop et mobile |
| 1n | Seuls les liens d'aide pointent vers cartes.gouv.fr dans l'en-tête ; pied de page sans lien cartes.gouv.fr | PASS | |
| 1o | Échap depuis l'intérieur du menu « Aide » le ferme, focus rendu ; sur mobile le menu burger reste ouvert | PASS | correctif E11 ; desktop et mobile |
| 1p | Thème sombre : logos de l'en-tête sans fond (`.fr-header__operator`, `.sols-operator*` transparents) | PASS | |
| 2h | Badge « Rechercher » : `fr-badge--green-menthe fr-badge--icon-left fr-icon-search-line` | PASS | |
| 3o | Badge « Explorer » : `fr-badge--purple-glycine fr-badge--icon-left fr-icon-map-pin-2-fill` | PASS | |
| 3p | Carte v1.1 : plus de panneau latéral, de « Partager », de « Sources des données », de lien vers la vue liste ; bouton « Imprimer » en haut à gauche ; pas de défilement de page | PASS | desktop et mobile |
| 3q | Catalogue de cartes : onglets « Données sols » et « Fonds de cartes » ; bascule sur « Photographies aériennes » au clavier (Espace), tuiles ORTHOIMAGERY 200 | PASS | attente bornée des fonds ; flaky selon les passages (voir D-carto-8) |
| 3r | Catalogue : ajout (GetMap 200 image) et retrait d'une couche sols, lien profond coche l'entrée | PASS | |
| 3s | Outils par défaut (distance, surface, itinéraire, annoter) visibles ; autres cachés ; « Afficher tous les outils » dernier de la colonne ; sélection au clavier ajoute le bouton, ferme la liste, rend le focus | PASS | |
| 3t | Mesure de distance, Imprimer (PNG), Légendes (image), console propre hors bruits amont, partage retiré | PASS | |
| 3u | Plein écran en bas à droite, échelle à sa gauche (≤ 24 px) en bleu action | PASS | |
| 3v | Pied de page : « Haut de page » déplie (partenaires visibles, page défilable), « Fermer » replie (défilement restauré) | PASS | |
| 3w | Bloc marque de l'en-tête cliquable (centre du logo, de l'opérateur et du service : lien `/`) | PASS | |
| 3n' | Stabilité du rendu de la carte (20 chargements) | PASS | 0/20 |
| 4 | axe : `/fr/`, `/fr/aide/`, catalogue, fiche, carte, liste, carte catalogue ouvert, carte liste d'outils ouverte, carte pied de page déplié : 0 critical/serious | PASS | seule `heading-order` (modérée) sur le catalogue ; axe en desktop (survol de la marque évité par `page.mouse.move`) |
| 5 | Captures desktop + mobile, y compris carte catalogue ouvert, liste d'outils, pied de page déplié | PASS | `doc/e2e/*.jpg` < 300 kB |

BLOCKED : aucun.

### Défauts par brique

- **edito** : rien de nouveau.
- **catalogue** : `heading-order` modérée (amont) ; rien de nouveau.
- **carto**
  - D-carto-7 (visuel, **corrigé par #77**, confirmé) : l'infobulle « Catalogue de cartes » recouvrait le titre du panneau à 1280×900 ; sur la capture finale le panneau affiche son titre et sa croix, sans infobulle.
  - D-carto-8 : corrigé côté application par #77 ; le test attend désormais le chargement des fonds (l'onglet est vide tant que les capacités WMTS n'arrivent pas). À 375×812 : ouvrir « Catalogue de cartes », cliquer l'onglet « Fonds de cartes », cocher « Photographies aériennes » trop tôt laissait la case décochée ; un échec « case non trouvée » a encore été vu sur desktop par le relecteur.
  - D-carto-9 (**corrigé par #77**, confirmé) : à 375 px le panneau s'intitulait « Mes outils » ; il s'intitule « Tous les outils » (`carto-outils-mobile.jpg`).
  - D-carto-11 (rare, environ 1 chargement sur 20 à 375 px, projet mobile) : aucun « Plan IGN » dans la liste des couches (« Ma sélection de cartes ») alors que la carte est chargée ; vu par le relecteur sur le test de stabilité. Défaut applicatif possible, pas du bruit réseau : en cours d'investigation par un agent carto (M15).
  - D-carto-10 (non reproduit) : le relecteur de M14 a vu, à 1280 px, le clic sur « Afficher tous les outils » pour fermer la liste intercepté par un élément `GPlayerDragNDrop`. Essais : ouvrir puis fermer la liste à 1280×900 (carte nue et avec une couche ajoutée, gestionnaire de couches ouvert), 1280×720 et 1440×900 : le second clic aboutit chaque fois (liste fermée).

### Figma (carte, nœud `1:10562`), nouvelles divergences seulement

La mise en page se rapproche de la maquette (carte pleine page, pied de page compact, badge à icône). Restent : pas de « Se connecter » (voulu), le pied de page compact n'a pas « Conditions générales d'utilisation » et l'ordre des liens diffère (déjà noté en partie 1 : non répété) ; nouveau : le pied de page se déplie par un bouton « Haut de page » (la maquette montre un simple chevron) et la carte porte des colonnes d'outils à gauche et à droite que la maquette ne détaille pas.

---

# Rapport e2e (T3, passe 3)

(Rapport de la passe 3 ci-dessous ; la passe 4 est en tête de fichier.)

## Passe 3, vérification finale (après M12)

Date : 2026-11-06. Base : `origin/main` 1d834c2 (M12 #66 fusionné), briques reconstruites (`bun run build:all`), suite complète sur le port 8148 (arrêté ensuite).

Résultat : **103 réussis, 15 ignorés, 0 échec, 0 flaky**, identique à la partie 2 ; aucune assertion n'a dû être modifiée pour la nouvelle géométrie (le contournement mobile « fermer le catalogue par son bouton » reste valide ; l'ouverture de la liste des couches remplace maintenant le panneau du catalogue).

M12 confirmé à la mesure (sonde Playwright) et sur les captures régénérées :
- D-carto-5 corrigé par #66 : à 1280×900 le panneau du catalogue s'adapte au contenu (512 px vide, 320 px avec la recherche « carbone »), la première entrée n'est plus coupée.
- D-carto-6 corrigé par #66 : à 375×812 le panneau fait 307 px de large (`calc(100vw - 4.25rem)`), ancré à gauche de son bouton ; « Ma sélection de cartes » reste visible et atteignable (boîte à x=319).
- Observation mineure : sur mobile, l'infobulle « Catalogue des données sols » du bouton chevauche le titre du panneau tant que le bouton garde le survol.

Les captures de `doc/e2e/` sont régénérées par ce passage. Les sections suivantes restent valables, avec D-carto-5 et D-carto-6 désormais corrigés.

Ce rapport garde la partie 1 (v1 : en-tête, pied de page, home, aide, puces) puis ajoute la partie 2 (carte : outils geopf, catalogue des données sols). Partie 1 en dessous de la partie 2.

`axe-fiche.json` a été régénéré lors de cette passe et est vide (0 violation sur la fiche à ce run).

## Passe 3, partie 2 : outils de la carte et catalogue des données sols

Date : 2026-11-06. Base testée : branche `feat/T3-e2e-part2` = `origin/main` (qui contient M8 #56, M9 #60 tête `55a552a`, M10, M11, E9/C12) fusionné ; les trois briques ont été reconstruites (`bun run build:all`, sans erreur) et servies sur le port 8142. Un premier passage avait échoué en masse parce que le serveur d'aperçu avait été arrêté par un autre agent en cours de route (tests à ~100 ms, connexion refusée) : il a été relancé sous surveillance et le passage retenu est complet.

Résultat du dernier passage complet : **103 réussis, 15 ignorés, 0 échec, 0 flaky**. Ignorés : axe sur mobile (8), outils geopf sur mobile (6 : leurs boutons sont masqués sous 48em, ils s'ouvrent par « Mes outils », test dédié), filtres du catalogue sur mobile (1) ; le test « Mes outils » tourne en desktop et mobile. Contrôle de types : `bun run typecheck`.

| # | Scénario | Statut | Preuve |
|---|---|---|---|
| 3b | Fonds de carte (plus d'onglets) : photographies aériennes au clavier, tuiles 200 | PASS | le panneau latéral ne contient que les fonds ; aucun `tab` |
| 3c | Catalogue des données sols : bouton, recherche « carbone », case « Ajouter à la carte : … » (Espace) : GetMap 200 image, couche dans le gestionnaire, décocher la retire | PASS | desktop et mobile (sur mobile le catalogue recouvre le gestionnaire : fermeture par « Fermer le panneau ») |
| 3d' | Lien profond `?l=…` coche l'entrée du catalogue | PASS | |
| 3e' | Couche du Loiret cassée côté serveur (M-4) : avis « Couche indisponible » | PASS | `role=alert` ou `status` |
| 3f' | Quinze boutons d'outils avec nom accessible, aucune fenêtre geopf sans nom | PASS | desktop |
| 3g' | « Mes outils » : activation clavier d'une entrée lance l'outil, liste fermée, focus rendu | PASS | desktop et mobile (correctif de M8) |
| 3h' | Mesure de distance : valeur affichée | PASS | |
| 3i | Partager : permalien (`l=` fond + couche, `c`, `permalink=yes`) rouvert dans une page neuve : mêmes fonds et couches | PASS | |
| 3j | Imprimer : téléchargement PNG | PASS | |
| 3k | Légendes : accordéon déplié, image chargée pour la couche sols ajoutée | PASS | |
| 3l | Console du parcours outils : aucune erreur hors bruits amont documentés (`Greyscale`, complétion vide, flake GPF) | PASS | |
| 3m | Chevron du menu « Services » de la carte se retourne (M10) | PASS | desktop et mobile |
| 3n | Stabilité du rendu de la carte (20 chargements) | PASS | 0/20 sans canvas |
| 1k | Échap ferme seulement le sous-menu « Services » : edito, catalogue, carte, desktop et mobile (E9/C12) | PASS | l'ancien test sauté est réactivé |
| 4' | axe : carte avec le catalogue ouvert, carte avec « Mes outils » ouvert, et les six pages de la partie 1 : 0 critical/serious | PASS | `heading-order` (modérée) sur le catalogue et, intermittent, sur la fiche |
| 5' | Captures : carte catalogue ouvert, carte « Mes outils » ouvert, desktop et mobile | PASS | `doc/e2e/carto-catalogue-*.jpg`, `carto-outils-*.jpg` (< 300 kB) |

BLOCKED : aucun. Note axe : l'axe tourne en desktop uniquement ; sur mobile en thème sombre, M-5 (survol de la marque, contraste du bouton « Menu ») est un état DSFR amont, à éviter avec `page.mouse.move(200, 400)` si on lance axe en mobile.

### Défauts par brique (partie 2)

- **carto**
  - D-carto-5 (visuel) : à 1280x900, le panneau du catalogue des données sols s'ouvre sur une hauteur d'environ 210 px quand on y filtre « carbone » : la première entrée est coupée (capture `carto-catalogue-desktop.jpg`). Sur mobile le panneau est plein écran et lisible.
  - Observation corrigée : la liste de « Mes outils » restait ouverte après Entrée avant le correctif de M8 (#56) ; depuis, elle se ferme et le focus revient sur « Mes outils » (test vert).
  - D-carto-6 (mobile, 375×812) : le panneau du catalogue des données sols, ouvert en plein écran, recouvre le bouton « Ma sélection de cartes » : ouvrir « Catalogue des données sols », puis essayer d'atteindre « Ma sélection de cartes » (le clic est intercepté par « Fermer le panneau » du catalogue). Contournement du test : fermer le catalogue par son bouton « Fermer le panneau ».
  - corrigé par #66 : `fix/M12-catalogue-panel-size` traite D-carto-5 (hauteur du panneau) et D-carto-6.
- **catalogue** : `heading-order` modérée sur la recherche (amont) et sur la fiche selon le chargement ; rien de nouveau.
- **edito** : rien de nouveau.

### Figma (carte, nœud `1:10562`), nouvelles divergences seulement

Depuis la partie 1 un seul point change : le panneau latéral ne contient plus que les fonds de carte (les onglets ont disparu, l'ajout de données passe par le catalogue et les outils par « Mes outils »). Aucune autre nouvelle divergence.

---

# Partie 1 (v1 : en-tête, pied de page, home, aide, puces)

Date : 2026-11-05. Base : `origin/main` 360b0c0 (v1 : X11, E7, E8, C8 à C11, M7 fusionnés ; M8 et M9 pas encore). Les trois briques ont été construites (`bun run build:all`, sans erreur) et servies sur le port 8133. Chromium headless, projets `desktop` (1280x900) et `mobile` (375x812). Aucun appel réseau simulé.

Lancer : `cd e2e && bun i && PORT=8133 bun run test` (`dist/` doit exister ; `reuseExistingServer` hors CI : la suite teste le serveur déjà présent sur le port, un avertissement est affiché). Exécution séquentielle, 1 retry. Captures JPEG (< 300 kB, qualité abaissée automatiquement si besoin) et JSON axe écrits dans `doc/e2e/`. Contrôle de types : `bun run typecheck`.

Résultat du dernier passage complet : **79 réussis, 8 ignorés, 0 échec**, 1 flaky au dernier passage (menu « Services » de l'edito : Entrée pressée avant l'initialisation du JS DSFR ; corrigé par une attente de `data-fr-js`, 27/27 sur 3 répétitions ensuite). Ignorés : axe sur mobile (6), Échap du sous-menu « Services » de l'edito sur mobile (la modale du menu burger se ferme en entier, voir D-edito-2), filtres du catalogue sur mobile (repliés dans « Affiner votre recherche »).

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
| 1e | Menu « Services » : Entrée ouvre, Échap ferme, focus rendu (desktop) | PASS | mobile : ouverture seulement (voir D-edito-2) |
| 1f | Menu « Services » mène au catalogue et à la carte (200, un h1 visible) | PASS | |
| 1g | Page `/fr/aide/` avec `#contact` | PASS | |
| 1h | Paramètres d'affichage : thème sombre sur `/fr/` | PASS | `data-fr-theme="dark"` |
| 1i | Sections de la home v1 | PASS | cinq motifs de `h2` (Localisez, usages métier, référentiels structurés, prochains rendez-vous, partenaires) et le lien « Accéder au portail » |
| 1j | Sélecteur de langue atteint `/en/` | PASS | |
| 2a | Catalogue : au moins 1 résultat (7), toutes les requêtes `_search` filtrées | PASS | |
| 2b | Fiche : ouverture, titre, console limitée aux erreurs documentées | PASS | |
| 2c | `organisations` redirige vers la recherche | PASS | |
| 2d | En-tête catalogue : badge « Rechercher », marque vers `/`, pas de navigation, pas de paramètres d'affichage | PASS | |
| 2e | Puces de mots-clés : bascule, `keyword=RRP`, cumul clavier | PASS | |
| 2f | Filtres Thèmes et Mot-clé seuls | PASS (desktop) | mobile ignoré |
| 2g | Lien « Voir sur la carte » de la fiche : `l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)` (href décodé), même onglet, couche dans la carte | PASS | deux variantes (bouton historique et lien de la section liens) |
| 3a | Carte : canvas, tuiles WMTS 200, gestionnaire de couches | PASS | flakes GPF comptés en annotation |
| 3b | Fonds de carte : photographies aériennes au clavier, tuiles 200 | PASS | |
| 3c | « Données sols » : ajout/retrait de `stock_carbone_fao_fr_wmsv`, GetMap 200 image | PASS | |
| 3d | Liens profonds WMS, WMTS, inconnu (« Couche introuvable ») | PASS | |
| 3e | Vue liste sans carte | PASS | |
| 3f | Mise en page v1 : badge « Explorer », `h1` sr-only, pied compact, barre d'outils au-dessus de la carte, pas de défilement de page | PASS | |
| 3g | Menu « Services » de la carte : vers le catalogue ; Échap ferme seulement le sous-menu (desktop et mobile) | PASS | |
| 3h | Stabilité du rendu : 20 chargements avec canvas et Plan IGN | PASS | 0/20 desktop et mobile |
| 4 | axe sur `/fr/`, `/fr/aide/`, catalogue, fiche, carte, liste : 0 critical/serious | PASS | `heading-order` (modérée) intermittent : catalogue présent à chaque passage (3 sur 3), fiche présent à 1 passage sur 3 (selon le chargement de la page) ; voir « Violations axe-core » |
| 5 | Captures desktop + mobile (6 pages) et 2 en-têtes | PASS | `doc/e2e/*.jpg`, toutes < 300 kB |

BLOCKED : aucun. Non couvert, en attente de la partie 2 : outils geopf (M8) et widget Catalog (M9).

### Flakes GPF

Chaque test enregistre `requêtes / non-200` en annotation ; tolérance 10 % des requêtes, au moins 2, uniquement sur `data.geopf.fr`. Aucun flake bloquant sur ce passage complet.

## Défauts par brique

### edito
- D-edito-2 (clavier, mineur) : sur mobile, Échap dans le menu burger ferme toute la modale, alors que sur la carte il ne ferme que le sous-menu « Services » (le test carto passe sur mobile). Incohérence entre briques.
- D-edito-1 (visuel, mineur) : la capture de la home montre le hero sans visuel d'application, la rangée « Sponsors » absente (voulu) ; rien d'autre. Pas de défaut fonctionnel.
- Un `h2` vide existe dans la page (titre de la modale des paramètres d'affichage) : sans effet visible.

### catalogue
- D-cat-1 (a11y, modérée, amont) : `heading-order` sur la recherche (titres de résultats en `h4`).
- D-cat-2 (comportement) : sur mobile, les filtres Thèmes et Mot-clé sont repliés dans « Affiner votre recherche » ; pas un défaut, mais le test ne les contrôle qu'en desktop.
- Le test historique du bouton « Voir sur la carte » (titre sur l'hôte `gn-ui-button`) passe toujours.

### carto
- D-carto-1 : stabilité du rendu corrigée par M6, 0/20 chargements sans canvas sur ce passage (desktop et mobile).
- D-carto-3 (visuel, mineur) : à l'ouverture du menu « Services » de la carte, le chevron reste orienté vers le bas (capture `en-tete-carto-desktop.jpg`) ; il se retourne sur l'edito. À vérifier à la main.
- Divergences de maquette : voir « Comparaison Figma ».
- Pas de défaut fonctionnel.

## Violations axe-core (toutes sévérités)

Fichiers bruts : `doc/e2e/axe-*.json`.

| Page | Règle | Impact | Noeuds |
|---|---|---|---|
| `/fr/` | aucune | | 0 |
| `/fr/aide/` | aucune | | 0 |
| catalogue | `heading-order` | moderate | 1 (3 passages sur 3) |
| fiche | `heading-order` | moderate | 0 à 1 selon le passage (présent sur 1 passage, absent sur 2) ; le JSON commité de la dernière exécution : 0 |
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

Carte (maquette Figma, nœud `1:10562`, non copiée dans le dépôt), nouvelles divergences seulement :
- le panneau latéral « Fonds de carte / Données sols » n'est pas dans la maquette (les outils et l'ajout de données sont les tâches M8/M9) ;
- le pied de page compact n'a pas le lien « Conditions générales d'utilisation » de la maquette ;
- ordre des liens du pied de page différent (maquette : « Plan du site » en premier) ;
- la barre d'outils au-dessus de la carte (Masquer le panneau, liste accessible) est un ajout.
