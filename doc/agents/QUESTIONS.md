# Questions ouvertes (v0)

Décisions prises par l'orchestrateur sans validation humaine. Chaque entrée : question, options, choix par défaut appliqué.

## Q1. Dossier de documentation `docs/` vs `doc/`

- Question : `.gitignore` ignorait `/docs` (mais `docs/README.md` et `docs/developper/` étaient suivis), alors que `CLAUDE.md` et `init.md` utilisent `doc/`.
- Options : (a) garder `docs/` et corriger les références ; (b) renommer en `doc/` et retirer l'ignore.
- Défaut appliqué : (b). `docs/agents/gissol-osf_c.xml` (non suivi car ignoré) est copié dans `doc/agents/`.

## Q2. Suppression du template `bun-react-template`

- Question : la racine contenait un scaffold `bun init` (`src/`, `bunfig.toml`, `tsconfig.json`, API « hello world »). L'app carto vit dans `apps/explorer-les-cartes`.
- Options : (a) conserver le scaffold ; (b) le supprimer lors de la mise en place du monorepo.
- Défaut appliqué : (b), le code est restaurable depuis l'historique git (`e492f9f`).

## Q3. Version DSFR épinglée

- Question : `@gouvfr/dsfr` dernier = 1.15.4 ; `@codegouvfr/react-dsfr` 1.36.0 embarque DSFR 1.14.2 ; `geopf-extensions-openlayers` 1.0.0-beta.16 dépend de `@gouvfr/dsfr` 1.14.4.
- Options : (a) 1.15.4 partout (incompatible avec la copie embarquée par react-dsfr) ; (b) 1.14.2, la version que react-dsfr impose de fait à la brique carto.
- Défaut appliqué : (b) `1.14.2`, déclarée dans `package.json` racine (`config.dsfrVersion`). Les briques edito et catalogue chargent cette version ; la brique carto passe par react-dsfr.

## Q4. Branche d'intégration

- Question : `init.md` §3 mentionne une « integration branch » puis dit que chaque tâche part de `main` et finit en PR vers `main`.
- Défaut appliqué : pas de branche d'intégration intermédiaire ; `main` n'est modifiée que par PR, une par tâche.

## Q5. `.claude/commands/init.md` modifié localement

- Constat : le fichier était modifié (non commité) au démarrage. L'orchestrateur ne le commite pas ; c'est à l'humain de valider ce changement.

## Q6. Lien « gouvernement.fr » du pied de page (edito, E1)

- Question : la consigne cite gouvernement.fr parmi les liens obligatoires du pied de page ; le DSFR 1.14 utilise désormais `info.gouv.fr` (gouvernement.fr y redirige).
- Options : (a) `https://www.gouvernement.fr` ; (b) `https://www.info.gouv.fr` comme le gabarit DSFR 1.14.
- Défaut appliqué : (b). Modifiable en une ligne dans `apps/accueil/src/_data/site.js` (`external.gouvernement`).

## Q7. Pied de page de la maquette (edito, E2)
- Question : la maquette Figma (frame « 1440w light », nœud 8:4414) propose un pied de page sombre personnalisé : titre « Observatoire des Sols de France », « Le portail d'accès aux données des sols pour les territoires. Un service piloté par INRAE · Incubé par beta.gouv.fr », trois liens (contenu non défini) et « 2026 INRAE GIS Sol ».
- Options : (a) reproduire ce bloc sombre (hors DSFR, contenu à valider : pilotage, incubation) ; (b) garder le pied de page DSFR standard (marque, liens obligatoires, liens bas, licence).
- Défaut appliqué : (b) pour la v0 ; le contenu de la maquette pourra être repris dans `site.footer.description` une fois validé.

## M-1. Libellé « Site du GIS Sol » dans les liens de contenu du pied de page carto (carto-dev, M1)
- Constat : le `Footer` de react-dsfr 1.36.0 ne propose que `domains` pour la liste de liens de contenu ; chaque entrée est rendue avec le domaine comme libellé et `https://<domaine>` comme cible. La brique edito affiche « Site du GIS Sol » → `https://www.gissol.fr/` (et des cibles en `www.`).
- Options : (a) garder `domains` : le lien se lit « gissol.fr » → `https://gissol.fr` (redirige vers le site) ; (b) l'edito renomme son libellé en « gissol.fr » pour une parité exacte ; (c) balisage personnalisé côté carto (contraire à « utiliser les props react-dsfr »).
- Défaut appliqué : (a) côté carto ; (b) proposé à l'edito. Même liste, même ordre, même phrase de licence et même titre du lien d'accueil.
