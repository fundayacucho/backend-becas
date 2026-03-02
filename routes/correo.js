

// controlador de correo que resivira un correo del usuario  y para recupera la clave  y modifica la que esta en la base de datos y enviale al usuario la nueva clave 
const express = require('express');
const router = express.Router();
const { recupera_clave } = require('../controllers/correoController');
router.post('/recuperaclave', recupera_clave);



module.exports = router;


