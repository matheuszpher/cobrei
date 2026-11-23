# ---------- etapa de build ----------
FROM node:22-alpine AS build
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# ---------- etapa final ----------
FROM node:22-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY package.json ./
EXPOSE 3333
# Aplica as migrations, popula a demonstração (se vazio) e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js && node dist/server.js"]
