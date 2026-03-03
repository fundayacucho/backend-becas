# Deploy Migracion a `becarios_v2` (Produccion)

## Objetivo
Migrar el backend de la BD legacy `becario_newBecarios` a la nueva BD `becarios_v2` con ventana controlada, validacion post-deploy y rollback rapido.

## Requisitos Previos
- Acceso a servidor de produccion.
- Node.js y npm instalados.
- PostgreSQL accesible con usuario de escritura.
- Variables de entorno completas en `backend_becarios/.env`.
- Confirmar que la BD legacy `becario_newBecarios` sigue intacta (backup operativo).

## Variables de Entorno Clave
Mantener en `.env`:
- `LEGACY_DB_NAME=becario_newBecarios`
- `DB_NAME=becarios_v2` (solo cuando se haga el cutover)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `ALLOWED_ORIGINS`, `UPLOAD_BASE_DIR`

## Procedimiento de Deploy
1. Crear respaldo de seguridad de las dos bases:
```powershell
pg_dump -h <host> -p <port> -U <user> -F c -d becario_newBecarios -f backup_legacy_YYYYMMDD.backup
pg_dump -h <host> -p <port> -U <user> -F c -d becarios_v2 -f backup_v2_YYYYMMDD.backup
```

2. Actualizar codigo en servidor:
```powershell
git pull
cd backend_becarios
npm ci
```

3. Preparar y migrar datos a V2 (si aun no esta sincronizada):
```powershell
npm run db:setup
npm run db:migrate
npm run db:import-extranjeros
```

4. Ejecutar validacion E2E sobre backend local del servidor:
```powershell
npm run test:e2e
```

5. Hacer cutover de runtime a V2:
- Editar `.env` y establecer:
```env
DB_NAME=becarios_v2
LEGACY_DB_NAME=becario_newBecarios
```

6. Reiniciar servicio:
```powershell
pm2 restart <nombre-app>
```
o el supervisor equivalente (systemd/docker).

7. Verificacion post-deploy:
- Login admin/analista.
- Endpoints clave:
  - `GET /api/becarios/becarios`
  - `GET /api/becarios/get_becarioesterior`
  - `GET /api/becarios/egresado`
  - `GET /api/extranjeros/listar`
- Flujo de escritura:
  - `POST /api/becarios/registro`
  - `POST /api/becarios/registroBecarioExteriol`
  - `POST /api/egresado/register`
  - `POST /api/extranjeros/registro`

## Rollback (Revertir a `becario_newBecarios`)
Usar rollback si hay incidentes de disponibilidad, errores de contrato API o fallas funcionales criticas.

1. Cambiar `.env` del backend:
```env
DB_NAME=becario_newBecarios
```

2. Reiniciar servicio:
```powershell
pm2 restart <nombre-app>
```

3. Validar salud minima:
- `POST /api/auth/login`
- `GET /api/becarios/becarios`
- `GET /api/becarios/get_becarioesterior`
- `GET /api/becarios/egresado`

4. Mantener `becarios_v2` sin borrar para analisis de incidente.

## Notas Operativas
- No ejecutar `DROP DATABASE` en ninguna fase de deploy/rollback.
- `becario_newBecarios` se mantiene como respaldo funcional.
- Documentar hora de cutover, responsable y resultado de pruebas en bitacora de release.
