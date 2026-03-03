const constanciasService = require('../services/constanciasInternacionalesService');

const ROLES_CONSTANCIA = ['ANALISTA', 'SUPERVISOR', 'ADMIN'];
const ROLES_TEMPLATE_EDIT = ['SUPERVISOR', 'ADMIN'];

function hasRole(req, allowed = []) {
  return !!req.user?.rol_codigo && allowed.includes(req.user.rol_codigo);
}

const getPlaceholders = async (req, res, next) => {
  try {
    return res.json({ placeholders: constanciasService.PLACEHOLDERS });
  } catch (error) {
    return next(error);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const template = constanciasService.getTemplate();
    return res.json({ template });
  } catch (error) {
    return next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    if (!hasRole(req, ROLES_TEMPLATE_EDIT)) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar la plantilla' });
    }

    const template = constanciasService.saveTemplate(req.body?.template || req.body || {});
    return res.json({ message: 'Plantilla actualizada exitosamente', template });
  } catch (error) {
    return next(error);
  }
};

const previewConstancia = async (req, res, next) => {
  try {
    if (!hasRole(req, ROLES_CONSTANCIA)) {
      return res.status(403).json({ message: 'No tienes permisos para previsualizar constancias' });
    }

    const data = req.body?.data || {};
    const customTemplate = req.body?.template || null;
    const payload = constanciasService.previewConstancia(data, customTemplate);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const generateConstancia = async (req, res, next) => {
  try {
    if (!hasRole(req, ROLES_CONSTANCIA)) {
      return res.status(403).json({ message: 'No tienes permisos para generar constancias' });
    }

    const data = req.body?.data || {};
    const options = {
      template: req.body?.template || null,
      filename: req.body?.filename || null
    };

    const payload = constanciasService.generateConstancia(data, options);

    if (req.query?.download === '1') {
      res.setHeader('Content-Type', payload.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
      return res.status(200).send(payload.html);
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPlaceholders,
  getTemplate,
  updateTemplate,
  previewConstancia,
  generateConstancia
};
