const express = require('express');
const { getEstado ,getMunicipio ,getParroquia } = require('../controllers/estadosController');
const router = express.Router();

router.get('/estado', getEstado);
router.get('/municipio', getMunicipio);
router.get('/parroquia', getParroquia);

module.exports = router;