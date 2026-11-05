# Plan v1 (refine.md)

Lecture de `.claude/commands/refine.md` par l'orchestrateur, 2026-11-05. Même pipeline qu'en v0 (plan, implémentation, relecture, fusion par PR). Les réponses humaines sont dans `doc/agents/QUESTIONS.md`.

| Tâche | Brique    | Contenu                                                                                                                                                                                                                                     |
| ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X11   | racine    | paquet `@sols/brand` : contenu en-tête/pied de page v1, logos GIS Sol/OSF/IGN/INRAE, illustrations ; spec dans `packages/brand/README.md`                                                                                                   |
| E7    | edito     | en-tête v1 (marque → accueil, logos, badge, menus Aide/Services, pas de barre de navigation, pas de connexion), pied de page v1 (partenaires, paramètres d'affichage, lien GIS Sol corrigé), page `/aide/`, référence `doc/agents/edito.md` |
| E8    | edito     | accueil : textes de la maquette, frise « Sans / Avec », cas d'usage illustrés, données disponibles (cartes + étiquettes + bandeau), agenda en carrousel 11ty, partenaires                                                                   |
| C8    | catalogue | en-tête/pied de page v1 injectés depuis la référence edito, badge « Rechercher », mode sombre si simple                                                                                                                                     |
| C9    | catalogue | autocomplétion et filtres limités au périmètre sols (valeurs et décomptes), puces de mots-clés sous la recherche (G-2)                                                                                                                      |
| C10   | catalogue | boucle infinie `wfs.featuretype.notfound` bornée, bouton « Voir sur la carte » au niveau de la fiche (format `l=`)                                                                                                                          |
| M7    | carto     | mise en page cartes.gouv.fr (carte plein écran, pied de page compact, en-tête v1 avec badge « Explorer »), contrôle de zoom en thème clair/sombre                                                                                           |
| M8    | carto     | outils geopf-extensions comme l'entrée carto de cartes.gouv.fr                                                                                                                                                                              |
| M9    | carto     | ajout de données depuis notre catalogue comme l'entrée carto (widget Catalog)                                                                                                                                                               |
| T3    | e2e       | troisième passe, rapport, captures                                                                                                                                                                                                          |

Ordre : X11 → (E7, C9/C10, M7 en parallèle) → (E8, C8 après E7, M8/M9) → T3 → rapport v1.
