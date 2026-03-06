// routes/becarios.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { authenticateToken } = require('../middleware/auth');
const { canView, canCreate, canEdit, canDelete } = require('../middleware/permissions');
const {
  registroBecarios,
  register_egresado,
  data_egresado,
  data_becario,
  get_egresado,
  get_becario_esteriol,
  becarios,
  get_becarioesterior,
  uner,
  get_carreras,
  anexo_cedulas,
  anexo_constancia,
  saveBecarioEsteriol,
  tbl_pais,
  delete_becario_exterior,
  upsert_becario_por_tipo
} = require('../controllers/becariosController');

// Apply authentication to all routes
router.use(authenticateToken);

// Rutas para ver datos (requieren permiso de ver)
router.get('/anexo_cedula', canView, anexo_cedulas);
router.get('/anexo_constancia', canView, anexo_constancia);
router.get('/get_egresado', canView, data_egresado);
router.get('/egresado', canView, get_egresado);
router.get('/get_becario', canView, data_becario);
router.get('/get_becario_esteriol', canView, get_becario_esteriol);
router.get('/becarios', canView, becarios);
router.get('/get_becarioesterior', canView, get_becarioesterior);
router.get('/uner', canView, uner);
router.get('/tbl_pais', canView, tbl_pais);
router.get('/carreras', canView, get_carreras);

// Rutas para crear/registro (requieren permiso de crear)
router.post('/registro', canCreate, upload.fields([
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoResidencia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 },
  { name: 'constancia_semestre', maxCount: 1 },
]), registroBecarios);

router.post('/registroBecarioExteriol', canCreate, upload.fields([
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoResidencia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 },
  { name: 'constancia_semestre', maxCount: 1 },
]), saveBecarioEsteriol);

router.post('/upsert-por-tipo', canCreate, upload.fields([
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoResidencia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'anexoPasaporte', maxCount: 1 },
  { name: 'anexoVisa', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 },
  { name: 'constancia_semestre', maxCount: 1 },
]), upsert_becario_por_tipo);

router.post('/register', canCreate, register_egresado);

// Rutas para editar/actualizar (requieren permiso de editar)
router.put('/upsert-por-tipo/:id', canEdit, upload.fields([
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoResidencia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'anexoPasaporte', maxCount: 1 },
  { name: 'anexoVisa', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 },
  { name: 'constancia_semestre', maxCount: 1 },
]), upsert_becario_por_tipo);

// Rutas para eliminar (requieren permiso de borrar)
router.post('/delete_becario', canDelete, delete_becario_exterior);



module.exports = router;
