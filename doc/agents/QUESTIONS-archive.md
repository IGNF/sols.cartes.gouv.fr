# Questions closes (archive)

Entrées de [`QUESTIONS.md`](QUESTIONS.md) auxquelles le propriétaire a répondu, déplacées telles quelles. Les lignes `->` et « User response » sont ses réponses ; les lignes « Suite » indiquent ce que l'orchestrateur en a fait.

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
- Suite (orchestrateur) : commité avec cette réponse (PR docs/X7).

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
- Suite (orchestrateur) : (b) appliqué dans E5 (PR #23) : l'edito affiche « gissol.fr » → `https://gissol.fr` comme la carto ; le catalogue reprend le pied de page edito au build.

## E-1. Titres des cartes « Données disponibles » de l'accueil (edito, E2)

- Question : les trois cartes de la section « Données disponibles » portent les titres de la maquette Figma (« Référentiels territoriaux », « Données agricoles », « Environnement et recherche »). Ces catégories ne sont pas validées par le GIS Sol ni rattachées à un filtre du catalogue.
- Options : (a) garder les titres de la maquette ; (b) des libellés neutres en attendant la validation ; (c) des catégories issues des mots-clés du catalogue (après C1-C4).
- Défaut appliqué : (a), décision de l'orchestrateur ; les descriptions portent « (texte provisoire) ». À valider avec le designer et le GIS Sol ; contenu dans `apps/accueil/src/_data/accueil.js` (`donnees.items`).
  -> ok je m'en occupe c'est une bonne décision temporaire, le problème n'est pas bloquant.

## C-2. Version DSFR du catalogue (catalogue-dev, C1)

- Question : le fork IGNF/geonetwork-ui `v1.6.2` embarque `@gouvfr/dsfr` 1.15.3 et `@edugouvfr/ngx-dsfr` 1.20.0 (peer `~1.15.0`) ; le projet épingle 1.14.2.
- Options : (a) forcer 1.14.2 (override npm, risque de casse de ngx-dsfr) ; (b) garder 1.15.3 dans le catalogue seulement.
- Défaut appliqué : (b), écart documenté dans `doc/agents/geonetwork-ui.md` §2.3.
  -> ok

## C-3. Format du lien « Voir sur la carte » (catalogue-dev, C1, pour C4)

- Question : le datahub ouvre `external_viewer_url_template` avec `${layer_name}`, `${service_url}`, `${service_type}`, `${geop_type}`, `${tms_style}` ; quel paramètre d'URL la brique carto `/explorer-les-cartes/` accepte-t-elle ?
- Options : (a) reprendre le format cartes.gouv.fr `?l=<couche>$GEOPORTAIL:<geop_type>:<type>(...)` ; (b) format simple.
- Décision appliquée (orchestrateur) : (b) `/explorer-les-cartes/?layer=<nom de couche>&type=<wms|wmts|wfs|tms>&url=<URL du service>`, valeurs encodées. Template C4 : `external_viewer_url_template = '/explorer-les-cartes/?layer=${layer_name}&type=${service_type}&url=${service_url}'`. Attention pour le lecteur carto : le datahub IGN envoie `type` en **majuscules** (`WMS`, `WMTS`, `TMS`, `GEOJSON` ; WFS est désactivé dans le bouton) et n'encode que `url` (`layer` est inséré tel quel). Lecture insensible à la casse et `decodeURIComponent` tolérant attendus côté carto.
  -> je pense que tu te trompes et que le format de cartes.gouv n'est pas le meilleur mais par soucis d'homogénéité, il faudrait l'employer.
- Suite (orchestrateur, 2026-11-05) : décision humaine appliquée. Le catalogue passe au format cartes.gouv.fr (`l=${layer_name}$GEOPORTAIL:${geop_type}:${service_type}(1;1;1;0${tms_style})&permalink=no`, tâche C6) et le lecteur carto lit ce paramètre `l` en priorité (tâche M5), le format simple restant accepté en secours.
- Suite C6 (décision humaine) : format de cartes.gouv.fr pour l'homogénéité, chemin relatif. Template final : `external_viewer_url_template = '/explorer-les-cartes/?l=${layer_name}$GEOPORTAIL:${geop_type}:${service_type}(1;1;1;0${tms_style})&permalink=no'`, `external_viewer_open_new_tab = false`. URL émises et grammaire de `l` : `doc/agents/geonetwork-ui.md` §10.

## E-2. Chemins sans langue après l'internationalisation (edito, E5)

- Question : les pages edito passent sous `/fr/` et `/en/`. Les briques catalogue et carto lient l'accueil (`/`) et les pages du pied de page (`/mentions-legales/`, ...) : faut-il changer leurs liens en `/fr/...` ?
- Options : (a) les autres briques passent à `/fr/...` ; (b) l'edito garde chaque chemin sans langue sous forme de page de renvoi (meta refresh vers `/fr/...`, liens visibles vers les deux langues, sans JS).
- Défaut appliqué : (b) ; aucun lien à changer dans les autres briques. Les pages edito, elles, lient directement leur langue. Le jour où un serveur HTTP est configuré, une redirection 301 (ou selon `Accept-Language`) pourra remplacer le meta refresh.
  --> parfait

## M-2. Tuiles WMTS Plan IGN en erreur 400 intermittente (carto-dev, M2)

- Constat : `https://data.geopf.fr/wmts` répond parfois `400` avec `<Exception exceptionCode="InvalidParameterValue">Layer GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2 unknown</Exception>` à une requête `GetTile` valide (même URL : 2 réponses 400 sur 60 en `curl`, sans le navigateur ; environ 1 tuile sur 15 à 1 chargement de page sur 2 dans Playwright). La tuile reste vide et le navigateur journalise « Failed to load resource » : ce n'est pas une erreur du code de l'application.
- Options : (a) accepter et signaler l'incident à l'équipe Géoplateforme ; (b) ajouter un nouvel essai unique des tuiles en échec (`tileLoadFunction` personnalisée) ; (c) les deux.
- Défaut appliqué : (a) en M2 (aucun contournement, signalement à faire par un humain, l'agent n'ayant pas de canal vers la GPF) ; (b) à décider en M3 si le problème persiste.
- Mise à jour M3 (décision de l'orchestrateur : nouvel essai borné si l'erreur se reproduit) : 0 échec sur 150 tuiles puis 1 `404` sur une tuile orthophoto valide (environ 13 chargements de page) ; nouvel essai unique après 500 ms ajouté (`src/map/tileRetry.ts`, vérifié en forçant un 400 dans Playwright). La question reste ouverte pour l'équipe Géoplateforme.
  -> b est raisonnable si c'est bien un unique nouvel essai. Le problème et remonté à l'équipe gpf.
- Suite (orchestrateur) : un seul nouvel essai par URL de tuile (`src/map/tileRetry.ts`, PR #29) ; signalement GPF fait par l'humain.

## M-3. Source de validation des noms TMS (carto-dev, M4)

- Constat : la consigne M4 valide un nom TMS s'il figure dans l'annexe `https://data.geopf.fr/annexes/gissol-osf/gpf-rok4-server-wmts-tms/capabilities.xml`. Ce fichier est un GetCapabilities **WMTS** (raster ROK4) : il ne contient aucune couche vecteur TMS ; les trois noms TMS du CSW (`cartogrammes_gpkg_11-09-2026_tms`, `rrp_landes_gpkg_11-09-2026_tms`, `rrp_gironde_gpkg_03-09-2026_tms`) y sont absents et seraient tous rejetés. La racine du service, `https://data.geopf.fr/tms/1.0.0` (document `TileMapService`, 849 `TileMap`), les liste tous les trois (`metadata.json` de chacun en 200).
- Options : (a) appliquer la consigne : tous les TMS rejetés ; (b) valider contre la racine `TileMapService`, qui est la liste de capacités du service TMS.
- Défaut appliqué : (b) dans `scripts/build-sols-layers.ts` ; les TMS validés ne sont de toute façon pas affichés en v0 (styles MapLibre, voir `doc/agents/geopf-ext.md` §6).
  -> ok

## M-4. Couches WMS du RRP du Loiret en erreur côté serveur (carto-dev, M4)

- Constat : `https://data.geopf.fr/wms-v/ows` répond HTTP 200 avec un `ServiceExceptionReport` (`java.lang.NullPointerException: Cannot invoke "String.length()" because "expression" is null`) à tout GetMap sur `rrp_loiret_gpkg_11-09-2026_wmsv` et `rrp_dept_loiret_gpkg_11-09-2026_wmsv` (style vide ou nommé, EPSG:3857 ou 4326, toute emprise), alors que les deux noms sont dans les capacités. Les autres couches wms-v (`stock_carbone_fao_fr_wmsv`, `vibrisses_...`, `etude_30110_...`) répondent en PNG. Le lien d'exemple WMS du contrat C4 porte sur cette couche : la carte l'ajoute, mais rien ne s'affiche.
- Options : (a) signaler à l'équipe Géoplateforme / INRAE (style ou données de la couche) ; (b) masquer ces couches dans le panneau ; (c) détecter l'erreur et l'indiquer.
- Défaut appliqué : (a) à faire par un humain et (c) : après 3 tuiles en erreur sans aucune tuile chargée, le panneau affiche « La Géoplateforme ne renvoie pas d'image pour cette couche pour le moment. ». Pas de masquage : la couche est publiée et pourra être réparée côté serveur.

-> nOui est à l'avenir, si sur de la donné tuilé / data.geopf. Si ta requête et bonne, documentée et que le serveur te renvoie une erreur cohérente ne passe pas plus de temps de raissonnement dessus. Documente là et poursuit.

## E-4. Accueil v1 : agenda, étiquettes de données, illustrations (edito, E8)

- Agenda : les six événements de la maquette sont repris en 2026 avec des liens d'inscription provisoires vers `/fr/aide/#contact` ; les événements passés sont masqués au build (reconstruction nécessaire pour les retirer). Question : où publier les vrais liens d'inscription, et qui tient `apps/accueil/src/_data/agenda.json` à jour ?
- Étiquettes « Données disponibles » (RPG, BDAT…) : non cliquables. Options : (a) en rester là ; (b) les lier à une recherche du catalogue (`/rechercher-une-donnee/search?q=…`) une fois les mots-clés du périmètre sols stabilisés (C9). Défaut : (a).
- Illustrations : `cas-usage-2.jpg` représente une mairie (collectivités) et `cas-usage-3.jpg` un bureau (bureaux d'études), l'inverse de `packages/brand/README.md`. L'accueil utilise la correspondance visuelle ; corriger le README (ou renommer les fichiers) côté racine.

- Décision (orchestrateur, propriétaire) : (a) confirmée pour la v1, faute de solution simple ; défaut appliqué.

## M-7. Formulaires de la recherche « Avancée » et barre de recherche sur mobile (carto-dev, M19)

- Constat : la géolocalisation est désormais sous le bouton « Avancée » du moteur de recherche, comme sur
  cartes.gouv.fr/explorer-les-cartes et guichet-collaboratif (contrôle geopf `SearchEngineAdvanced` : « Me géolocaliser »
  en tête du panneau). Ce bouton n'existe que s'il y a au moins un formulaire avancé. cartes.gouv.fr en a quatre (« Code
  INSEE », « Lieux et toponymes », « Coordonnées », « Parcelles cadastrales ») ; guichet-collaboratif n'a que
  « Coordonnées », selon la communauté. « Code INSEE », « Lieux et toponymes » et « Parcelles cadastrales » appellent
  `https://geo.api.gouv.fr/communes` (et `https://apicarto.ign.fr/api/codes-postaux/communes/` pour les lieux), adresses
  écrites en dur dans geopf-extensions 1.0.0-beta.16, hors Géoplateforme ; « Coordonnées » n'appelle aucun service.
- Options : (a) « Coordonnées » seul (comme guichet-collaboratif, services GPF uniquement) ; (b) les quatre formulaires
  de cartes.gouv.fr, en acceptant ces deux API de l'État hors GPF ; (c) « Coordonnées » et « Code INSEE ».
- Défaut appliqué : (a). Passer à (b) ou (c) = ajouter les classes dans `loadSearchEngine()` et `createSearchEngine()`.
-> Ajouter Coordonnées
- Sous 36em (mobile), la barre reste entre les deux colonnes de boutons et « Avancée » n'affiche que son chevron (nom
  accessible « Recherche avancée ») ; cartes.gouv.fr y donne toute la largeur à la barre, par-dessus
  les colonnes. À trancher si le libellé « Avancée » doit rester visible sur mobile (il faudrait alors déplacer les
  colonnes sous la barre, comme guichet-collaboratif). -> oui
- Échelle : sur cartes.gouv.fr le fond est opaque (`--background-default-grey`), le texte et le trait gris en thème clair
  et bleu France en sombre ; elle était bleue dans les deux thèmes depuis M13 (brief v1.1). Alignée sur cartes.gouv.fr. -> ok
- Suite (orchestrateur) : « Coordonnées » seul conservé (option a, déjà en place) ; sur mobile, le libellé « Avancée »
  reste visible et les colonnes de boutons passent sous la barre, comme guichet-collaboratif (tâche carto M22) ;
  échelle validée.
- Suite M22 (carto-dev) : sous 36em, la barre de recherche prend la largeur de la carte avec le libellé « Avancée »
  visible et les colonnes de boutons du haut commencent sous la barre (guichet-collaboratif, cartes.gouv.fr) ;
  `doc/agents/geopf-ext.md` §17.

## M-8. Tuiles raster qui disparaissent : confirmation en usage réel (carto-dev, M20)

- Constat : la cause trouvée (nouvel essai d'une tuile qui relançait sans fin le cache de tuiles d'OpenLayers, `doc/agents/geopf-ext.md`
  §15) est reproduite à chaque fois dès qu'une seule tuile répond en erreur puis réussit au nouvel essai ; elle donne exactement
  les symptômes signalés (couche vide, requêtes normales dans l'onglet Réseau, retour au changement de zoom). Sans injection
  d'erreur, 54 parcours réels n'ont pas déclenché la boucle : les erreurs transitoires de la GPF observées ce jour-là échouaient
  aussi au nouvel essai. Le lien avec l'échelle 10–5 km (z≈9,7 à 12,1) n'est pas démontré.
- Question : après la fusion du correctif, le propriétaire voit-il encore des tuiles disparaître ? Si oui : navigateur et version,
  couche exacte, adresse de la page (avec `c=` et `z=`), et une capture de l'onglet Réseau filtrée sur `GetTile` (codes 400/502/503
  et réponses « (memory cache) »).
- Défaut appliqué : correctif livré (PR M20) ; à rouvrir si le symptôme persiste.
- User response: ça semble corrigé.
