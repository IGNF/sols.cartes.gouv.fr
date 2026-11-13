# Questions ouvertes (v0)

Décisions prises par l'orchestrateur sans validation humaine. Chaque entrée : question, options, choix par défaut appliqué. Les lignes `->` sont les réponses de l'humain (2026-11-05) ; les lignes « Suite » indiquent ce que l'orchestrateur en a fait.

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

## M-5. Contraste du bouton « Menu » au survol du bloc de marque en thème sombre (carto-dev, M11)

- Constat : en mobile (< 62em), thème sombre, quand le pointeur survole le bloc de marque de l'en-tête, DSFR 1.14.2
  (`.fr-enlarge-link:hover { background-color: var(--hover) }`) le peint en `#3f3f3f` ; le bouton « Menu » qu'il contient
  (`#8585f6`) tombe à 3,35:1 (axe `color-contrast`, grave). Même mesure sur l'edito et la carto ; 0 violation au repos.
  Détail : `doc/agents/geopf-ext.md` §9.7.
- Options : (a) le laisser tel quel (comportement DSFR, transitoire au survol) et le signaler au DSFR
  (https://github.com/GouvernementFR/dsfr/issues) ; (b) surcharger le survol du bloc de marque sur toutes les briques
  (`@sols/brand` ou CSS de chaque brique) ; (c) attendre une version du DSFR qui le corrige.
- Défaut appliqué : (a), aucune surcharge. Le ticket au DSFR est à ouvrir par un humain. `check:map` vérifie qu'il n'y a
  aucune violation au repos et que, au survol, seule celle-ci apparaît.
- Note (M17, #5) : ne s'applique plus à la carto, dont l'en-tête compact n'a plus de bouton « Menu » (voir M-6) ; reste valable pour l'edito.

## G-1. « Logged in the web browser » et authentification (v1, orchestrateur)

- Question : `refine.md` dit « They should be logged in the web browser in the final product, for security reasons » puis « The 'Connect' button should never be visible since we do not have authentication/login (confirm this) ».
- Lecture retenue : aucune authentification n'existe aujourd'hui (confirmé : le Keycloak de cartes.gouv.fr a été retiré du catalogue par le patch 0003 ; la carto et l'edito n'ont aucun compte) ; la connexion des utilisateurs est un besoin du produit final, hors périmètre v1. Le bouton « Se connecter » est retiré de toutes les briques (`header.tools.login = false` dans `@sols/brand`).
- Si « logged » voulait dire « journalisés » (erreurs consignées dans la console du navigateur), préciser : aujourd'hui aucune brique n'écrit en console (`no-console`), les erreurs sont affichées à l'utilisateur (alertes DSFR).

## G-2. Commentaires Figma au-dessus de la barre de recherche (v1, catalogue)

- Constat : l'API MCP Figma n'expose pas les commentaires du fichier ; l'orchestrateur ne peut pas les lire. Les cadres « recherche mots clés » (`8:3980`) et « recherche millésime » (`8:4057`) de la page Prototype montrent des puces de mots-clés sous la barre de recherche (ajout/retrait, champ « Rechercher des mots clés… »).
- Défaut appliqué : la tâche C9 propose une barre de mots-clés sous la recherche à partir des mots-clés réels des 7 fiches (préréglages `[[search_preset]]` du datahub si cela suffit, sinon patch documenté). Si les commentaires disent autre chose, les coller dans ce fichier.
- Suite C9 : puces faites par configuration (`[[search_preset]]`, 5 mots-clés réels), filtre « Mot-clé » avec champ de recherche ; pas d'état sélectionné ni de retrait au second clic (patch proposé, non fait, voir C-4). Détails : `doc/agents/geonetwork-ui.md` §13.

## G-3. Sections de l'accueil non reprises (v1, edito)

- Constat : la maquette contient un bloc « Le portail … arrive bientôt » (CTA lancement, `8:4896`) avec inscription et la mention « Incubé par beta.gouv.fr · Ministère de l'Agriculture », ainsi que des chiffres (60 ans, 12+, 100 %).
- Défaut appliqué : E8 reprend les textes de la maquette (demande v1), y compris les chiffres ; le bloc « arrive bientôt » n'est pas repris sur un site en ligne (contradictoire) et la mention d'incubation reste à valider ; la vidéo de la section « Le service » est ignorée (demande v1).

## C-4. Autocomplétion et filtres hors périmètre, et bascule des puces (catalogue-dev, C9)

- Constat : sur le build de `main` (`45fe939`), l'autocomplétion et toutes les agrégations des filtres portent déjà `groupPublished:gissol-osf_g` (patch 0005, C5) ; « route » ne propose rien et les décomptes sont ≤ 7. Le défaut signalé (« Agriculture (34) », suggestions hors périmètre) n'est pas reproduit.
- Questions : (1) sur quel build ou quelle URL l'observation a-t-elle été faite (version antérieure à C5, `.upstream` non reconstruit, cartes.gouv.fr) ? (2) faut-il le patch « puce sélectionnée et retrait au second clic » (environ 15 lignes dans `home-header`) ?
- Défaut appliqué : (1) rien de plus, en attente du lieu d'observation ; (2) pas de patch, retrait par la croix du filtre « Mot-clé ».
- Suite de G-2 (question sur la branche X11) : puces faites par configuration (`[[search_preset]]`, 5 mots-clés réels) ; filtre « Mot-clé » avec champ de recherche. Détails : `doc/agents/geonetwork-ui.md` §13.
- Décision (orchestrateur) : (2) oui, patch fait en C11 (`0007-keyword-chips-toggle.patch`, `doc/agents/geonetwork-ui.md` §16) ; (1) reste ouverte, en attente du lieu d'observation.

## C-5. Boucle de l'aperçu sur un lien WFS introuvable (catalogue-dev, C10)

- Constat : sur notre build (`main`, `10fa84a`) et sur cartes.gouv.fr, la sélection d'un lien WFS introuvable (`wfs.featuretype.notfound`) affiche le message d'erreur et n'émet plus aucune requête (mesures sur 40 s, 7 fiches, onglets Carte, Tableau, Graphique et formulaires d'API ; `doc/agents/geonetwork-ui.md` §14).
- Question : sur quelle fiche, quel lien, quel onglet et quel navigateur la boucle a-t-elle été observée (une capture de l'onglet Réseau aiderait) ?
- Défaut appliqué : pas de patch tant que la boucle n'est pas reproduite.

## E-3. Adresse de contact et lien « Nous contacter » (edito, E7)

- Question : la page d'aide demande une section « Nous contacter » avec un lien mailto ; aucune adresse de contact du service n'est connue. Par ailleurs `brand.json` donne `/aide/#contact` : ce chemin sans langue passe par une page de renvoi (meta refresh) qui perd l'ancre.
- Options : (a) adresse réelle fournie par l'équipe (INRAE / GIS Sol / IGN) ; (b) formulaire hébergé ailleurs ; pour l'ancre : (c) `brand.json` passe à `/fr/aide/#contact` ; (d) garder `/aide/#contact` (arrivée en haut de la page d'aide).
- Défaut appliqué : adresse provisoire `contact@example.org` (domaine réservé, marquée « (adresse provisoire) ») dans `apps/accueil/src/_data/site.js` (`contactEmail`) ; le balisage partagé de l'edito utilise `/fr/aide/#contact` ; (c) proposé pour `brand.json`.

## C-6. Mode sombre dans le catalogue (catalogue-dev, C8)

- Constat : la modale DSFR « Paramètres d'affichage » fonctionne dans le datahub, mais le mode sombre ne s'applique qu'aux éléments DSFR ; les gabarits amont (couleurs Tailwind fixes) restent clairs et deviennent illisibles sur fond sombre.
- Options : (a) masquer le bouton dans le catalogue, catalogue toujours clair ; (b) feuille de surcharge des couleurs amont pour le sombre (travail important, à maintenir à chaque montée de version) ; (c) laisser le bouton sans effet.
- Défaut appliqué : (a). Détails : `doc/agents/geonetwork-ui.md` §15.

## E-4. Accueil v1 : agenda, étiquettes de données, illustrations (edito, E8)

- Agenda : les six événements de la maquette sont repris en 2026 avec des liens d'inscription provisoires vers `/fr/aide/#contact` ; les événements passés sont masqués au build (reconstruction nécessaire pour les retirer). Question : où publier les vrais liens d'inscription, et qui tient `apps/accueil/src/_data/agenda.json` à jour ?
- Étiquettes « Données disponibles » (RPG, BDAT…) : non cliquables. Options : (a) en rester là ; (b) les lier à une recherche du catalogue (`/rechercher-une-donnee/search?q=…`) une fois les mots-clés du périmètre sols stabilisés (C9). Défaut : (a).
- Illustrations : `cas-usage-2.jpg` représente une mairie (collectivités) et `cas-usage-3.jpg` un bureau (bureaux d'études), l'inverse de `packages/brand/README.md`. L'accueil utilise la correspondance visuelle ; corriger le README (ou renommer les fichiers) côté racine.

- Décision (orchestrateur, propriétaire) : (a) confirmée pour la v1, faute de solution simple ; défaut appliqué.

## E-5. Aide et contact vers cartes.gouv.fr (edito, E10, v1.1)

- Constat : `fixes.md` (v1.1) demande que « Aide » et « Nous contacter » renvoient vers `https://cartes.gouv.fr/aide/<langue>/` et `.../nous-ecrire/`, en liens externes.
- Défaut appliqué : `brand.json` porte ces liens (`href` en français pour catalogue et carto, `hrefTemplate` avec `{lang}` pour l'edito) ; la page locale `/<langue>/aide/` est conservée (FAQ provisoire, cible des liens « contact » de l'accueil) et sa section « Nous contacter » renvoie au formulaire de cartes.gouv.fr. Cela remplace l'adresse provisoire de E-3. À trancher : supprimer la page locale (et rediriger `/aide/` vers cartes.gouv.fr) si la FAQ ne doit pas être rédigée ici.
- Note (revue E10) : « Nous contacter » vise toujours `https://cartes.gouv.fr/aide/fr/nous-ecrire/` (le formulaire n'existe qu'en français ; `hreflang="fr"` sur les pages anglaises). `brand.json` garde `sections.helpContact` = `/fr/aide/#contact` (section contact de la page d'aide locale, elle-même renvoyant au formulaire) : à retirer si la page locale est supprimée.

## E-6. Mentions légales : points à compléter par le propriétaire (edito, #88)

- Constat : la page `/fr/mentions-legales/` reprend la structure et la rédaction de <https://cartes.gouv.fr/mentions-legales> (relevé du 2026-11-13), adaptées au nom du site ; rien n'a été inventé et aucun texte provisoire n'est affiché. Retiré : la phrase sur les formulaires d'inscription (pas d'espace connecté ici) et la rubrique « Hébergeur » (voir ci-dessous) ; les encarts « lettre d'information » et « Communauté » de la page d'origine ne font pas partie des mentions.
- À confirmer ou compléter :
  1. Éditeur et directeur de la publication : repris de cartes.gouv.fr (IGN, Sébastien Soriano). Le portail étant piloté par INRAE avec le GIS Sol, faut-il un autre éditeur, un co-éditeur ou un responsable éditorial INRAE / GIS Sol ?
  2. Hébergeur : rubrique absente de la page. cartes.gouv.fr indique OVH SAS (2 rue Kellermann, 59100 Roubaix) ; l'hébergement de sols.cartes.gouv.fr n'est pas connu (le domaine ne résout pas encore). Cette mention est obligatoire : à ajouter dans `apps/accueil/src/_data/i18n/fr.js` (`pages.mentionsLegales.sections`) et `en.js`.
  3. Propriété intellectuelle : la rédaction héritée attribue à l'IGN la propriété ou le droit d'exploitation des contenus et des « données cartographiques », et soumet toute réutilisation à un accord préalable. Les données sols viennent d'INRAE / GIS Sol et le pied de page annonce la licence etalab-2.0 : rédaction à revoir.
  4. Données à caractère personnel : « Le destinataire des données est l'IGN » et le droit d'accès sont conservés (formulaire « Nous écrire » de cartes.gouv.fr) ; à confirmer une fois la mesure d'audience du portail décidée (aucune n'est installée à ce jour).
  5. Version anglaise : traduction de courtoisie de la page française, à relire ou à remplacer par un renvoi à la version française.

## M-6. En-tête compact de la carto sur petits écrans (carto-dev, M17, #5)

- Constat : l'en-tête compact de guichet-collaboratif (référence du ticket #5, `src/css/app-header.css`, commit
  `f3427f82`) garde une seule rangée de 3,5rem à toutes les largeurs, sans menu mobile, et ne masque que le badge sous
  48em ; il ne prévoit rien d'autre pour le mobile. Chez nous, Marianne + logo GIS Sol (96 px) + « sols.cartes.gouv.fr »
  + « Aide » et « Services » avec libellés ne tiennent pas sur une rangée sous 48em. La maquette Figma (nœud 1-7634) n'a
  pas pu être consultée.
- Options : (a) une rangée partout : sous 48em, boutons « Aide » et « Services » réduits à leur icône et au chevron
  (libellé gardé en nom accessible et en `title`) ; sous 36em, logo GIS Sol masqué (le DSFR rend le nom du site
  obligatoire et le logo opérateur facultatif) ; (b) deux rangées sous 48em (marque, puis outils) ; (c) revenir au menu
  « Menu » du DSFR sous 62em (en-tête plus haut sur mobile).
- Défaut appliqué : (a). En-tête de 56 px de 320 à 1280 px ; titre en 1rem sous 36em, tronqué par une ellipse seulement
  sous ~360 px. La question M-5 (contraste du bouton « Menu ») ne concerne plus la carto, qui n'a plus ce bouton.

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
