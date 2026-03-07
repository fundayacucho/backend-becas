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

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/recupera_clave', recupera_clave);
router.get('/roles', getRoles);

// Protected routes with permissions
router.get('/getUsuarios', authenticateToken, requireRoleOrAdmin('SUPERVISOR', 'ANALISTA'), canView, getUsuarios);
router.put('/users/:id', authenticateToken, requireAdmin, canEdit, updateUsuarioRol);
router.post('/deleteUsuario', authenticateToken, requireAdmin, canDelete, deleteUsuario);

// Admin user registration route
router.post('/register_admin', authenticateToken, requireAdmin, canCreate, register_admin);

// Tipos de Registro routes
router.get('/tipos-registro', getTiposRegistro);
router.put('/tipos-registro/:id', authenticateToken, requireAdmin, updateTipoRegistro);


module.exports = router;
