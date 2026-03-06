# Guía de Implementación del Backend para Gestión de Roles

Esta guía detalla los pasos necesarios para implementar la persistencia de permisos en el backend, enlazando la vista `Roles.jsx` con tu base de datos y API.

## 1. Modificación de la Base de Datos

Necesitas una tabla o estructura donde guardar los permisos según cada rol de administrador. Si ya tienes una tabla `Roles`, puedes crear una tabla de permisos asociada o agregar columnas booleanas.

**Ejemplo de tabla (SQL Server / PostgreSQL):**
```sql
CREATE TABLE PermisosRol (
    id INT PRIMARY KEY IDENTITY(1,1),
    rol_id INT NOT NULL, -- FK a la tabla Roles (Admin, Supervisor, Analista)
    ver BIT DEFAULT 1,
    crear BIT DEFAULT 0,
    editar BIT DEFAULT 0,
    borrar BIT DEFAULT 0,
    CONSTRAINT FK_PermisosRol_Roles FOREIGN KEY (rol_id) REFERENCES Roles(id)
);
```

## 2. Creación del Modelo (Backend)

Crea un modelo en tu ORM (Sequelize, Prisma, Mongoose, etc.) que represente estos permisos.

**Ejemplo Sequelize (Node.js):**
```javascript
const PermisosRol = sequelize.define('PermisosRol', {
  rol_id: { type: DataTypes.INTEGER, allowNull: false },
  ver: { type: DataTypes.BOOLEAN, defaultValue: true },
  crear: { type: DataTypes.BOOLEAN, defaultValue: false },
  editar: { type: DataTypes.BOOLEAN, defaultValue: false },
  borrar: { type: DataTypes.BOOLEAN, defaultValue: false },
});
```

## 3. Creación de Controladores (Controllers)

Necesitarás dos endpoints principales: uno para **obtener** los permisos actuales y otro para **actualizarlos**.

**`rolesController.js`:**
```javascript
// Obtener permisos
exports.getPermisos = async (req, res) => {
  try {
    // Aquí consultas a la DB y devuelves un objeto estructurado
    // similar a: { admin: { crear: true... }, supervisor: {...} }
    const permisos = await PermisosRol.findAll(); 
    return res.status(200).json(permisos);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Actualizar permisos
exports.updatePermisosRol = async (req, res) => {
  try {
    const { rol_id, permisos } = req.body; 
    // validaciones...
    await PermisosRol.update(permisos, { where: { rol_id } });
    return res.status(200).json({ message: 'Permisos actualizados' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar permisos' });
  }
};

// Crear nuevo rol
exports.createRole = async (req, res) => {
  try {
    const { rol_nombre, description, color, permisos } = req.body;
    
    // 1. Crear el nuevo rol en la tabla cat_roles (o equivalente)
    const nuevoRol = await Rol.create({ rol_nombre, description, color });
    
    // 2. Crear los permisos por defecto para este nuevo rol
    await PermisosRol.create({
      rol_id: nuevoRol.id,
      ...permisos
    });
    
    return res.status(201).json({ message: 'Rol creado exitosamente', data: nuevoRol });
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear el rol' });
  }
};
```

## 4. Rutas de la API (Routes)

Definir las rutas expuestas para el frontend.

**`routes/rolesRoutes.js`:**
```javascript
const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const { verifyAdmin, checkPermissions } = require('../middlewares/auth');

// GET: /api/roles/permisos
router.get('/permisos', verifyAdmin, rolesController.getPermisos);

// PUT: /api/roles/permisos
// Importante: Solo un SuperAdmin debería tener permiso de cambiar permisos!
router.put('/permisos', verifyAdmin, rolesController.updatePermisosRol);

// POST: /api/roles/crear
router.post('/crear', verifyAdmin, rolesController.createRole);

module.exports = router;
```

## 5. Implementación del Middleware de Autorización

Una vez guardados los permisos, el objetivo real es **bloquear o permitir** acciones en TODO tu backend basándote en ellos.

Crea un middleware que intercepte peticiones:

**`middlewares/auth.js`** o **`middlewares/permissions.js`**:
```javascript
exports.requirePermission = (requiredAction) => {
  return async (req, res, next) => {
    try {
      const userRoleId = req.user.rol_id; // Asumiendo que req.user lo pone el JWT
      
      const permisos = await PermisosRol.findOne({ where: { rol_id: userRoleId } });

      if (!permisos || permisos[requiredAction] !== true) {
        return res.status(403).json({ message: `No tienes permiso para ${requiredAction} este recurso.` });
      }

      next(); // Permiso concedido, continuar
    } catch (error) {
      return res.status(500).json({ message: "Error validando permisos." });
    }
  }
};
```

## 6. Proteger las Rutas de la API

Aplica el middleware de permisos en las rutas correspondientes:

```javascript
const { requirePermission } = require('../middlewares/permissions');

// Ejemplo de recursos: 
router.post('/usuarios', requirePermission('crear'), userController.createUser);
router.put('/usuarios/:id', requirePermission('editar'), userController.editUser);
router.delete('/usuarios/:id', requirePermission('borrar'), userController.deleteUser);
router.get('/usuarios', requirePermission('ver'), userController.getUsers);
```

## 7. Conexión desde el Frontend

En tu archivo `Roles.jsx`, modifica la función `handleSave` y el `useEffect` de carga inicial para hacer llamadas con `axios` o `fetch` hacia las rutas `/api/roles/permisos` que acabas de crear.
