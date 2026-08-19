#!/bin/sh
set -e

# En el plan gratuito de Render, operations-service comparte la misma base
# de datos física de Postgres que trips-service (solo se permite una BD por
# Blueprint). Usa su propio schema de Postgres ("operations") dentro de esa
# misma base de datos para no chocar con las tablas de trips-service que
# viven en "public" (ver el comentario largo en
# trips-service/docker-entrypoint.sh para el porqué). Prisma crea el schema
# automáticamente si no existe.
case "$DATABASE_URL" in
  *"?"*) export DATABASE_URL="${DATABASE_URL}&schema=operations" ;;
  *) export DATABASE_URL="${DATABASE_URL}?schema=operations" ;;
esac

echo "⏳ Sincronizando esquema de Prisma (operations-service, schema=operations)..."
npx prisma db push --skip-generate --accept-data-loss

echo "🚀 Iniciando operations-service..."
node dist/main.js
