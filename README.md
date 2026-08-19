# 🚌 Sistema de Control de Viajes y Novedades

Prueba técnica Full Stack Senior — Factoría Web S.A.S.

Plataforma para la gestión de viajes en bus, validación de pasajeros y
reporte de novedades en ruta, construida con arquitectura de
microservicios (NestJS), frontend híbrido (Ionic + Angular) y despliegue
en contenedores Docker.

---

## 🔗 Despliegue en vivo

| Recurso | URL |
|---|---|
| Frontend (Admin + Conductor) | https://sistema-control-viajes.vercel.app |
| API Gateway (REST) | https://api-gateway-y35g.onrender.com/api |
| Documentación Swagger | https://api-gateway-y35g.onrender.com/api/docs |
| Healthcheck | https://api-gateway-y35g.onrender.com/api/health |

Credenciales de prueba en la sección [4](#4-credenciales-de-prueba-pre-cargadas-por-el-seed) más abajo.

> Nota: el backend está en el plan gratuito de Render, así que los
> servicios pueden "dormirse" tras ~15 min sin tráfico; la primera
> petición después de estar inactivos puede tardar unos segundos extra en
> responder mientras el contenedor despierta.

---

## 1. Arquitectura

```
                       ┌───────────────────────┐
                       │   Frontend (Ionic +    │
                       │   Angular, standalone) │
                       │  Admin (web) / Driver  │
                       │       (móvil)          │
                       └───────────┬───────────┘
                                   │ HTTPS / REST + JWT
                                   ▼
                       ┌───────────────────────┐
                       │      API Gateway       │
                       │  (NestJS · REST · JWT  │
                       │  RBAC · Swagger)       │
                       └─────┬─────────────┬────┘
                   HTTP      │             │      HTTP
              (API interna, protegida con clave compartida)
                             ▼             ▼
              ┌───────────────────┐  ┌───────────────────────┐
              │   trips-service    │  │  operations-service    │
              │  Usuarios/Auth     │◄─┤  Gastos y Novedades    │
              │  Viajes            │  │  (valida estado del    │
              │  Pasajeros         │  │   viaje vía HTTP antes │
              │  Firma digital     │  │   de escribir)         │
              └─────────┬──────────┘  └───────────┬────────────┘
                        │                          │
                        ▼                          ▼
                 ┌─────────────┐            ┌─────────────────┐
                 │  trips_db   │            │  operations_db   │
                 │ (PostgreSQL)│            │  (PostgreSQL)    │
                 └─────────────┘            └─────────────────┘
```

**Por qué esta arquitectura:**

* **API Gateway** centraliza autenticación (JWT), RBAC, validación de DTOs,
  manejo de errores y agrega datos de ambos microservicios para el
  reporte de cierre de viaje (`GET /trips/:id/report`).
* **trips-service** y **operations-service** son dos microservicios NestJS
  independientes, cada uno con su propia base de datos lógica en
  PostgreSQL y comunicados entre sí por **HTTP**, protegidos con una
  clave interna compartida (`INTERNAL_API_KEY`) que valida que la llamada
  venga realmente de otro servicio del sistema y no de un tercero. La
  regla de negocio *"no se pueden reportar gastos de un viaje que no ha
  iniciado"* se resuelve con `operations-service` consultando en vivo el
  estado del viaje a `trips-service` antes de escribir en su propia base
  de datos.
* En `docker-compose.yml` (entorno local) los tres servicios backend
  viven en la misma red interna de Docker, así que ni `trips-service` ni
  `operations-service` quedan expuestos fuera del stack; solo el API
  Gateway publica un puerto. En un despliegue en la nube en el plan
  gratuito de un proveedor (ver sección de despliegue), esa separación de
  red no siempre está disponible, por eso la clave compartida es la
  segunda capa de protección independientemente del entorno.

---

## 2. Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | NestJS 10, TypeScript, arquitectura de microservicios (HTTP interno) |
| ORM / BD | Prisma + PostgreSQL 16 |
| Auth | JWT + Passport, Guards de roles (RBAC) |
| Frontend | Ionic 8 + Angular 18 (standalone components), Signals |
| Firma digital | `signature_pad` sobre `<canvas>` |
| DevOps | Docker multi-stage, docker-compose, Nginx |
| Docs API | Swagger (`/api/docs`) |

---

## 3. Levantar el proyecto con Docker (recomendado)

### Requisitos
* Docker y Docker Compose instalados.

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>
cd sistema-control-viajes

# 2. Copiar variables de entorno
cp .env.example .env
# (opcional) edita .env si quieres cambiar contraseñas o puertos

# 3. Levantar todo el stack
docker compose up --build
```

Esto levanta, en orden:

1. **postgres** — un servidor PostgreSQL con dos bases de datos
   (`trips_db`, `operations_db`) creadas automáticamente por
   `deploy/init-db.sql`.
2. **trips-service** — aplica el esquema de Prisma (`prisma db push`) y
   siembra datos de prueba (usuarios + un viaje demo) de forma
   idempotente.
3. **operations-service** — aplica su propio esquema de Prisma.
4. **api-gateway** — expone la API REST en `http://localhost:3000/api`.
5. **frontend** — build de producción de Ionic servido por Nginx en
   `http://localhost:8100`.

### URLs locales

| Servicio | URL |
|---|---|
| Frontend (Admin + Conductor) | http://localhost:8100 |
| API Gateway (REST) | http://localhost:3000/api |
| Documentación Swagger | http://localhost:3000/api/docs |
| Healthcheck | http://localhost:3000/api/health |

### Apagar / limpiar

```bash
docker compose down          # detiene los contenedores
docker compose down -v       # además borra el volumen de Postgres
```

---

## 4. Credenciales de prueba (pre-cargadas por el seed)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@viajes.com` | `Admin123!` |
| Conductor 1 | `conductor@viajes.com` | `Driver123!` |
| Conductor 2 | `conductor2@viajes.com` | `Driver123!` |

El conductor `conductor@viajes.com` ya tiene un viaje demo asignado
("Bogotá - Medellín (Demo)") con 4 pasajeros pendientes de check-in, para
que el flujo completo del conductor se pueda probar de inmediato.

---

## 5. Flujos implementados

### Administrador (web, `/admin`)
* Login → Dashboard con listado paginado de viajes, filtrable por estado.
* Crear viaje: nombre, origen, destino, conductor asignado y lista
  inicial de pasajeros (nombre + documento).
* Detalle de viaje: estado, pasajeros y su check-in, gastos y novedades
  reportadas en tiempo real (pull-to-refresh).
* Ajustes de apariencia (tema claro / oscuro / personalizado).

### Conductor (móvil, `/driver`)
1. **Mi Viaje** → ve el viaje asignado.
2. **Check-in de pasajeros** → marca cada pasajero como abordó / no se
   presentó.
3. **Firma digital** → captura en `<canvas>` la firma del
   despachador/cliente. **El botón "Iniciar viaje" permanece bloqueado
   hasta que exista una firma guardada** (regla validada tanto en el
   frontend como en `trips-service`).
4. **Iniciar viaje** → cambia el estado a `IN_PROGRESS`.
5. **En Ruta** → pestañas de Gastos (combustible, peajes, reparaciones)
   y Novedades (retrasos, problemas con pasajeros, desvíos). Cada
   registro es validado por `operations-service` contra el estado real
   del viaje antes de guardarse.
6. **Cerrar viaje** → genera el reporte resumen (pasajeros transportados,
   total de gastos, novedades) agregando datos de ambos microservicios.

---

## 6. Buenas prácticas implementadas

* **RBAC real** con `JwtAuthGuard` + `RolesGuard` + decorador `@Roles()`
  en cada endpoint del Gateway.
* **Validación estricta de DTOs** (`class-validator`, `whitelist: true`,
  `forbidNonWhitelisted: true`) tanto en el Gateway como en cada
  microservicio.
* **Manejo centralizado de errores** vía `AllExceptionsFilter`, que
  normaliza tanto `HttpException` propias como errores propagados desde
  los microservicios en una respuesta consistente
  `{ statusCode, error, message, timestamp, path }`.
* **Paginación** en el listado de viajes (`page`, `limit`, `status`).
* **Lógica transaccional entre servicios**: `operations-service` no
  persiste un gasto/novedad sin antes confirmar por HTTP que el viaje
  está `IN_PROGRESS`.
* **Autenticación interna entre microservicios** (`INTERNAL_API_KEY`):
  todos los endpoints de `trips-service` y `operations-service` exigen un
  header `x-internal-key` válido, así que solo el Gateway (y entre ellos)
  pueden invocarlos.
* **Rate limiting** básico (`@nestjs/throttler`) en el Gateway.
* **Swagger** documentando todos los endpoints REST con JWT Bearer.
* **Theming real**: tokens CSS propios (`--app-color-*`, `--app-space-*`,
  `--app-radius-*`) mapeados a las variables de Ionic, con modo claro,
  oscuro y un selector de color personalizado que persiste en
  `localStorage`.
* **Gestión de estado en frontend** con Angular Signals por dominio
  (`TripsService`, etc.), evitando llamadas HTTP redundantes entre
  pantallas que comparten datos.
* **Config runtime del frontend**: la URL del API se inyecta en
  `assets/config.json` en tiempo de arranque del contenedor (no de
  build), así la misma imagen Docker sirve para cualquier entorno.

---

## 7. Migraciones de base de datos

Por simplicidad y tiempo de entrega, el arranque de cada microservicio
usa `prisma db push` (sincroniza el esquema directamente) en lugar de
migraciones versionadas. Para un entorno productivo real, se recomienda
generar migraciones versionadas en desarrollo:

```bash
cd backend/trips-service
npx prisma migrate dev --name init
```

y cambiar el entrypoint a `npx prisma migrate deploy`.

---

## 8. Desarrollo local sin Docker (opcional)

Cada servicio es un proyecto Node independiente:

```bash
# Por cada carpeta: backend/trips-service, backend/operations-service, backend/api-gateway
cd backend/trips-service
npm install
cp .env.example .env   # si aplica
npx prisma generate
npm run start:dev
```

```bash
cd frontend/ionic-app
npm install
npm start   # http://localhost:8100
```

---

## 9. Despliegue en producción

Ver [`deploy/DEPLOY.md`](./deploy/DEPLOY.md) para instrucciones paso a
paso de despliegue en **Render** (backend + PostgreSQL) y
**Vercel/Netlify** (frontend).

---

## 10. Estructura del repositorio

```
sistema-control-viajes/
├── docker-compose.yml
├── .env.example
├── deploy/
│   ├── init-db.sql          # crea trips_db y operations_db en Postgres
│   ├── render.yaml           # Blueprint de despliegue en Render
│   └── DEPLOY.md             # guía de despliegue paso a paso
├── backend/
│   ├── trips-service/        # Usuarios, Auth, Viajes, Pasajeros, Firma
│   ├── operations-service/   # Gastos, Novedades
│   └── api-gateway/          # REST público, JWT, RBAC, agregación
└── frontend/
    └── ionic-app/             # Ionic + Angular (Admin web + Conductor móvil)
```

---

## 11. Extras añadidos sobre el alcance mínimo

* Documentación Swagger interactiva.
* Rate limiting en el Gateway.
* Helmet (cabeceras de seguridad HTTP).
* Config runtime del frontend (una sola imagen Docker sirve para
  cualquier entorno, sin rebuild).
* Selector de tema personalizado con paleta de colores, no solo
  claro/oscuro.
* Seed de datos de prueba idempotente con viaje demo pre-cargado.
* Healthcheck endpoint (`/api/health`) y healthcheck de Postgres en
  docker-compose.
* Blueprint de Render (`render.yaml`) listo para desplegar con un clic
  además de la configuración manual documentada.
