const { ensureDirectories, cleanupUploadedTempFiles } = require('../utils/fileManager');
const { formatBecarioLegacy } = require('./formatters/becarioFormatter');
const extranjerosService = require('../services/extranjerosService');

const parseFilters = (req) => {
  const params = new URLSearchParams(req._parsedUrl?.query || '');
  return {
    estado: params.get('estado') || '',
    municipio: params.get('municipio') || '',
    parroquia: params.get('parroquia') || '',
    pais_origen: params.get('pais_origen') || '',
    estatus_academico: params.get('estatus_academico') || '',
    status_visa: params.get('status_visa') || ''
  };
};

const parseIdFromQuery = (req) => {
  const params = new URLSearchParams(req._parsedUrl?.query || '');
  return params.get('id');
};

const listarExtranjeros = async (req, res, next) => {
  try {
    const data = await extranjerosService.listarExtranjeros(parseFilters(req));
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron becarios extranjeros' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const detalleExtranjero = async (req, res, next) => {
  try {
    const id = parseIdFromQuery(req);
    if (!id) return res.status(400).json({ message: 'id requerido' });

    const data = await extranjerosService.detalleExtranjero(id);
    if (!data) return res.status(404).json({ message: 'id no encontrado' });

    return res.json(formatBecarioLegacy(data));
  } catch (error) {
    return next(error);
  }
};

const registrarExtranjero = async (req, res, next) => {
  ensureDirectories();
  try {
    const result = await extranjerosService.registrarExtranjero(req.body, req.files);
    return res.status(result.isUpdate ? 200 : 201).json({
      message: result.isUpdate ? 'Becario extranjero actualizado exitosamente' : 'Becario extranjero registrado exitosamente',
      becario: formatBecarioLegacy(result.becario)
    });
  } catch (error) {
    cleanupUploadedTempFiles(req.files);
    return next(error);
  }
};

const actualizarExtranjero = async (req, res, next) => {
  ensureDirectories();
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id requerido' });

    const result = await extranjerosService.actualizarExtranjero(id, req.body, req.files);
    return res.status(200).json({
      message: 'Becario extranjero actualizado exitosamente',
      becario: formatBecarioLegacy(result.becario)
    });
  } catch (error) {
    cleanupUploadedTempFiles(req.files);
    return next(error);
  }
};

const eliminarExtranjero = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id requerido' });

    const data = await extranjerosService.eliminarExtranjero(id);
    if (!data) return res.status(404).json({ message: 'Becario extranjero no encontrado' });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listarExtranjeros,
  detalleExtranjero,
  registrarExtranjero,
  actualizarExtranjero,
  eliminarExtranjero
};
