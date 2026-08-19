/**
 * Genera src/assets/config.json a partir de la variable de entorno API_URL
 * antes del build. Así, tanto Vercel/Netlify (build estático) como el
 * contenedor Docker (vía docker-entrypoint.sh, en runtime) pueden apuntar
 * el frontend a la URL correcta del API Gateway sin tocar código.
 *
 * Uso: definir API_URL en las variables de entorno del proveedor de
 * despliegue (ej. https://mi-api-gateway.onrender.com/api) y este script
 * corre automáticamente como "prebuild".
 */
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
const target = path.join(__dirname, '..', 'src', 'assets', 'config.json');

fs.writeFileSync(target, JSON.stringify({ apiUrl }, null, 2));
console.log(`✅ src/assets/config.json generado con apiUrl=${apiUrl}`);
