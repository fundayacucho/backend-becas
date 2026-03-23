

// controlador de correo que resivira un correo del usuario  y para recupera la clave  y modifica la que esta en la base de datos y enviale al usuario la nueva clave 
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { recupera_clave, resetPasswordAdmin } = require('../controllers/correoController');
router.post('/recuperaclave', recupera_clave);
router.post('/reset-password-admin', authenticateToken, authorize('ADMIN', 'SUPERVISOR', 'ADMIN_EXT_VEN'), resetPasswordAdmin);



module.exports = router;


