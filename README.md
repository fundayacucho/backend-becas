# Backend Becarios Fundayacucho

API Node.js + Express para gestión de becarios con base de datos PostgreSQL y Sequelize.

## Scripts
- `npm run dev` inicia en modo desarrollo.
- `npm start` inicia servidor normal.
- `npm run test` ejecuta tests de regresión API (Jest + Supertest).
- `npm run test:e2e` ejecuta smoke E2E.
- `npm run db:setup` crea estructura y catálogos en `becarios_v2`.
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

## Tipos soportados en upsert unificado
- `VEN_VEN` (`1`)
- `VEN_EXT` (`2`)
- `EXT_VEN` (`3`)
- `EGRESADO`

## Documentación de uso API
Ver:
- `../docs/api_becarios_unificada.md.resolved`
- `DEPLOY_MIGRACION_V2.md`

## Pruebas
La suite principal está en:
- `tests/endpoints.test.js`

Incluye:
- Contrato API de endpoints críticos.
- Seguridad por roles (`403` para usuario no ADMIN en ruta ADMIN).
- Validación de nuevos endpoints unificados por tipo.
