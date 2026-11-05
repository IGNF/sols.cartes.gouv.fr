# Questions ouvertes (v0)

Décisions prises par l'orchestrateur sans validation humaine. Chaque entrée : question, options, choix par défaut appliqué.

## Q1. Dossier de documentation `docs/` vs `doc/`

- Question : `.gitignore` ignorait `/docs` (mais `docs/README.md` et `docs/developper/` étaient suivis), alors que `CLAUDE.md` et `init.md` utilisent `doc/`.
- Options : (a) garder `docs/` et corriger les références ; (b) renommer en `doc/` et retirer l'ignore.
- Défaut appliqué : (b). `docs/agents/gissol-osf_c.xml` (non suivi car ignoré) est copié dans `doc/agents/`.
-> ok sur la documentation et les agents, le choix te reviens ce sont des 'détails' car ne concerne pas directement le code.

## Q2. Suppression du template `bun-react-template`

- Question : la racine contenait un scaffold `bun init` (`src/`, `bunfig.toml`, `tsconfig.json`, API « hello world »). L'app carto vit dans `apps/explorer-les-cartes`.
- Options : (a) conserver le scaffold ; (b) le supprimer lors de la mise en place du monorepo.
- Défaut appliqué : (b), le code est restaurable depuis l'historique git (`e492f9f`).
-> Tu l'as déjà appliqué et cela semble correct

## Q3. Version DSFR épinglée

- Question : `@gouvfr/dsfr` dernier = 1.15.4 ; `@codegouvfr/react-dsfr` 1.36.0 embarque DSFR 1.14.2 ; `geopf-extensions-openlayers` 1.0.0-beta.16 dépend de `@gouvfr/dsfr` 1.14.4.
- Options : (a) 1.15.4 partout (incompatible avec la copie embarquée par react-dsfr) ; (b) 1.14.2, la version que react-dsfr impose de fait à la brique carto.
- Défaut appliqué : (b) `1.14.2`, déclarée dans `package.json` racine (`config.dsfrVersion`). Les briques edito et catalogue chargent cette version ; la brique carto passe par react-dsfr.
-> oui c'est le plus logique, en théorie pas besoin d'importer `@gouvfr/dsfr`, donc la dernière version de react-dsfr et geopf. Le reste va suivre.

## Q4. Branche d'intégration

- Question : `init.md` §3 mentionne une « integration branch » puis dit que chaque tâche part de `main` et finit en PR vers `main`.
- Défaut appliqué : pas de branche d'intégration intermédiaire ; `main` n'est modifiée que par PR, une par tâche.
-> ok

## Q5. `.claude/commands/init.md` modifié localement

- Constat : le fichier était modifié (non commité) au démarrage. L'orchestrateur ne le commite pas ; c'est à l'humain de valider ce changement.
-> Tu peux le commit, c'est un oublies de ma part avant initilisation 

## Q6. Lien « gouvernement.fr » du pied de page (edito, E1)

- Question : la consigne cite gouvernement.fr parmi les liens obligatoires du pied de page ; le DSFR 1.14 utilise désormais `info.gouv.fr` (gouvernement.fr y redirige).
- Options : (a) `https://www.gouvernement.fr` ; (b) `https://www.info.gouv.fr` comme le gabarit DSFR 1.14.
- Défaut appliqué : (b). Modifiable en une ligne dans `apps/accueil/src/_data/site.js` (`external.gouvernement`).
-> ok

## Q7. Pied de page de la maquette (edito, E2)

- Question : la maquette Figma (frame « 1440w light », nœud 8:4414) propose un pied de page sombre personnalisé : titre « Observatoire des Sols de France », « Le portail d'accès aux données des sols pour les territoires. Un service piloté par INRAE · Incubé par beta.gouv.fr », trois liens (contenu non défini) et « 2026 INRAE GIS Sol ».
- Options : (a) reproduire ce bloc sombre (hors DSFR, contenu à valider : pilotage, incubation) ; (b) garder le pied de page DSFR standard (marque, liens obligatoires, liens bas, licence).
- Défaut appliqué : (b) pour la v0 ; le contenu de la maquette pourra être repris dans `site.footer.description` une fois validé.
-> oui b est ensetiel ici la maquette ne doit pas être suivie.

## M-1. Libellé « Site du GIS Sol » dans les liens de contenu du pied de page carto (carto-dev, M1)

- Constat : le `Footer` de react-dsfr 1.36.0 ne propose que `domains` pour la liste de liens de contenu ; chaque entrée est rendue avec le domaine comme libellé et `https://<domaine>` comme cible. La brique edito affiche « Site du GIS Sol » → `https://www.gissol.fr/` (et des cibles en `www.`).
- Options : (a) garder `domains` : le lien se lit « gissol.fr » → `https://gissol.fr` (redirige vers le site) ; (b) l'edito renomme son libellé en « gissol.fr » pour une parité exacte ; (c) balisage personnalisé côté carto (contraire à « utiliser les props react-dsfr »).
- Défaut appliqué : (a) côté carto ; (b) proposé à l'edito. Même liste, même ordre, même phrase de licence et même titre du lien d'accueil.
-> b me semble mieux, il faut que le footer soit le plus uniforme possible. 

## E-1. Titres des cartes « Données disponibles » de l'accueil (edito, E2)

- Question : les trois cartes de la section « Données disponibles » portent les titres de la maquette Figma (« Référentiels territoriaux », « Données agricoles », « Environnement et recherche »). Ces catégories ne sont pas validées par le GIS Sol ni rattachées à un filtre du catalogue.
- Options : (a) garder les titres de la maquette ; (b) des libellés neutres en attendant la validation ; (c) des catégories issues des mots-clés du catalogue (après C1-C4).
- Défaut appliqué : (a), décision de l'orchestrateur ; les descriptions portent « (texte provisoire) ». À valider avec le designer et le GIS Sol ; contenu dans `apps/accueil/src/_data/accueil.js` (`donnees.items`).
-> ok je m'en occupe c'est une bonne décision temporaire, le problème n'est pas bloquant.

## C-1. Sous-portail GeoNetwork `gissol-osf_c` pour le catalogue (catalogue-dev, C1)

- Question : le sous-portail `gissol-osf_c` (filtre serveur `groupPublished:gissol-osf_g`, les 7 fiches du CSW) existe sur le GeoNetwork GPF, mais son API n'est pas joignable : `https://data.geopf.fr/geonetwork/gissol-osf_c/api/...` répond `404 no Route matched` (passerelle) et `https://data.geopf.fr/catalog/gissol-osf_c/api/...` répond 403 (réécrit en `/geonetwork/srv/api/gissol-osf_c/api/...`). Seul `srv` est routé, via `/catalog`, qui répond déjà `access-control-allow-origin: *`.
- Demande à l'équipe GPF : router le chemin du sous-portail (`/geonetwork/gissol-osf_c/api`) avec la même politique CORS que `/catalog`.
- Options : (a) route exposée : `geonetwork4_api_url` pointe vers le sous-portail, périmètre garanti par le serveur, sans patch ; (b) pas de route : patch minimal `setConfigFilters({ groupPublished: { 'gissol-osf_g': true } })` dans le datahub (agrégations non filtrées).
- Défaut appliqué : (b) en v0 (validé par l'orchestrateur), à remplacer par (a) dès que la route existe. Détails : `doc/agents/geonetwork-ui.md` §2.
-> Je creuse, ça demande plus de réflexion

## C-2. Version DSFR du catalogue (catalogue-dev, C1)

- Question : le fork IGNF/geonetwork-ui `v1.6.2` embarque `@gouvfr/dsfr` 1.15.3 et `@edugouvfr/ngx-dsfr` 1.20.0 (peer `~1.15.0`) ; le projet épingle 1.14.2.
- Options : (a) forcer 1.14.2 (override npm, risque de casse de ngx-dsfr) ; (b) garder 1.15.3 dans le catalogue seulement.
- Défaut appliqué : (b), écart documenté dans `doc/agents/geonetwork-ui.md` §2.3.
-> ok

## C-3. Format du lien « Voir sur la carte » (catalogue-dev, C1, pour C4)

- Question : le datahub ouvre `external_viewer_url_template` avec `${layer_name}`, `${service_url}`, `${service_type}`, `${geop_type}`, `${tms_style}` ; quel paramètre d'URL la brique carto `/explorer-les-cartes/` accepte-t-elle ?
- Options : (a) reprendre le format cartes.gouv.fr `?l=<couche>$GEOPORTAIL:<geop_type>:<type>(...)` ; (b) format simple.
- Décision appliquée (orchestrateur) : (b) `/explorer-les-cartes/?layer=<nom de couche>&type=<wms|wmts|wfs|tms>&url=<URL du service>`, valeurs encodées. Template C4 : `external_viewer_url_template = '/explorer-les-cartes/?layer=${layer_name}&type=${service_type}&url=${service_url}'`. Attention pour le lecteur carto : le datahub IGN envoie `type` en **majuscules** (`WMS`, `WMTS`, `TMS`, `GEOJSON` ; WFS est désactivé dans le bouton) et n'encode que `url` (`layer` est inséré tel quel). Lecture 
insensible à la casse et `decodeURIComponent` tolérant attendus côté carto.
-> je pense que tu te trompes et que le format de cartes.gouv n'est pas le meilleur mais par soucis d'homogénéité, il faudrait l'employer.

## E-2. Chemins sans langue après l'internationalisation (edito, E5)

- Question : les pages edito passent sous `/fr/` et `/en/`. Les briques catalogue et carto lient l'accueil (`/`) et les pages du pied de page (`/mentions-legales/`, ...) : faut-il changer leurs liens en `/fr/...` ?
- Options : (a) les autres briques passent à `/fr/...` ; (b) l'edito garde chaque chemin sans langue sous forme de page de renvoi (meta refresh vers `/fr/...`, liens visibles vers les deux langues, sans JS).
- Défaut appliqué : (b) ; aucun lien à changer dans les autres briques. Les pages edito, elles, lient directement leur langue. Le jour où un serveur HTTP est configuré, une redirection 301 (ou selon `Accept-Language`) pourra remplacer le meta refresh.
--> parfait

## M-2. Tuiles WMTS Plan IGN en erreur 400 intermittente (carto-dev, M2)

- Constat : `https://data.geopf.fr/wmts` répond parfois `400` avec `<Exception exceptionCode="InvalidParameterValue">Layer GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2 unknown</Exception>` à une requête `GetTile` valide (même URL : 2 réponses 400 sur 60 en `curl`, sans le navigateur ; environ 1 tuile sur 15 à 1 chargement de page sur 2 dans Playwright). La tuile reste vide et le navigateur journalise « Failed to load resource » : ce n'est pas une erreur du code de l'application.
- Options : (a) accepter et signaler l'incident à l'équipe Géoplateforme ; (b) ajouter un nouvel essai unique des tuiles en échec (`tileLoadFunction` personnalisée) ; (c) les deux.
- Défaut appliqué : (a) en M2 (aucun contournement, signalement à faire par un humain, l'agent n'ayant pas de canal vers la GPF) ; (b) à décider en M3 si le problème persiste.
-> b est raisonnable si c'est bien un unique nouvel essai. Le problème et remonté à l'équipe gpf.