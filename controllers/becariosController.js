const fs = require('fs');
const path = require('path');
const {
  ensureDirectories,
  cleanupUploadedTempFiles,
  publicPathToDiskPath,
  getManagedDirs
} = require('../utils/fileManager');
const { formatBecarioLegacy } = require('./formatters/becarioFormatter');
const becariosService = require('../services/becariosService');
const catalogosService = require('../services/catalogosService');

const DIRS = getManagedDirs();

const parseFilters = (req) => {
  const params = new URLSearchParams(req._parsedUrl?.query || '');
  return {
    estado: params.get('estado') || '',
    municipio: params.get('municipio') || '',
    parroquia: params.get('parroquia') || ''
  };
};

const parseIdFromQuery = (req) => {
  const params = new URLSearchParams(req._parsedUrl?.query || '');
  return params.get('id');
};

const parseCodigoFromQuery = (req) => {
  const params = new URLSearchParams(req._parsedUrl?.query || '');
  return params.get('codigo') || '';
};

const parseEstadoFromQuery = (req) => {
  const params = new URLSearchParams(req._parsedUrl?.query || '');
  return params.get('estado') || '';
};

const registroBecarios = async (req, res, next) => {
  ensureDirectories();
  try {
    const result = await becariosService.registrarOActualizarBecarioVenezuela(req.body, req.files);
    return res.status(result.isUpdate ? 200 : 201).json({
      message: result.isUpdate ? 'Becario actualizado exitosamente' : 'Becario registrado exitosamente',
      becario: formatBecarioLegacy(result.becario)
    });
  } catch (error) {
    cleanupUploadedTempFiles(req.files);
    return next(error);
  }
};

const saveBecarioEsteriol = async (req, res, next) => {
  ensureDirectories();
  try {
    const result = await becariosService.registrarOActualizarBecarioExterior(req.body, req.files);
    return res.status(result.isUpdate ? 200 : 201).json({
      message: result.isUpdate ? 'Becario actualizado exitosamente' : 'Becario registrado exitosamente',
      becario: formatBecarioLegacy(result.becario)
    });
  } catch (error) {
    cleanupUploadedTempFiles(req.files);
    return next(error);
  }
};

const register_egresado = async (req, res, next) => {
  try {
    if (!req.body.fecha_nacimiento) {
      return res.status(400).json({ message: 'La fecha de nacimiento es obligatoria' });
    }

    const becario = await becariosService.registrarEgresado(req.body);
    return res.status(201).json({
      message: 'Becario registrado exitosamente',
      becario
    });
  } catch (error) {
    return next(error);
  }
};

const data_egresado = async (req, res, next) => {
  try {
    const id = parseIdFromQuery(req);
    if (!id) return res.status(400).json({ message: 'id requerido' });

    const data = await becariosService.obtenerDetalleEgresado(id);
    if (!data) return res.status(404).json({ message: 'id no encontrado' });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const get_egresado = async (req, res, next) => {
  try {
    const data = await becariosService.obtenerEgresados(parseFilters(req));
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron becarios con los criterios especificados' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const data_becario = async (req, res, next) => {
  try {
    const id = parseIdFromQuery(req);
    if (!id) return res.status(400).json({ message: 'id requerido' });

    const data = await becariosService.obtenerDetalleBecario(id);
    if (!data) return res.status(404).json({ message: 'id no encontrado' });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const get_becario_esteriol = async (req, res, next) => {
  try {
    const id = parseIdFromQuery(req);
    if (!id) return res.status(400).json({ message: 'id requerido' });

    const data = await becariosService.obtenerDetalleBecarioExterior(id);
    if (!data) return res.status(404).json({ message: 'id no encontrado' });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const becarios = async (req, res, next) => {
  try {
    const data = await becariosService.obtenerBecariosVenezuela(parseFilters(req));
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron becarios con los criterios especificados' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const get_becarioesterior = async (req, res, next) => {
  try {
    const data = await becariosService.obtenerBecariosExterior(parseFilters(req));
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron becarios del exterior' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const uner = async (req, res, next) => {
  try {
    const estado = parseEstadoFromQuery(req);
    const data = await catalogosService.obtenerUner(estado);
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron datos de UNER' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const tbl_pais = async (req, res, next) => {
  try {
    const data = await catalogosService.obtenerPaises();
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron datos de PAIS' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const get_carreras = async (req, res, next) => {
  try {
    const codigo = parseCodigoFromQuery(req);
    if (!codigo) return res.status(400).json({ message: 'Codigo es requerido' });

    const data = await catalogosService.obtenerCarreras(codigo);
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontraron carreras con el codigo especificado' });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const anexo_cedulas = async (req, res) => {
  const url = req.query.url;
  const filePath = publicPathToDiskPath(url);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }

  return res.sendFile(path.resolve(filePath));
};

const anexo_constancia = async (req, res) => {
  const url = req.query.url;
  const filePath = publicPathToDiskPath(url);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }

  return res.sendFile(path.resolve(filePath));
};

const servirArchivo = (req, res) => {
  const { tipo, archivo } = req.params;
  let filePath;

  if (tipo === 'foto') filePath = path.join(DIRS.fotos, archivo);
  else if (tipo === 'anexo') filePath = path.join(DIRS.anexos, archivo);
  else return res.status(400).json({ message: 'Tipo de archivo no valido' });

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }

  return res.sendFile(path.resolve(filePath));
};

const delete_becario_exterior = async (req, res, next) => {
  try {
    const { id } = req.body;
    const data = await becariosService.eliminarBecarioExterior(id);
    if (!data) return res.status(404).json({ message: 'Becario no encontrado' });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registroBecarios,
  servirArchivo,
  register_egresado,
  data_egresado,
  data_becario,
  becarios,
  get_becarioesterior,
  uner,
  tbl_pais,
  get_carreras,
  anexo_cedulas,
  anexo_constancia,
  saveBecarioEsteriol,
  get_becario_esteriol,
  delete_becario_exterior,
  get_egresado
};
