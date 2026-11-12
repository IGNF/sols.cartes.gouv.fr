# syntax=docker/dockerfile:1
# Build the three bricks and serve the assembled dist/ with nginx.
# Work in progress (task X5): this image is NOT used by any deployment yet.

FROM oven/bun:1.4.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/accueil/package.json apps/accueil/
COPY apps/explorer-les-cartes/package.json apps/explorer-les-cartes/
RUN bun install --frozen-lockfile

FROM node:24-bookworm-slim AS catalogue
WORKDIR /app/apps/rechercher-une-donnee
COPY apps/rechercher-une-donnee/package.json apps/rechercher-une-donnee/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else echo "catalogue lockfile missing, skipping"; fi
COPY apps/rechercher-une-donnee/ ./
RUN if [ -f package-lock.json ]; then npm run build; else mkdir -p dist; fi

FROM oven/bun:1.4.3 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=catalogue /app/apps/rechercher-une-donnee/dist ./apps/rechercher-une-donnee/dist
RUN bun run --filter @sols/accueil build \
 && bun run --filter @sols/explorer-les-cartes build \
 && bun scripts/build-all.ts --skip-build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
