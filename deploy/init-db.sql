-- Se ejecuta automáticamente la primera vez que arranca el contenedor de Postgres
-- (montado en /docker-entrypoint-initdb.d). Crea las dos bases de datos lógicas,
-- una por microservicio, dentro del mismo servidor Postgres.

CREATE DATABASE trips_db;
CREATE DATABASE operations_db;
