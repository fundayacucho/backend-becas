const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/multerConfig');
const { authenticateToken } = require('../middleware/auth');
const { canView, canCreate, canEdit, canDelete } = require('../middleware/permissions');
const {
  listarExtranjeros,
  detalleExtranjero,
  registrarExtranjero,
  actualizarExtranjero,
  eliminarExtranjero,
  exportarExtranjeros,
  importarExtranjeros,
} = require('../controllers/extranjerosVenezuelaController');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /xlsx|xls|csv/.test(file.originalname.toLowerCase());
    cb(ok ? null : new Error('Solo se permiten archivos xlsx, xls o csv'), ok);
  }
});

const extranjerosUploadFields = [
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'anexoPasaporte', maxCount: 1 },
  { name: 'anexoVisa', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 }
];

router.get('/listar', canView, listarExtranjeros);
router.get('/exportar', canView, exportarExtranjeros);
router.post('/importar', canCreate, uploadMemory.single('archivo'), importarExtranjeros);
router.get('/detalle', canView, detalleExtranjero);
router.post('/registro', canCreate, upload.fields(extranjerosUploadFields), registrarExtranjero);
router.put('/actualizar/:id', canEdit, upload.fields(extranjerosUploadFields), actualizarExtranjero);
router.delete('/eliminar/:id', canDelete, eliminarExtranjero);

module.exports = router;
