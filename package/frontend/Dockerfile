# Dockerfile pour le Frontend Vite
FROM node:22-alpine AS base

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copier les fichiers de workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package/shared ./package/shared
COPY package/frontend ./package/frontend

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Build du shared
WORKDIR /app/package/shared
RUN pnpm build

# Retour au frontend
WORKDIR /app/package/frontend

# Exposer le port Vite
EXPOSE 5173

# Commande de démarrage avec host 0.0.0.0 pour accès externe
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
