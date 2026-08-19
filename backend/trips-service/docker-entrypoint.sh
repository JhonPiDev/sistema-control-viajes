#!/bin/sh
set -e

# En el plan gratuito de Render, trips-service y operations-service
# comparten la misma base de datos física de Postgres (solo se permite una
# BD por Blueprint). Para que sus respectivos "prisma db push
# --accept-data-loss" no choquen entre sí (cada servicio tiene un schema.
# prisma distinto, y al ver tablas del OTRO servicio que su propio schema
# no reconoce, "db push" puede interpretarlo como drift y resetear el
# schema completo, borrando las tablas del otro), cada servicio usa su
# PROPIO schema de Postgres dentro de la misma base de datos:
# trips-service -> "public", operations-service -> "operations". Prisma
# crea el schema automáticamente si no existe. En docker-compose local
# esto no aplica (cada uno ya tiene su propia base de datos separada), pero
# fijarlo explícitamente no rompe nada.
case "$DATABASE_URL" in
  *"?"*) export DATABASE_URL="${DATABASE_URL}&schema=public" ;;
  *) export DATABASE_URL="${DATABASE_URL}?schema=public" ;;
esac

echo "⏳ Sincronizando esquema de Prisma (trips-service, schema=public)..."
# Se usa "db push" porque el repo no versiona migraciones firmadas contra una BD real.
# Para producción real, sustituir por "prisma migrate deploy" con migraciones generadas
# en desarrollo (ver README, sección "Migraciones").
npx prisma db push --skip-generate --accept-data-loss

echo "🌱 Ejecutando seed de datos de prueba (idempotente)..."
npx prisma db seed || echo "⚠️  Seed ya aplicado u omitido"

echo "🚀 Iniciando trips-service..."
node dist/main.js
