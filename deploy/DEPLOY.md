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
3. Selecciona el repositorio. **Importante**: en el campo "Blueprint
   Path" escribe `deploy/render.yaml` a mano — el archivo no está en la
   raíz del repo, y Render no lo encuentra solo si dejas ese campo vacío.
4. Render creará automáticamente:
   * Una base de datos PostgreSQL (`viajes-postgres`).
   * `trips-service`, `operations-service` y `api-gateway`, los 3 como
     **Web Service** (para poder usar el plan gratuito — ver nota abajo).
   * Una clave `INTERNAL_API_KEY` autogenerada y compartida entre los 3
     servicios backend (vía `envVarGroups` en el blueprint).
5. Espera a que los 3 servicios terminen de construirse (5-10 min la
   primera vez).
6. Copia la URL pública de cada servicio desde el dashboard (con el
   patrón `https://<nombre-del-servicio>.onrender.com`, salvo que el
   nombre ya esté tomado por otra cuenta en Render, en cuyo caso te
   pondrá un sufijo distinto).
7. **Verifica las URLs entre servicios**: `deploy/render.yaml` trae un
   valor por defecto (`https://trips-service.onrender.com`, etc.) para
   `TRIPS_SERVICE_URL` (en `operations-service` y `api-gateway`) y
   `OPERATIONS_SERVICE_URL` (en `api-gateway`). Si el nombre real que te
   asignó Render es distinto, entra a cada servicio → **Environment** →
   corrige esa variable con la URL real → Render redepliega solo.

> **Por qué los 3 son "Web Service" y no "Private Service":** el plan
> gratuito de Render no permite crear Private Services (esa opción
> requiere el plan Pro, $25/mes), y tampoco permite que un Web Service
> gratuito reciba tráfico por la red privada interna — solo puede
> enviarlo. Por eso `trips-service` y `operations-service` se comunican
> entre sí (y con `api-gateway`) por su URL pública normal, protegidos
> con la clave compartida `INTERNAL_API_KEY`: cualquier request a sus
> endpoints internos que no traiga el header `x-internal-key` correcto
> se rechaza con 401. Localmente (`docker-compose.yml`) esto no aplica —
> ahí siguen aislados dentro de la red interna de Docker de todas
> formas, la clave es una capa extra de seguridad también en local.

> **Nota sobre bases de datos:** el plan gratuito de Render solo incluye
> una base de datos por Blueprint. Para simplificar el despliegue de la
> prueba técnica, `trips-service` y `operations-service` comparten el
> mismo servidor PostgreSQL, pero cada uno usa su **propio schema de
> Postgres** dentro de esa base de datos (`public` para trips-service,
> `operations` para operations-service — ver `docker-entrypoint.sh` de
> cada servicio). Esto es necesario porque cada servicio corre
> `prisma db push --accept-data-loss` con un `schema.prisma` distinto; si
> ambos apuntaran al mismo schema de Postgres, el `db push` de uno podía
> interpretar las tablas del otro como drift no reconocido y resetearlas
> (bug real que se dio en el primer despliegue: login fallaba con "Error
> del microservicio" porque `db push` de operations-service borraba las
> tablas de trips-service). En `docker-compose.yml` (entorno local) los
> dos servicios ya tienen bases de datos completamente separadas
> (`trips_db` y `operations_db`), que es el patrón correcto de
> "database-per-service"; para producción real, lo ideal es crear una
> segunda base de datos en Render y actualizar el `DATABASE_URL` de
> `operations-service` en vez de compartir servidor.

## Opción B — Despliegue manual (paso a paso)

1. **Base de datos**: Render → New → PostgreSQL → crea `viajes-postgres`.
   Copia la "Internal Connection String".
2. **trips-service**: New → Web Service → conecta el repo →
   Root Directory: `backend/trips-service` → Environment: Docker →
   variables `DATABASE_URL` (connection string anterior) e
   `INTERNAL_API_KEY` (inventa un valor largo y aleatorio).
3. **operations-service**: igual que el anterior, Root Directory:
   `backend/operations-service`, más `INTERNAL_API_KEY` (el mismo valor
   exacto) y `TRIPS_SERVICE_URL` apuntando a la URL pública de
   `trips-service`.
4. **api-gateway**: New → Web Service → Root Directory:
   `backend/api-gateway` → variables `JWT_SECRET`, `INTERNAL_API_KEY`
   (mismo valor otra vez), `TRIPS_SERVICE_URL`, `OPERATIONS_SERVICE_URL`,
   `CORS_ORIGIN` (URL del frontend).

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
