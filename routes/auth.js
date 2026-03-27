const express = require('express');
const { register, login, recupera_clave, getUsuarios, deleteUsuario, getRoles, updateUsuarioRol, register_admin } = require('../controllers/authController');

const { getTiposRegistro, updateTipoRegistro } = require('../controllers/configController');

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { canView, canCreate, canEdit, canDelete } = require('../middleware/permissions');
const router = express.Router();

// Middleware personalizado para permitir acceso a roles específicos
const requireRoleOrAdmin = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol_codigo) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no autenticado o sin rol asignado'
      });
    }

    // Permitir administradores o roles específicos
    if (req.user.rol_codigo === 'ADMIN' || allowedRoles.includes(req.user.rol_codigo)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para esta acción'
    });
  };
};

// Debug temporal: ver qué rol tiene el token actual
router.get('/me', authenticateToken, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, id_rol: req.user.id_rol, rol_codigo: req.user.rol_codigo });
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/recupera_clave', recupera_clave);
router.get('/roles', getRoles);

// Protected routes with permissions
router.get('/getUsuarios', authenticateToken, requireRoleOrAdmin('SUPERVISOR', 'ANALISTA', 'ADMIN_EXT_VEN'), canView, getUsuarios);
router.put('/users/:id', authenticateToken, requireRoleOrAdmin('SUPERVISOR', 'ANALISTA', 'ADMIN_EXT_VEN'), canEdit, updateUsuarioRol);
router.post('/deleteUsuario', authenticateToken, requireRoleOrAdmin('SUPERVISOR', 'ANALISTA', 'ADMIN_EXT_VEN'), canDelete, deleteUsuario);

// Admin user registration route (ADMIN pleno + ADMIN_EXT_VEN con restricción de rol)
router.post('/register_admin', authenticateToken, requireRoleOrAdmin('ADMIN_EXT_VEN', 'ANALISTA'), canCreate, register_admin);

// Tipos de Registro routes
router.get('/tipos-registro', getTiposRegistro);
router.put('/tipos-registro/:id', authenticateToken, requireRoleOrAdmin('SUPERVISOR', 'ADMIN_EXT_VEN'), updateTipoRegistro);


module.exports = router;
