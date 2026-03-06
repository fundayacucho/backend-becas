const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Middleware para todas las rutas de roles
router.use(authenticateToken);

// GET: /api/roles/permisos - Obtener todos los permisos
router.get('/permisos', requireAdmin, rolesController.getPermisos);

// GET: /api/roles/permisos/:rol_id - Obtener permisos de un rol específico
router.get('/permisos/:rol_id', requireAdmin, rolesController.getPermisosPorRol);

// PUT: /api/roles/permisos - Actualizar permisos de un rol
// Importante: Solo un administrador debería tener permiso de cambiar permisos!
router.put('/permisos', requireAdmin, rolesController.updatePermisos);

// GET: /api/roles/con-permisos - Obtener todos los roles con sus permisos
router.get('/con-permisos', requireAdmin, rolesController.getRolesConPermisos);

// POST: /api/roles/crear - Crear nuevo rol
router.post('/crear', requireAdmin, rolesController.createRole);

// PUT: /api/roles/:id - Actualizar rol existente
router.put('/:id', requireAdmin, rolesController.updateRole);

// DELETE: /api/roles/:id - Eliminar rol
router.delete('/:id', requireAdmin, rolesController.deleteRole);

module.exports = router;
