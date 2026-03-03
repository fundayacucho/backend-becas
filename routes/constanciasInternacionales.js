const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  getPlaceholders,
  getTemplate,
  updateTemplate,
  previewConstancia,
  generateConstancia
} = require('../controllers/constanciasInternacionalesController');

const router = express.Router();

router.use(authenticateToken, authorize('ANALISTA', 'SUPERVISOR', 'ADMIN'));

router.get('/placeholders', getPlaceholders);
router.get('/template', getTemplate);
router.put('/template', updateTemplate);
router.post('/preview', previewConstancia);
router.post('/generate', generateConstancia);

module.exports = router;
