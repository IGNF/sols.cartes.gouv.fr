# Patchs appliqués au fork IGNF/geonetwork-ui (brique catalogue)

Règle (`CLAUDE.md`) : le code amont n'est jamais modifié à la main. Chaque modification inévitable est un fichier `.patch`
dans `apps/rechercher-une-donnee/patches/`, appliqué par `scripts/prepare.mjs` (`git apply --check` puis `git apply`,
dans l'ordre lexical) sur le clone épinglé `apps/rechercher-une-donnee/.upstream/` (ref dans
`apps/rechercher-une-donnee/upstream.json`). `npm run lint` échoue si un patch n'est pas listé ici.

Ref amont de référence : `v1.6.2` (`72b9eb4e81b813330a3323503afebc0d1c622a4d`).

| Patch | Fichiers amont | Raison | Lien amont |
|---|---|---|---|
| `0001-search-config-filters.patch` | `libs/util/app-config/src/lib/model.ts`, `libs/util/app-config/src/lib/app-config.ts`, `apps/datahub/src/app/app.component.ts` | Périmètre « sols » permanent. Ajoute l'option `[search] config_filters` (ex. `config_filters.groupPublished = ['gissol-osf_g']`) et la passe au démarrage, via `SetConfigFilters`, aux deux états de recherche du datahub : `mainSearch` (recherche) et `organization-page` (page `organization/<nom>`, état déclaré dans `organization-page.component.html`), le mécanisme amont déjà utilisé par le web component `gn-results-list` (attribut `filter`). Le datahub n'a aucune option de configuration équivalente à cette ref. | [`effects.ts` l. 158-161](https://github.com/IGNF/geonetwork-ui/blob/v1.6.2/libs/feature/search/src/lib/state/effects.ts#L158-L161), [`gn-results-list.component.ts` l. 55-58](https://github.com/IGNF/geonetwork-ui/blob/v1.6.2/apps/webcomponents/src/app/components/gn-results-list/gn-results-list.component.ts#L55-L58), [`model.ts` `SearchConfig`](https://github.com/IGNF/geonetwork-ui/blob/v1.6.2/libs/util/app-config/src/lib/model.ts#L70-L82) |
| `0002-datahub-base-href.patch` | `apps/datahub/project.json` | Le serveur de développement (`nx serve`) n'accepte pas `--base-href` et déduit son chemin de service du `baseHref` de la cible `build`. Le patch pose `baseHref: "/rechercher-une-donnee/"` (même valeur que `upstream.json`, vérifiée par `npm run lint`) pour que `npm run dev` serve sous `/rechercher-une-donnee/` comme en production. Fichier de configuration de build, pas de code. L'option `--serve-path=/rechercher-une-donnee/` seule a été essayée : elle déplace le serveur mais `index.html` garde `<base href="/">`, donc les scripts, styles et `assets/configuration/default.toml` sont demandés à la racine et l'application ne démarre pas. Le build de production lit la même valeur (pas de `--base-href` dans `scripts/build.mjs`). | [`project.json` l. 12-13](https://github.com/IGNF/geonetwork-ui/blob/v1.6.2/apps/datahub/project.json#L12-L13) |

## Limites connues

- `0001` : le filtre s'applique aux **résultats** de recherche, pas aux agrégations
  ([`gn4-repository.ts` l. 294-303](https://github.com/IGNF/geonetwork-ui/blob/v1.6.2/libs/api/repository/src/lib/gn4/gn4-repository.ts#L294-L303)).
  Les listes de valeurs des filtres avancés (thèmes, formats, licences...) proposent donc les valeurs de tout le catalogue
  cartes.gouv.fr ; choisir une valeur absente du périmètre donne « Aucun résultat ». Le filtre « Producteur » est retiré de
  `advanced_filters` pour cette raison. Une fiche hors périmètre reste accessible si on saisit son URL `dataset/<uuid>`.
- `0001`, pages organisation : `organization/<nom>` est filtrée (état `organization-page`), ses résultats se limitent donc
  aux fiches « sols » de cette organisation (aucune pour une organisation hors périmètre). En revanche
  `/rechercher-une-donnee/organisations` liste toutes les organisations du catalogue (157 relevées), car la liste vient
  d'une agrégation (`organizations-from-metadata.service.ts`), et les en-têtes d'organisation affichent des compteurs
  globaux. C3 retire cette route (redirection vers la recherche) ; aucun lien de l'interface n'y mène à v1.6.2.
- Sortie prévue : quand la passerelle GPF routera l'API du sous-portail `gissol-osf_c` (question C-1), `geonetwork4_api_url`
  pointera dessus, le filtre sera appliqué par le serveur et ce patch pourra être retiré.
