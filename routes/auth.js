const express = require('express');
const { register, login,recupera_clave ,getUsuarios ,deleteUsuario } = require('../controllers/authController');
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/recupera_clave', recupera_clave);
router.get('/getUsuarios', getUsuarios);
router.post('/deleteUsuario', deleteUsuario);
module.exports = router;