/** URLs base de los microservicios internos, leídas de variables de
 * entorno. En docker-compose apuntan al nombre del servicio en la red
 * interna de Docker; en Render apuntan a la URL pública de cada Web
 * Service (ver deploy/render.yaml y DEPLOY.md). */
export const TRIPS_SERVICE_URL =
  process.env.TRIPS_SERVICE_URL || 'http://trips-service:3001';

export const OPERATIONS_SERVICE_URL =
  process.env.OPERATIONS_SERVICE_URL || 'http://operations-service:3002';
