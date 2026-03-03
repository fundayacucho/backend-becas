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

const listExtranjeros = async (req, res, next) => {
  try {
    const filters = {
      estado: req.query?.estado || '',
      municipio: req.query?.municipio || '',
      parroquia: req.query?.parroquia || '',
      pais_origen: req.query?.pais_origen || '',
      estatus_academico: req.query?.estatus_academico || '',
      status_visa: req.query?.status_visa || ''
    };
    const becarios = await constanciasService.listExtranjerosForConstancia(filters);
    return res.json({ becarios });
  } catch (error) {
    return next(error);
  }
};

const getDataFromBecario = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'id requerido' });
    const payload = await constanciasService.getConstanciaDataFromBecario(id);
    return res.json(payload);
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

    const becarioId = req.body?.becario_id || req.query?.becario_id || null;
    const becarioData = becarioId
      ? await constanciasService.getConstanciaDataFromBecario(becarioId)
      : { data: {} };
    const data = { ...(becarioData.data || {}), ...(req.body?.data || {}) };
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

    const becarioId = req.body?.becario_id || req.query?.becario_id || null;
    const becarioData = becarioId
      ? await constanciasService.getConstanciaDataFromBecario(becarioId)
      : { data: {} };
    const data = { ...(becarioData.data || {}), ...(req.body?.data || {}) };
    const options = {
      template: req.body?.template || null,
      filename: req.body?.filename || null
    };

    const format = String(req.query?.format || req.body?.format || 'html').toLowerCase();

    if (format === 'pdf') {
      const pdfPayload = await constanciasService.generateConstanciaPdf(data, options);

      if (req.query?.download === '1') {
        res.setHeader('Content-Type', pdfPayload.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${pdfPayload.filename}"`);
        return res.status(200).send(pdfPayload.buffer);
      }

      return res.json({
        filename: pdfPayload.filename,
        mimeType: pdfPayload.mimeType,
        base64: pdfPayload.buffer.toString('base64')
      });
    }

    const htmlPayload = constanciasService.generateConstancia(data, options);

    if (req.query?.download === '1') {
      res.setHeader('Content-Type', htmlPayload.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${htmlPayload.filename}"`);
      return res.status(200).send(htmlPayload.html);
    }

    return res.json(htmlPayload);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listExtranjeros,
  getDataFromBecario,
  getPlaceholders,
  getTemplate,
  updateTemplate,
  previewConstancia,
  generateConstancia
};
