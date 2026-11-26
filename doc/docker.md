# Image Docker (X5)

Même schéma que [cartes.gouv.fr-guichet-collaboratif](https://github.com/IGNF/cartes.gouv.fr-guichet-collaboratif) : une image nginx non privilégiée qui sert le site statique, publiée sur GHCR, que l'environnement de déploiement tire (même plateforme, autre namespace).

## Contenu de l'image

`Dockerfile` construit les trois briques et sert `dist/` avec nginx sur le port **8080** :

1. `base` : Node 24 (`.nvmrc`) + bun (`.bun-version`) + git.
2. `catalogue` : `npm ci` + `npm run build` dans `apps/rechercher-une-donnee` (clone épinglé de geonetwork-ui, patches, build Nx). Étape isolée pour que son cache ne saute que si le catalogue, `packages/brand`, `doc/agents/edito.md` ou `apps/accueil/src/css/site.css` changent.
3. `build` : `bun install --frozen-lockfile`, `build` des briques bun, puis `scripts/build-all.ts --skip-build` pour assembler `dist/`.
4. image finale : `nginx/nginx-unprivileged` (même image épinglée que le guichet), configuration `docker/nginx.conf` : repli SPA pour `/rechercher-une-donnee/` et `/explorer-les-cartes/`, pages statiques et `404.html` ailleurs.

Le site est servi à la racine du domaine (`sols.cartes.gouv.fr/`), pas sous un préfixe. L'image n'a besoin d'aucune variable d'environnement à l'exécution (pas de backend, pas d'authentification). Elle tourne avec un système de fichiers en lecture seule, à condition de monter `/tmp` en `tmpfs` (pid et fichiers temporaires de nginx).

## Publication

Le workflow `.github/workflows/docker.yml` construit l'image et l'analyse avec Trivy (résultats dans Security → Code scanning) :

| Déclencheur                             | Build + scan | Push sur `ghcr.io/ignf/sols.cartes.gouv.fr` |
| --------------------------------------- | ------------ | ------------------------------------------- |
| push sur `main`, PR « ready for review » | oui          | non                                         |
| `workflow_dispatch`                     | oui          | non                                         |
| tag `v*`                                | oui          | oui (`X.Y.Z`, `X.Y`, `sha-…`)               |

Publier une version : `git tag vX.Y.Z && git push origin vX.Y.Z`.

## Test local

```bash
docker build -t sols:local .
docker run --rm --read-only --tmpfs /tmp -p 8080:8080 sols:local
```

Derrière un proxy : `docker build --build-arg http_proxy=$http_proxy --build-arg https_proxy=$https_proxy -t sols:local .`

Le premier build du catalogue est long (plusieurs minutes, environ 2 Go de dépendances amont).
