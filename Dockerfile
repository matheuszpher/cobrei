# Imagem de produção: a API serve também o site, no mesmo endereço.
FROM node:22-alpine AS web
WORKDIR /app
ENV VITE_API_URL=/api
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS api
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=api /usr/src/app/node_modules ./node_modules
COPY --from=api /usr/src/app/dist ./dist
COPY --from=api /usr/src/app/prisma ./prisma
COPY --from=web /app/dist ./public
COPY backend/package.json ./
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js && node dist/server.js"]
