# Données « sols » sur la Géoplateforme (GPF)

Relevé fait par l'orchestrateur le 2026-11-05 avec `curl`. Ce document décrit la **source de vérité** du périmètre « sols » et la structure des enregistrements. Rien de ce contenu ne doit être recopié en dur dans le code : les fichiers générés viennent d'un script rejouable (`scripts/build-sols-layers`, tâche M4).

## 1. Source : le CSW `gissol-osf_c`

```
https://data.geopf.fr/csw/gissol-osf_c?REQUEST=GetRecords&SERVICE=CSW&VERSION=2.0.2&RESULTTYPE=results&elementSetName=full&TYPENAMES=gmd:MD_Metadata&OUTPUTSCHEMA=http://standards.iso.org/iso/19115/-3/mdb/2.0
```

- Réponse : HTTP 200, ~158 kB, `numberOfRecordsMatched="7"`, `numberOfRecordsReturned="7"`, `nextRecord="0"` (tout tient en une page).
- En-tête `access-control-allow-origin: *` : un navigateur **peut** appeler le CSW directement. Choix v0 : la brique carto génère quand même son JSON **au build** (script rejouable) pour éviter une dépendance réseau au chargement et pour valider les noms de couches ; voir `doc/agents/geopf-ext.md` (à venir avec la tâche M4).
- Une copie figée de la réponse est dans `doc/agents/gissol-osf_c.xml` (référence, pas une source pour le code).
- Format : ISO 19115-3 (`mdb:MD_Metadata`), namespaces `mdb`, `mri`, `cit`, `mrd`, `mcc`, `gco`.

Le même périmètre est exposé par le catalogue générique via l'API GeoNetwork `https://data.geopf.fr/catalog` (champ organisation `INRAE - Info&Sols`), cf. `https://cartes.gouv.fr/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols`. La vérification de l'équivalence CSW / filtre organisation est la tâche C1 (`doc/agents/geonetwork-ui.md`).

## 2. Structure d'un enregistrement

| Information | XPath (depuis `mdb:MD_Metadata`) |
|---|---|
| Identifiant | `mdb:metadataIdentifier/mcc:MD_Identifier/mcc:code/gco:CharacterString` |
| Titre | `mdb:identificationInfo/mri:MD_DataIdentification/mri:citation/cit:CI_Citation/cit:title/gco:CharacterString` |
| Résumé | `.../mri:MD_DataIdentification/mri:abstract/gco:CharacterString` |
| Organisation | `.../mri:pointOfContact//cit:CI_Organisation/cit:name/gco:CharacterString` (toujours `INRAE - Info&Sols`) |
| Liens (services, téléchargements, styles) | `mdb:distributionInfo//mrd:onLine/cit:CI_OnlineResource` avec `cit:protocol`, `cit:linkage`, `cit:name`, `cit:description` |

Les liens de service ont un `cit:protocol` parmi `OGC:WMS`, `OGC:WMTS`, `OGC:WFS`, `TMS`. `cit:name` est alors le **nom de couche** (WMS/WMTS/TMS) ou le **nom de type** (WFS, forme `workspace:featureType`). Les autres liens (sans protocole) sont des annexes : GetCapabilities statiques, styles SLD/JSON, Geopackage, dictionnaires PDF, DOI.

## 3. Les 7 enregistrements

| Identifiant | Titre (abrégé) | WMS | WMTS / TMS | WFS |
|---|---|---|---|---|
| `osf63e6c177-455e-5805-b70b-0894ee1c7174` | Seuils de détection des anomalies (RMQS, vibrisses) | `vibrisses_rmqs_gpkg_03-09-2026_wmsv` (wms-v) | | `vibrisses_rmqs_gpkg_03-09-2026_wfs:{cd_0_30,cd_30_50,vibrisses}` |
| `osff858525a-9fea-5ae3-93ab-43afab78483f` | Stocks de carbone des sols (carte FAO) | `stock_carbone_fao_fr_wmsv` (wms-v) | | `stock_carbone_fao_fr_gpkg_13-08-2026_wfs:stock_de_carbone_fao` |
| `osfde26f53e-5c29-5320-b53c-e38abea75fb5` | Cartogrammes RMQS 1re campagne (49 variables) | `cartogrammes_gpkg_11-09-2026_wmsv` (wms-v) | TMS `cartogrammes_gpkg_11-09-2026_tms` | `cartogrammes_gpkg_11-09-2026_wfs:all` |
| `osfd95b355a-dbb8-52f2-bb54-c99ad98c7bd3` | RRP des Landes | `rrp_landes_gpkg_11-09-2026_wmsv` (wms-v) | TMS `rrp_landes_gpkg_11-09-2026_tms` | `rrp_landes_gpkg_11-09-2026_wfs:geometrie_ucs` |
| `1b464210-8702-5296-b738-25978d5d4806` | RRP de la Gironde | `etude_30110_gpkg_03-09-2026_wmsv` (wms-v) | TMS `rrp_gironde_gpkg_03-09-2026_tms` | `etude_30110_gpkg_03-09-2026_wfs:{geometrie_ucs,sols_dominants}` |
| `osfc9008138-f56a-5b19-9cd4-25398dcb4d62` | RRP du Loiret | `rrp_dept_loiret_gpkg_11-09-2026_wmsv`, `rrp_loiret_gpkg_11-09-2026_wmsv` (wms-v) | | `rrp_loiret_gpkg_11-09-2026_wfs:geometrie_ucs` |
| `osfd95caa37-436b-431c-9391-643164f010bb` | Sols dominants de France métropolitaine (carte harmonisée) | `INRAE_CARTE-SOLS` (wms-r), `inrae_carte_sols_wmsr`, `INRAE_CARTE-SOLS`, `etude_34015_gpkg_04-09-2026_wmsv` (wms-v) | WMTS `INRAE_CARTE-SOLS`, `INRAE_CARTE-SOLS_WMTS` | `etude_34015_gpkg_04-09-2026_wfs:sols_dominants`, `INRAE_CARTE-SOLS:sols_dominants` |

Six identifiants sont préfixés `osf`, un (Gironde) est un UUID nu : ne pas supposer de format.

## 4. Points d'entrée des services

| Service | URL | Remarques |
|---|---|---|
| WMS vecteur (GeoServer) | `https://data.geopf.fr/wms-v/ows` | Capabilités : `?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities` (1,1 MB). Copie statique : `https://data.geopf.fr/annexes/gissol-osf/gpf-geoserver-wms-v/capabilities.xml`. |
| WMS raster | `https://data.geopf.fr/wms-r/wms` | Capabilités 0,96 MB. |
| WMTS | `https://data.geopf.fr/wmts` | Capabilités 3 MB. Fonds : `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2`, `ORTHOIMAGERY.ORTHOPHOTOS` (présents). |
| WFS | `https://data.geopf.fr/wfs/ows` | Copie statique des capabilités : `https://data.geopf.fr/annexes/gissol-osf/gpf-geoserver-wfs/capabilities.xml` (187 kB). |
| TMS | `https://data.geopf.fr/tms/1.0.0` | Capabilités : `https://data.geopf.fr/annexes/gissol-osf/gpf-rok4-server-wmts-tms/capabilities.xml`. |
| CSW | `https://data.geopf.fr/csw/gissol-osf_c` | Voir §1. |
| API GeoNetwork | `https://data.geopf.fr/catalog` | Utilisée par le catalogue générique (`geonetwork4_api_url`). |

## 5. Validation des noms contre les GetCapabilities (2026-11-05)

Le CSW n'est **pas** fiable à 100 % sur les noms de couches ; d'où la règle « valider contre GetCapabilities, ne jamais deviner ».

| Nom dans le CSW | Service | Présent ? |
|---|---|---|
| `vibrisses_rmqs_gpkg_03-09-2026_wmsv` | wms-v | oui |
| `stock_carbone_fao_fr_wmsv` | wms-v | oui |
| `cartogrammes_gpkg_11-09-2026_wmsv` | wms-v | oui |
| `rrp_landes_gpkg_11-09-2026_wmsv` | wms-v | oui |
| `etude_30110_gpkg_03-09-2026_wmsv` | wms-v | oui |
| `rrp_dept_loiret_gpkg_11-09-2026_wmsv` | wms-v | oui |
| `rrp_loiret_gpkg_11-09-2026_wmsv` | wms-v | oui |
| `INRAE_CARTE-SOLS` | wms-v | **non** (existe sur wms-r) |
| `etude_34015_gpkg_04-09-2026_wmsv` | wms-v | **non** |
| `INRAE_CARTE-SOLS` | wms-r | oui |
| `inrae_carte_sols_wmsr` | wms-r | **non** |
| `INRAE_CARTE-SOLS` | wmts | oui |
| `INRAE_CARTE-SOLS_WMTS` | wmts | **non** |

Côté WFS, les noms de types publiés diffèrent des noms courts du CSW (exemple : CSW `vibrisses_rmqs_gpkg_03-09-2026_wfs:cd_0_30`, capabilités `vibrisses_rmqs_gpkg_03-09-2026_wfs:vibrisses_RMQS_cd_0_30`). Types WFS réellement publiés dans l'espace gissol :

```
etude_34015_gpkg_04-09-2026_wfs:sols_dominants_france_metropolitaine
INRAE_CARTE-SOLS:sols_dominants_france_metropolitaine
etude_30110_gpkg_03-09-2026_wfs:sols_dominants_rrp_gironde
etude_30110_gpkg_03-09-2026_wfs:ucs_rrp_gironde
cartogrammes_gpkg_11-09-2026_wfs:Teneurs_ponctuelles_49_variables_RMQS
rrp_landes_gpkg_11-09-2026_wfs:ucs_rrp_landes
rrp_loiret_gpkg_11-09-2026_wfs:ucs_rrp_loiret
vibrisses_rmqs_gpkg_03-09-2026_wfs:vibrisses_RMQS
vibrisses_rmqs_gpkg_03-09-2026_wfs:vibrisses_RMQS_cd_0_30
vibrisses_rmqs_gpkg_03-09-2026_wfs:vibrisses_RMQS_cd_30_50
stock_carbone_fao_fr_gpkg_13-08-2026_wfs:stock_de_carbone_fao
```

Conséquence pour M4 : le script garde une couche seulement si son nom est présent dans le GetCapabilities du service visé, et consigne les rejets dans sa sortie.

## 6. Rejouer le relevé

```bash
curl -s 'https://data.geopf.fr/csw/gissol-osf_c?REQUEST=GetRecords&SERVICE=CSW&VERSION=2.0.2&RESULTTYPE=results&elementSetName=full&TYPENAMES=gmd:MD_Metadata&OUTPUTSCHEMA=http://standards.iso.org/iso/19115/-3/mdb/2.0' -o gissol-osf_c.xml
grep -o 'numberOfRecordsMatched="[0-9]*"' gissol-osf_c.xml
```
