# Questions ouvertes

Questions en attente d'une réponse du propriétaire. Chaque entrée : question, options, choix par défaut appliqué. Le propriétaire répond par une ligne `->` sous l'entrée ; une fois la réponse prise en compte (ligne « Suite »), l'entrée est déplacée telle quelle dans [`QUESTIONS-archive.md`](QUESTIONS-archive.md).

## C-1. Sous-portail GeoNetwork `gissol-osf_c` pour le catalogue (catalogue-dev, C1)

- Question : le sous-portail `gissol-osf_c` (filtre serveur `groupPublished:gissol-osf_g`, les 7 fiches du CSW) existe sur le GeoNetwork GPF, mais son API n'est pas joignable : `https://data.geopf.fr/geonetwork/gissol-osf_c/api/...` répond `404 no Route matched` (passerelle) et `https://data.geopf.fr/catalog/gissol-osf_c/api/...` répond 403 (réécrit en `/geonetwork/srv/api/gissol-osf_c/api/...`). Seul `srv` est routé, via `/catalog`, qui répond déjà `access-control-allow-origin: *`.
- Demande à l'équipe GPF : router le chemin du sous-portail (`/geonetwork/gissol-osf_c/api`) avec la même politique CORS que `/catalog`.
- Options : (a) route exposée : `geonetwork4_api_url` pointe vers le sous-portail, périmètre garanti par le serveur, sans patch ; (b) pas de route : patch minimal `setConfigFilters({ groupPublished: { 'gissol-osf_g': true } })` dans le datahub (agrégations non filtrées).
- Défaut appliqué : (b) en v0 (validé par l'orchestrateur), à remplacer par (a) dès que la route existe. Détails : `doc/agents/geonetwork-ui.md` §2.
  -> Je creuse, ça demande plus de réflexion

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

## M-9. Colonnes de boutons de la carte sur mobile en paysage (carto-dev, M22)

- Constat : en paysage sur un petit téléphone (568×320), la carte est à son plancher de 20rem (320 px) et les colonnes de
  droite (haut : catalogue, gestionnaire de couches, quatre outils par défaut, « Afficher tous les outils » ; bas :
  plein écran, zoom) ne tiennent pas l'une au-dessus de l'autre : 90 px de chevauchement, déjà sur `main` avant M22.
  « Annoter la carte » et « Afficher tous les outils » sont alors sous « Plein écran » et « Zoomer ». En portrait
  (320×568 à 375×812), M22 a supprimé le chevauchement (carte sous l'en-tête sur toute la hauteur).
- Options : (a) en rester là : le paysage d'un petit téléphone reste partiellement inutilisable pour ces deux
  boutons (rotation de l'écran) ; (b) sur écran bas (`max-height: 30em`), réduire la colonne du haut à ses boutons
  principaux et passer les outils par défaut dans « Afficher tous les outils » ; (c) colonne du haut limitée en
  hauteur avec défilement (les panneaux geopf s'ouvrent depuis la colonne et seraient rognés : à éviter) ; (d) zoom
  et plein écran en bas à gauche sur écran bas.
- Défaut appliqué : (a). M22 n'aggrave pas le cas : sa barre pleine largeur et ses colonnes abaissées ne s'appliquent
  qu'en portrait ; en paysage, la barre reste entre les colonnes avec le libellé « Avancée » visible.
