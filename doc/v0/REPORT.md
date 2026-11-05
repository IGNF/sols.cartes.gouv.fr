# Rapport v0 : squelette local de sols.cartes.gouv.fr

Date : 2026-11-05. Orchestrateur : Claude Fable 5.1, agents de brique Opus 5.5, testeur e2e Sonnet 5.5. Toutes les PR sont fusionnées dans `main` après relecture par un agent `reviewer` indépendant (voir `doc/STATUS.md`), sauf la PR Docker #15 laissée ouverte volontairement.

## 1. Ce qui fonctionne

`bun i && bun run build:all && bun run preview:all` sert les trois briques sous une origine sur <http://localhost:8080> (build complet : environ 1 min 30 s, `dist/` 20 Mo ; la brique catalogue clone IGNF/geonetwork-ui v1.6.2 et pèse 2 Go de `node_modules`, 4,9 Go de RAM en pic).

| Brique                                                                                               | Chemin                    | Contenu v0                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| edito (Eleventy 3, DSFR 1.14.2)                                                                      | `/` → `/fr/`, `/en/`      | accueil (ordre des sections de la maquette, textes provisoires), 4 pages de pied de page, articles (collection Markdown, liste, gabarit), sitemap, robots, canonique, vérificateur de liens, i18n fr/en avec pages de renvoi sur les anciens chemins, en-tête/pied de page de référence (`doc/agents/edito.md`)                                                                                         |
| catalogue (IGNF/geonetwork-ui datahub v1.6.2, DSFR 1.15.3)                                           | `/rechercher-une-donnee/` | périmètre « sols » (7 fiches) forcé sur toutes les requêtes Elasticsearch, interface en français, en-tête/pied de page injectés depuis la référence edito, bouton « Voir sur la carte » au format cartes.gouv.fr, 0 violation axe critique/sérieuse sur la page de recherche                                                                                                                            |
| carto (Vite, React 19, react-dsfr 1.36, OpenLayers 10.11, geopf-extensions-openlayers 1.0.0-beta.16) | `/explorer-les-cartes/`   | fond Plan IGN v2 + catalogue de 5 fonds WMTS validés contre les capacités, outils (zoom, échelle, attribution, plein écran, recherche de lieu GPF, rotation), panneau « Données sols » généré depuis le CSW (12 couches validées, 14 rejets documentés), lien profond `l=` cartes.gouv.fr et alias simple, vue liste accessible sans carte (`?vue=liste`), 174 tests, 0 violation axe critique/sérieuse |

Racine : workspaces bun (edito, carto), catalogue en npm, scripts `lint`/`test`/`build:all`/`preview:all`, CI GitHub Actions filtrée par chemin (4 workflows), suite Playwright `e2e/` avec axe-core et captures (`doc/e2e/`).

## 2. BLOQUÉ ou dégradé (hors code du projet)

| Sujet                                  | Détail                                                                                                                                                                                                                | Où                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Sous-portail GeoNetwork `gissol-osf_c` | Existe côté serveur mais sa route API n'est pas exposée par la passerelle GPF (404/403) ; le périmètre est donc forcé par patch (`0001`, `0005`) au lieu d'une configuration serveur.                                 | `QUESTIONS.md` C-1, `doc/catalogue-patches.md` |
| Tuiles WMTS en erreur intermittente    | `data.geopf.fr/wmts` répond parfois 400/404 à des requêtes valides, surtout en parallèle ; nouvel essai unique côté carto ; signalé à la GPF par l'humain.                                                            | M-2                                            |
| Couches Loiret cassées côté serveur    | `rrp_loiret_gpkg_11-09-2026_wmsv` et `rrp_dept_loiret_gpkg_11-09-2026_wmsv` renvoient une `ServiceExceptionReport` (HTTP 200) au GetMap ; la carto affiche « Couche indisponible ». À signaler GPF/INRAE.             | M-4                                            |
| Noms du CSW absents des services       | 4 noms (`INRAE_CARTE-SOLS_WMTS`, `inrae_carte_sols_wmsr`, `INRAE_CARTE-SOLS` sur wms-v, `etude_34015_gpkg_04-09-2026_wmsv`) et 10 noms courts WFS ; rejetés par le générateur, à corriger dans les métadonnées INRAE. | `doc/agents/gpf-sols-data.md` §5               |
| TMS vecteur (styles MapLibre)          | Lien « Voir sur la carte » TMS non chargé en v0 (avis « Format non pris en charge » avec le style nommé).                                                                                                             | M5                                             |
| CodeQL « Analyze (actions) »           | Job de la configuration par défaut GitHub en échec sur certaines PR (« could not process any code written in GitHub Actions ») ; réglage dépôt, pas de fichier à changer.                                             | X4                                             |

## 3. Ce qui demande un humain

- Validation du contenu : tous les textes sont provisoires (« texte provisoire » / « placeholder text ») ; titres des cartes « Données disponibles » (E-1, l'humain s'en charge) ; description du pied de page ; article de démonstration.
- Audit RGAA au-delà d'axe : axe passe sur les trois pages principales ; les fiches du catalogue gardent des violations amont (button-name, label, contraste) listées dans `doc/catalogue-patches.md` ; le widget de recherche geopf-ext a des lacunes amont documentées (`doc/agents/geopf-ext.md`).
- Revue design : écarts v0 vs maquette listés dans `doc/design/README.md` (pied de page DSFR gardé, outils d'en-tête Aide/Services/Se connecter hors périmètre, agenda/partenaires/chiffres non repris).
- Signalements externes : route du sous-portail (GPF), tuiles WMTS (fait), couches Loiret (GPF/INRAE), métadonnées CSW (INRAE), correctifs d'accessibilité amont à proposer à geonetwork/geonetwork-ui (patch 0004) et IGNF/geopf-extensions-openlayers.
- Déploiement : PR Docker #15 (brouillon, non fusionnée) ; redirection 301 des anciens chemins edito à configurer côté serveur (E-2).

## 4. Questions ouvertes

Voir `doc/agents/QUESTIONS.md` : réponses humaines du 2026-11-05 intégrées (Q1–Q7, M-1, E-1, C-2, C-3, E-2, M-2) ; restent ouvertes C-1 (sous-portail, « je creuse »), M-3 (source de validation TMS), M-4 (Loiret).

## 5. Écarts de processus

- Les fichiers `.claude/agents/*.md` n'étaient pas chargeables dans la session qui les a créés ; les agents sont devenus disponibles après la fusion de X2, et les relectures suivantes ont utilisé le type `reviewer`.
- Un agent carto a réécrit l'historique d'une branche (rebase + push forcé) pour M1 ; règle rappelée dans les fichiers d'agents, plus de récidive.
- Le fichier partagé `doc/agents/QUESTIONS.md` a provoqué des conflits sur 7 PR ; préfixes par brique adoptés (`E-n`, `C-n`, `M-n`).
- Les réponses humaines écrites dans l'arbre de travail ont été entraînées dans une PR de formatage (#33) puis isolées dans la PR #34.

## 6. Résultat de la passe e2e finale (T2, PR #37)

Suite Playwright `e2e/` rejouée par un relecteur dans un checkout isolé sur `main` incluant M6 (#39) et C7 (#40) : 49 tests passés, 5 ignorés (axe mobile, par conception), 0 échec, 0 instable (5 min 30 s). Tous les scénarios du §7 d'`init.md` sont PASS : accueil (renvoi, h1, liens, bascule de langue, console), catalogue (7 résultats, filtre sols sur toutes les requêtes `_search` y compris agrégations, fiche, « Voir sur la carte » au format `l=`, redirection `/organisations`), carte (canvas, tuiles 200, changement de fond au clavier, ajout/retrait d'une couche sols, liens profonds `l=`, vue liste), axe 0 critique/sérieuse sur accueil, recherche, fiche, carte et vue liste, captures bureau et mobile.

Défauts résiduels (documentés dans `doc/e2e/REPORT.md`) :

- **D-carto-1 résiduel** : la cause principale (requêtes de capacités WMTS acceptées puis jamais répondues par la GPF) est corrigée par un délai de 3 s et 4 nouveaux essais (M6) ; 0/40 chargements sans canvas chez le développeur et 0/20 chez le relecteur, mais le testeur e2e a vu 1/20 sur mobile sur un run. Le test de stabilité consigne les compteurs en annotations.
- **Catalogue** : un `heading-order` modéré (titres `h4` amont) ; capture de fiche prise avant le rendu de l'aperçu carte (vérification manuelle demandée).
- **Aléas GPF** comptés à part : 400/404 sur des tuiles Plan IGN, 502 WMTS/WMS ponctuels (tolérés à 10 % des requêtes).

## 7. État final

Tout est fusionné dans `main` sauf la PR Docker #15 (brouillon volontaire). Les tâches E1–E6, C1–C7, M1–M6, X1–X4, X7–X9, T1–T2 sont terminées (`doc/STATUS.md`). Reste à faire par un humain : les signalements externes du §3, la validation des contenus, la décision C-1, et la relecture de la PR #15 le jour du déploiement.
