# syntax=docker/dockerfile:1
#----------------------------------------------------------------------
# sols.cartes.gouv.fr : build statique des trois briques puis nginx
# (même schéma que cartes.gouv.fr-guichet-collaboratif, voir doc/docker.md)
#----------------------------------------------------------------------

# Version de bun : garder alignée sur .bun-version
FROM oven/bun:1.4.3 AS bun

#----------------------------------------------------------------------
# Base de build : Node (.nvmrc) + bun + git (clone de geonetwork-ui)
#----------------------------------------------------------------------
FROM node:24-bookworm-slim AS base

# Derrière un proxy : passer --build-arg http_proxy=... --build-arg https_proxy=...
# (arguments prédéfinis de Docker, disponibles dans toutes les étapes sans déclaration)
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

#----------------------------------------------------------------------
# Catalogue : clone épinglé de geonetwork-ui + patches + build Nx.
# Étape isolée : son cache ne saute que si le catalogue, l'identité
# partagée ou les sources de l'en-tête/pied de page changent.
#----------------------------------------------------------------------
FROM base AS catalogue
COPY packages/brand packages/brand
COPY doc/agents/edito.md doc/agents/edito.md
COPY apps/accueil/src/css/site.css apps/accueil/src/css/site.css
COPY apps/rechercher-une-donnee apps/rechercher-une-donnee
RUN cd apps/rechercher-une-donnee \
    && npm ci \
    && npm run build \
    && rm -rf .upstream

#----------------------------------------------------------------------
# Edito + carto (workspace bun), puis assemblage de dist/
#----------------------------------------------------------------------
FROM base AS build
COPY package.json bun.lock ./
COPY packages/brand/package.json packages/brand/
COPY apps/accueil/package.json apps/accueil/
COPY apps/explorer-les-cartes/package.json apps/explorer-les-cartes/
RUN bun install --frozen-lockfile
COPY . .
COPY --from=catalogue /app/apps/rechercher-une-donnee/dist apps/rechercher-une-donnee/dist
RUN bun run --filter @sols/accueil build \
    && bun run --filter @sols/explorer-les-cartes build \
    && bun scripts/build-all.ts --skip-build

#----------------------------------------------------------------------
# Serveur statique nginx non privilégié
#----------------------------------------------------------------------
FROM nginx/nginx-unprivileged:alpine3.24-perl@sha256:d3411ed56e3a0ecfdc485e584e6c8365d60ce95950e4e8cfc9c26b90e02f116f
# Correctifs de sécurité Alpine parus depuis l'image épinglée (alertes Trivy)
USER root
RUN apk upgrade --no-cache
COPY --from=build /app/dist /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/nginx.conf
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]
