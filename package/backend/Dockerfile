# Dockerfile pour le Backend AdonisJS
FROM node:22-alpine AS base

# Installer pnpm et postgresql-client pour le health check
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate && \
    apk add --no-cache postgresql-client

WORKDIR /app

# Copier les fichiers de workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package/shared ./package/shared
COPY package/backend ./package/backend

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Build du shared
WORKDIR /app/package/shared
RUN pnpm build

# Retour au backend
WORKDIR /app/package/backend

# Exposer le port
EXPOSE 3333

# Script de démarrage avec migrations et seed
COPY package/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Commande de démarrage
CMD ["docker-entrypoint.sh"]
