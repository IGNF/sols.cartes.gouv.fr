# Portail de l'Observatoire des Sols

Le portail vise à présenter une certaine partie des données de l'INRAE, via un catalogue et une entrée carto. La landing page présentera un édito, 
accès sur le consortium [GISSol](https://www.gissol.fr/).

## Brique Techno

- **Édito** : [Eleventy](https://www.11ty.dev/), site statique pour une réponse rapide et une bonne indexation (moteurs, agents).
- **Catalogue** : [IGNF/geonetwork-ui](https://github.com/IGNF/geonetwork-ui), en évitant autant que possible de faire un fork.
- **Carto** : React/TS, avec [React DSFR](https://github.com/codegouvfr/react-dsfr) et [geopf-ext](https://github.com/IGNF/geopf-extensions-openlayers). 
TO DO: prendre la décision de partir du guichet ou de l'entrée Carto (éditeur a priori ce n'est pas viable)


## Installation

TODO mais à priori:

```bash
bun i
bun run dev
```

Puis accéder via son navigateur préféré à http://localhost:5173/sols.cartes.gouv.fr/

## L'arborescence du projet

Exemple d'arborescence de projet :

* `.github/` : dossier contenant les modèles d'issues et github actions ;
* `.vscode/` : dossier contenant une configuration vscode pour le projet;
* `doc/` : dossier contenant des fichiers .md de documentation (ex: install.md) ;
* `tests/`: scripts et explications pour lancer les tests ;
* `README.md` : ce fichier

## Contribuer

Le dépôt et le kanban du projet sont ouverts : les tickets sont à créer dans l'onglet Issues. TODO : guide de contribution et licence.

## Contacts du projet

Personnes à contacter en cas d'urgence ou de demande ne pouvant passer par un ticket sur le [projet](https://github.com/orgs/IGNF/projects/104)

|Victor|Dizier|victor.dizier@ign.fr|MOA/SPP|
|Ibrahim|Sall|ibrahim.sall@ign.fr|DEV/RDS|
