# Image Docker (travail en cours, X5)

`Dockerfile` construit les trois briques et sert `dist/` avec nginx (non privilégié, port 8080) :

1. `deps` : `bun install --frozen-lockfile` pour la racine et les workspaces bun.
2. `catalogue` : `npm ci` + `npm run build` dans `apps/rechercher-une-donnee` (Node 24). Si le lockfile n'existe pas encore, l'étape est sautée.
3. `build` : `build` des briques bun puis `scripts/build-all.ts --skip-build` pour assembler `dist/`.
4. `runtime` : `nginxinc/nginx-unprivileged`, configuration `docker/nginx.conf` (repli SPA pour `/rechercher-une-donnee/` et `/explorer-les-cartes/`).

Le workflow `.github/workflows/docker.yml` construit l'image à la demande (`workflow_dispatch`) ou sur un tag `v*`, et ne pousse sur GHCR que pour un tag.

Hors périmètre v0 : déploiement, Kubernetes, authentification. Cette PR reste ouverte tant que la cible de déploiement n'est pas décidée.

Test local :

```bash
docker build -t sols:local .
docker run --rm -p 8080:8080 sols:local
```
