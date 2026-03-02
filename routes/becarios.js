// routes/becarios.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
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
  delete_becario_exterior
} = require('../controllers/becariosController');

// Ruta para registro con upload de archivos
router.post('/registro', upload.fields([
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoResidencia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 },
  { name: 'constancia_semestre', maxCount: 1 },
]), registroBecarios);

router.post('/registroBecarioExteriol', upload.fields([
  { name: 'anexoCedula', maxCount: 1 },
  { name: 'anexoConstancia', maxCount: 1 },
  { name: 'anexoResidencia', maxCount: 1 },
  { name: 'anexoFoto', maxCount: 1 },
  { name: 'Contrato_convenio', maxCount: 1 },
  { name: 'constancia_semestre', maxCount: 1 },
]), saveBecarioEsteriol);


// la ru/home/fundaya/becarios/servidor_becarios/uploads/becarios/anexos/19969775_cedula.jpg
router.get('/anexo_cedula' ,  anexo_cedulas);
router.get('/anexo_constancia' ,  anexo_constancia);

router.post('/register', register_egresado);
router.get('/get_egresado', data_egresado);
router.get('/egresado', get_egresado);
router.get('/get_becario', data_becario);
router.get('/get_becario_esteriol', get_becario_esteriol);
router.get('/becarios', becarios);
router.get('/get_becarioesterior', get_becarioesterior);
router.get('/uner', uner);
router.get('/tbl_pais', tbl_pais);

router.get('/carreras', get_carreras);

// delete_becario metoso post
router.post('/delete_becario',  delete_becario_exterior);



module.exports = router;