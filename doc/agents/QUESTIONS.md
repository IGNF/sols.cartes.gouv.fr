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

## Q6. Sous-portail GeoNetwork `gissol-osf_c` pour le catalogue (catalogue-dev, C1)
- Question : le sous-portail `gissol-osf_c` (filtre serveur `groupPublished:gissol-osf_g`, les 7 fiches du CSW) existe sur le GeoNetwork GPF, mais son API (`https://data.geopf.fr/geonetwork/gissol-osf_c/api/...`) répond `404 no Route matched` sur la passerelle ; seul `srv` est routé (`/catalog`). L'équipe GPF peut-elle exposer cette route (avec CORS) ?
- Options : (a) route exposée : `geonetwork4_api_url` pointe vers le sous-portail, périmètre garanti par le serveur, sans patch ; (b) pas de route : patch minimal `setConfigFilters({ groupPublished: { 'gissol-osf_g': true } })` dans le datahub (agrégations non filtrées).
- Défaut appliqué : (b) en v0, à remplacer par (a) dès que la route existe. Détails : `doc/agents/geonetwork-ui.md` §2.

## Q7. Version DSFR du catalogue (catalogue-dev, C1)
- Question : le fork IGNF/geonetwork-ui `v1.6.2` embarque `@gouvfr/dsfr` 1.15.3 et `@edugouvfr/ngx-dsfr` 1.20.0 (peer `~1.15.0`) ; le projet épingle 1.14.2.
- Options : (a) forcer 1.14.2 (override npm, risque de casse de ngx-dsfr) ; (b) garder 1.15.3 dans le catalogue seulement.
- Défaut appliqué : (b), écart documenté dans `doc/agents/geonetwork-ui.md` §2.3.

## Q8. Format du lien « Voir sur la carte » (catalogue-dev, C1, pour C4)
- Question : le datahub ouvre `external_viewer_url_template` avec `${layer_name}`, `${service_url}`, `${service_type}` (WMS/WMTS/TMS/GEOJSON), `${geop_type}`, `${tms_style}` ; quel paramètre d'URL la brique carto `/explorer-les-cartes/` acceptera-t-elle ?
- Options : (a) reprendre le format cartes.gouv.fr `?l=<couche>$GEOPORTAIL:<geop_type>:<type>(...)` ; (b) format simple `?layer=${layer_name}&type=${service_type}&url=${service_url}`.
- Défaut proposé : (b), à confirmer avec l'agent carto avant C4.
