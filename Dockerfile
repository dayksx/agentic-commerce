# Étape 1: Image de base avec Node.js
# On utilise une image officielle Node.js basée sur Debian
FROM node:20-slim AS base

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Étape 2: Installer pnpm globalement
RUN npm install -g pnpm@10.6.5

# Étape 3: Copier les fichiers de dépendances
# On copie d'abord package.json, pnpm-lock.yaml et .npmrc pour bénéficier du cache Docker
COPY package.json pnpm-lock.yaml .npmrc ./

# Étape 4: Installer les dépendances
# Cette étape sera mise en cache si package.json ne change pas
RUN pnpm install --frozen-lockfile

# Étape 5: Copier le reste du code source
COPY . .

# Étape 6: Compiler TypeScript
RUN pnpm build

# Étape 7: Exposer les ports utilisés par l'application
# 3000: Agent Card Server
# 3001: A2A Server
# 8001: MCP Server
EXPOSE 3000 3001 8001

# Étape 8: Commande par défaut pour démarrer l'application
CMD ["pnpm", "start"]

