#!/bin/sh
set -e

echo "⏳ Sincronizando esquema de Prisma (operations-service)..."
npx prisma db push --skip-generate --accept-data-loss

echo "🚀 Iniciando operations-service..."
node dist/main.js
