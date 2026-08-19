#!/bin/sh
# Se ejecuta automáticamente al arrancar el contenedor (convención de la
# imagen oficial de nginx: scripts en /docker-entrypoint.d/).
# Sustituye la URL del API Gateway en config.json usando la variable de
# entorno API_URL, sin necesidad de reconstruir el bundle de Angular.
set -e

CONFIG_FILE="/usr/share/nginx/html/assets/config.json"
API_URL_VALUE="${API_URL:-http://localhost:3000/api}"

if [ -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" <<EOF
{
  "apiUrl": "${API_URL_VALUE}"
}
EOF
  echo "✅ config.json actualizado con apiUrl=${API_URL_VALUE}"
fi
