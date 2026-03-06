# Sistema de Gestión de Roles y Permisos

Esta documentación describe el sistema de gestión de roles y permisos implementado en el backend, siguiendo la guía `backend_guide_roles.md`.

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `migrations/005_create_permisos_rol.sql` - Migración para crear tabla de permisos
- `models/PermisosRol.js` - Modelo Sequelize para permisos de roles
- `controllers/rolesController.js` - Controlador para gestión de permisos
- `routes/roles.js` - Rutas API para gestión de roles y permisos
- `middleware/permissions.js` - Middleware de verificación de permisos
- `scripts/setup-roles-permissions.js` - Script para ejecutar migración

### Archivos Modificados
- `middleware/auth.js` - Agregada función `requireAdmin`
- `routes/becarios.js` - Agregados middleware de permisos
- `routes/auth.js` - Actualizado para usar nuevo sistema de permisos
- `app.js` - Agregadas rutas de roles

## 🗄️ Base de Datos

### Tabla `permisos_rol`
```sql
CREATE TABLE permisos_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL,
    ver BOOLEAN DEFAULT true,
    crear BOOLEAN DEFAULT false,
    editar BOOLEAN DEFAULT false,
    borrar BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_permisos_rol_cat_roles FOREIGN KEY (rol_id) REFERENCES cat_roles(id),
    CONSTRAINT unique_rol_permiso UNIQUE (rol_id)
);
```

## 🔐 Sistema de Permisos

### Tipos de Permisos
- **ver** - Acceso de lectura a recursos
- **crear** - Creación de nuevos recursos
- **editar** - Modificación de recursos existentes
- **borrar** - Eliminación de recursos

### Middleware de Permisos

#### `requirePermission(action)`
Verifica un permiso específico:
```javascript
router.get('/datos', requirePermission('ver'), controller.getDatos);
router.post('/crear', requirePermission('crear'), controller.create);
```

#### `requirePermissions(actions, operator)`
Verifica múltiples permisos:
```javascript
// Requiere ambos permisos (AND por defecto)
router.put('/editar', requirePermissions(['ver', 'editar']), controller.update);

// Requiere al menos uno de los permisos (OR)
router.delete('/borrar', requirePermissions(['editar', 'borrar'], 'OR'), controller.delete);
```

#### Permisos Predefinidos
- `canView` - Alias para `requirePermission('ver')`
- `canCreate` - Alias para `requirePermission('crear')`
- `canEdit` - Alias para `requirePermission('editar')`
- `canDelete` - Alias para `requirePermission('borrar')`

## 🛠️ API Endpoints

### Gestión de Permisos

#### GET `/api/roles/permisos`
Obtener todos los permisos configurados

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rol_id": 1,
      "rol_codigo": "ADMIN",
      "rol_nombre": "Administrador",
      "permisos": {
        "ver": true,
        "crear": true,
        "editar": true,
        "borrar": true
      }
    }
  ]
}
```

#### GET `/api/roles/permisos/:rol_id`
Obtener permisos de un rol específico

#### PUT `/api/roles/permisos`
Actualizar permisos de un rol

**Request:**
```json
{
  "rol_id": 2,
  "permisos": {
    "ver": true,
    "crear": false,
    "editar": false,
    "borrar": false
  }
}
```

#### GET `/api/roles/con-permisos`
Obtener todos los roles con sus permisos asociados

## 🚀 Instalación y Configuración

### 1. Ejecutar la Migración
```bash
node scripts/setup-roles-permissions.js
```

### 2. Verificar Configuración
El script mostrará los permisos creados y endpoints disponibles.

### 3. Configurar Permisos Iniciales
Los permisos por defecto se crean automáticamente:
- **ADMIN**: Todos los permisos (ver, crear, editar, borrar)
- **Otros roles**: Solo permiso de ver

## 📝 Ejemplos de Uso

### Proteger Rutas Existentes
```javascript
// En tus archivos de rutas
const { authenticateToken } = require('../middleware/auth');
const { canView, canCreate, canEdit, canDelete } = require('../middleware/permissions');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de lectura
router.get('/recursos', canView, controller.getAll);

// Rutas de creación
router.post('/recursos', canCreate, controller.create);

// Rutas de edición
router.put('/recursos/:id', canEdit, controller.update);

// Rutas de eliminación
router.delete('/recursos/:id', canDelete, controller.delete);
```

### Middleware Condicional
```javascript
const { conditionalPermission } = require('../middleware/permissions');

// Aplicar permisos solo si el usuario no es admin
const isNotAdmin = (req) => req.user.rol_codigo !== 'ADMIN';
router.get('/recursos', conditionalPermission(isNotAdmin, canView), controller.getAll);
```

## 🔧 Consideraciones Importantes

1. **Orden de Middleware**: El middleware de autenticación (`authenticateToken`) debe ir antes que los middleware de permisos.

2. **Permisos por Defecto**: Todos los roles tienen permiso de `ver` por defecto.

3. **Administradores**: Los usuarios con rol `ADMIN` pueden modificar permisos a través de los endpoints de roles.

4. **Base de Datos Legacy**: La implementación es compatible con la estructura existente de usuarios y roles.

5. **Error Handling**: Los middleware de permisos devuelven respuestas consistentes con formato `{success: false, message: "..."} `.

## 🧪 Pruebas

### Probar Endpoints
```bash
# Obtener todos los permisos (requiere token de admin)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/roles/permisos

# Actualizar permisos (requiere token de admin)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"rol_id": 2, "permisos": {"ver": true, "crear": true, "editar": false, "borrar": false}}' \
  http://localhost:3000/api/roles/permisos
```

### Verificar Permisos en Rutas Protegidas
```bash
# Intentar acceder sin permisos de crear
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_sin_permiso_crear>" \
  -d '{"nombre": "test"}' \
  http://localhost:3000/api/becarios/registro
```

## 🔄 Integración con Frontend

El frontend puede consumir estos endpoints para:
1. Mostrar/ocultar botones según permisos del usuario
2. Validar acciones antes de enviarlas al backend
3. Crear una interfaz de administración de permisos

Ejemplo de integración:
```javascript
// Obtener permisos del usuario actual
const response = await fetch('/api/roles/permisos/' + user.rol_id, {
  headers: { 'Authorization': 'Bearer ' + token }
});
const { data } = await response.json();

// Usar permisos en la UI
setUserPermissions(data.permisos);
```

## 📈 Monitoreo y Logs

Los middleware de permisos incluyen logging de errores:
- Errores de base de datos se registran en `console.error`
- Respuestas de error incluyen mensajes descriptivos
- Se mantiene consistencia con el formato de respuesta existente

## 🛡️ Seguridad

1. **Validación de Entrada**: Todos los datos de entrada son validados antes de procesar
2. **Transacciones DB**: Las operaciones de actualización usan transacciones
3. **Sanitización**: Los valores booleanos son convertidos explícitamente
4. **Autenticación Requerida**: Todas las rutas de permisos requieren autenticación
