# Guía de Despliegue en Vivo

Esta guía cubre el despliegue del backend + base de datos en **Render**
y del frontend en **Vercel** o **Netlify**, cumpliendo el requisito de
"Backend y BD desplegados" + "Frontend desplegado".

> Por qué Render para el backend: permite desplegar los 3 servicios
> NestJS como contenedores Docker directamente desde este repo (usando
> los mismos `Dockerfile` del `docker-compose.yml`), más una base de
> datos PostgreSQL administrada, todo en su capa gratuita.

---

## Opción A — Despliegue automático con Blueprint (recomendado)

1. Sube este repositorio a GitHub (o GitLab).
2. Entra a https://dashboard.render.com → **New** → **Blueprint**.
3. Selecciona el repositorio. Render detecta automáticamente
   `deploy/render.yaml` (si no lo detecta, indícalo manualmente en
   "Blueprint file path").
4. Render creará automáticamente:
   * Una base de datos PostgreSQL (`viajes-postgres`).
   * `trips-service` y `operations-service` como **Private Services**
     (solo accesibles internamente, igual que en docker-compose).
   * `api-gateway` como **Web Service** público, con `JWT_SECRET`
     autogenerado.
5. Espera a que los 3 servicios terminen de construirse (5-10 min la
   primera vez).
6. Copia la URL pública de `api-gateway`
   (algo como `https://api-gateway-xxxx.onrender.com`).

> **Nota sobre bases de datos:** el plan gratuito de Render solo incluye
> una base de datos por Blueprint. Para simplificar el despliegue de la
> prueba técnica, `trips-service` y `operations-service` comparten el
> mismo servidor PostgreSQL (cada uno con sus propias tablas). En
> `docker-compose.yml` (entorno local) sí quedan completamente
> separados en `trips_db` y `operations_db`, que es el patrón correcto
> de "database-per-service". Para producción real, crea una segunda base
> de datos en Render y actualiza el `DATABASE_URL` de
> `operations-service`.

## Opción B — Despliegue manual (paso a paso)

1. **Base de datos**: Render → New → PostgreSQL → crea `viajes-postgres`.
   Copia la "Internal Connection String".
2. **trips-service**: New → Private Service → conecta el repo →
   Root Directory: `backend/trips-service` → Environment: Docker →
   variable `DATABASE_URL` = connection string anterior (con
   `?schema=trips`, opcional).
3. **operations-service**: igual que el anterior, Root Directory:
   `backend/operations-service`, más las variables
   `TRIPS_SERVICE_HOST` / `TRIPS_SERVICE_PORT` apuntando al hostname
   interno de `trips-service` (Render lo expone como
   `<nombre-servicio>` dentro de la misma red privada).
4. **api-gateway**: New → Web Service → Root Directory:
   `backend/api-gateway` → variables `JWT_SECRET`, `TRIPS_SERVICE_HOST`,
   `TRIPS_SERVICE_PORT`, `OPERATIONS_SERVICE_HOST`,
   `OPERATIONS_SERVICE_PORT`, `CORS_ORIGIN` (URL del frontend).

---

## Frontend — Vercel

1. Entra a https://vercel.com/new e importa este repositorio.
2. **Root Directory**: `frontend/ionic-app`.
3. **Build Command**: `npm run build` (ya incluye el paso `prebuild`
   que genera `assets/config.json`).
4. **Output Directory**: `www`.
5. Variables de entorno → agrega `API_URL` con el valor de la URL
   pública del `api-gateway` + `/api`, por ejemplo:
   `https://api-gateway-xxxx.onrender.com/api`.
6. Deploy. Vercel ya incluye el archivo `vercel.json` con el rewrite
   necesario para el router de Angular (SPA).

## Frontend — Netlify (alternativa)

1. https://app.netlify.com/start → importa el repo.
2. **Base directory**: `frontend/ionic-app`.
3. **Build command**: `npm run build`.
4. **Publish directory**: `frontend/ionic-app/www`.
5. Variables de entorno → `API_URL` igual que en Vercel.
6. `netlify.toml` ya incluye el redirect SPA necesario.

---

## Últimos pasos

1. Actualiza `CORS_ORIGIN` en `api-gateway` con la URL final del
   frontend desplegado (Vercel/Netlify) y vuelve a desplegar el Gateway.
2. Verifica `https://<tu-api-gateway>/api/health` → debe responder
   `{ "status": "ok" }`.
3. Verifica `https://<tu-api-gateway>/api/docs` → Swagger debe cargar.
4. Entra al frontend desplegado y prueba login con las credenciales de
   prueba (ver README principal, sección 4).
