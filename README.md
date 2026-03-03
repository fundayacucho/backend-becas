# Backend Becarios Fundayacucho

API Node.js + Express para gestion de becarios con base de datos PostgreSQL y Sequelize.

## Scripts
- `npm run dev` inicia en modo desarrollo.
- `npm start` inicia servidor normal.
- `npm run test` ejecuta tests de regresion API (Jest + Supertest).
- `npm run test:e2e` ejecuta smoke E2E.
- `npm run db:setup` crea estructura y catalogos en `becarios_v2`.
- `npm run db:migrate` migra datos legacy a V2.
- `npm run db:import-extranjeros` importa CSV de extranjeros.

## Endpoints clave (legacy + nuevos)
- Legacy:
  - `POST /api/becarios/registro`
  - `POST /api/becarios/registroBecarioExteriol`
  - `POST /api/egresado/register`
  - `POST /api/extranjeros/registro`
- Nuevo endpoint unificado:
  - `POST /api/becarios/upsert-por-tipo`
  - `PUT /api/becarios/upsert-por-tipo/:id`
- Modulo constancias internacionales:
  - `GET /api/constancias-internacionales/placeholders`
  - `GET /api/constancias-internacionales/template`
  - `PUT /api/constancias-internacionales/template`
  - `POST /api/constancias-internacionales/preview`
  - `POST /api/constancias-internacionales/generate` (HTML/PDF con `format=pdf`) 

## Tipos soportados en upsert unificado
- `VEN_VEN` (`1`)
- `VEN_EXT` (`2`)
- `EXT_VEN` (`3`)
- `EGRESADO`

## Roles
- El usuario administrador debe tener `id_rol = 4` (codigo `ADMIN` en `cat_roles`).

## Documentacion de uso API
Ver:
- `../docs/api_becarios_unificada.md.resolved`
- `../docs/api_constancias_internacionales.md`
- `DEPLOY_MIGRACION_V2.md`

## Pruebas
La suite principal esta en:
- `tests/endpoints.test.js`

Incluye:
- Contrato API de endpoints criticos.
- Seguridad por roles (`403` para usuario no ADMIN en ruta ADMIN).
- Validacion de nuevos endpoints unificados por tipo.
- Validacion del modulo de constancias internacionales.


## Variables de entorno para migracion legacy
- LEGACY_DB_NAME (default: becario_newBecarios)
- LEGACY_DB_USER (si no se define, usa DB_USER)
- LEGACY_DB_PASSWORD (si no se define, usa DB_PASSWORD)
- LEGACY_DB_HOST (si no se define, usa DB_HOST)
- LEGACY_DB_PORT (si no se define, usa DB_PORT)

