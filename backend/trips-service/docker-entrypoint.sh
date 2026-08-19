#!/bin/sh
set -e

echo "⏳ Sincronizando esquema de Prisma (trips-service)..."
# Se usa "db push" porque el repo no versiona migraciones firmadas contra una BD real.
# Para producción real, sustituir por "prisma migrate deploy" con migraciones generadas
# en desarrollo (ver README, sección "Migraciones").
npx prisma db push --skip-generate --accept-data-loss

echo "🌱 Ejecutando seed de datos de prueba (idempotente)..."
npx prisma db seed || echo "⚠️  Seed ya aplicado u omitido"

echo "🚀 Iniciando trips-service..."
node dist/main.js
