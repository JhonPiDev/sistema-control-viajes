# ---------- Etapa 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Prisma necesita openssl instalado para poder detectar la versión de
# libssl y descargar/usar el motor (engine) correcto sobre Alpine (musl).
# Sin esto, "prisma generate" falla con errores crípticos de JSON.
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- Etapa 2: runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3002
ENTRYPOINT ["./docker-entrypoint.sh"]
