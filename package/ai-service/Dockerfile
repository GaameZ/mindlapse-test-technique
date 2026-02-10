# Dockerfile pour le Worker AI
FROM node:22-alpine AS base

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copier les fichiers de workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package/shared ./package/shared
COPY package/ai-service ./package/ai-service

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Build du shared
WORKDIR /app/package/shared
RUN pnpm build

# Retour au worker
WORKDIR /app/package/ai-service

# Commande de démarrage
CMD ["pnpm", "dev"]
