FROM node:20-alpine

WORKDIR /app

# Les dépendances de développement (dont Nest CLI) sont nécessaires au build.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

EXPOSE 8002
CMD ["npm", "run", "start:prod"]
