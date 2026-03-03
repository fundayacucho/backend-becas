const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const {
  listarExtranjeros,
  detalleExtranjero,
  registrarExtranjero,
  actualizarExtranjero,
  eliminarExtranjero
} = require('../controllers/extranjerosVenezuelaController');

const extranjerosUploadFields = [
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'anexoPasaporte', maxCount: 1 },
  { name: 'anexoVisa', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 }
];

router.get('/listar', listarExtranjeros);
router.get('/detalle', detalleExtranjero);
router.post('/registro', upload.fields(extranjerosUploadFields), registrarExtranjero);
router.put('/actualizar/:id', upload.fields(extranjerosUploadFields), actualizarExtranjero);
router.delete('/eliminar/:id', eliminarExtranjero);

module.exports = router;
