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
    return res.json(data || []);
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

const XLSX = require('xlsx');

const EXPORT_COLUMNS = [
  { key: 'nombres_apellidos',           header: 'Nombre Completo' },
  { key: 'cedula',                      header: 'Cedula' },
  { key: 'pasaporte',                   header: 'Pasaporte' },
  { key: 'correo',                      header: 'Correo' },
  { key: 'telefono_principal',          header: 'Telefono' },
  { key: 'pais_origen',                 header: 'Pais Origen' },
  { key: 'estado',                      header: 'Estado' },
  { key: 'municipio',                   header: 'Municipio' },
  { key: 'parroquia',                   header: 'Parroquia' },
  { key: 'institucion',                 header: 'Institucion' },
  { key: 'programa_estudio',            header: 'Carrera' },
  { key: 'anio_ingreso',                header: 'Anio Ingreso' },
  { key: 'semestre_actual',             header: 'Semestre Actual' },
  { key: 'estatus_academico',           header: 'Estatus Academico' },
  { key: 'status_visa',                 header: 'Status Visa' },
  { key: 'fecha_vencimiento_visa',      header: 'Fecha Vencimiento Visa' },
  { key: 'estatus_pasaporte',           header: 'Estatus Pasaporte' },
  { key: 'fecha_vencimiento_pasaporte', header: 'Fecha Vencimiento Pasaporte' },
  { key: 'observaciones',              header: 'Observaciones' },
];

const IMPORT_MAP = {
  'nombre completo':              'nombresApellidos',
  'cedula':                       'cedula',
  'pasaporte':                    'pasaporte',
  'correo':                       'correo',
  'telefono':                     'telefonoPrincipal',
  'pais origen':                  'pais_origen',
  'estado':                       'codigoestado',
  'estado (opcional)':            'codigoestado',
  'municipio':                    'codigomunicipio',
  'municipio (opcional)':         'codigomunicipio',
  'parroquia':                    'codigoparroquia',
  'parroquia (opcional)':         'codigoparroquia',
  'institucion':                  'institucion',
  'carrera':                      'programaEstudio',
  'anio ingreso':                 'anioIngreso',
  'semestre actual':              'semestreActual',
  'estatus academico':            'estadoEstudio',
  'status visa':                  'statusVisa',
  'fecha vencimiento visa':       'fechaVencimientoVisa',
  'estatus pasaporte':            'estatusPasaporte',
  'fecha vencimiento pasaporte':  'fechaVencimientoPasaporte',
  'observaciones':                'observaciones',
};

const exportarExtranjeros = async (req, res, next) => {
  try {
    const data = await extranjerosService.listarExtranjeros({});
    const rows = (data || []).map(r =>
      Object.fromEntries(EXPORT_COLUMNS.map(c => [c.header, r[c.key] ?? '']))
    );
    const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS.map(c => c.header) });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extranjeros');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="extranjeros_venezuela_${Date.now()}.xlsx"`);
    return res.send(buf);
  } catch (error) {
    return next(error);
  }
};

const importarExtranjeros = async (req, res, next) => {
  try {
    console.log('[importar] file recibido:', req.file?.originalname, req.file?.size, 'bytes');
    if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rawRows.length) return res.json({ total: 0, insertados: 0, actualizados: 0, errores: [] });

    const results = { total: rawRows.length, insertados: 0, actualizados: 0, errores: [] };

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const body = {};
      for (const [col, field] of Object.entries(IMPORT_MAP)) {
        const val = raw[Object.keys(raw).find(k => k.toLowerCase().trim() === col)] ?? '';
        if (val !== '') body[field] = String(val).trim();
      }
      if (!body.nombresApellidos) {
        results.errores.push({ fila: i + 2, error: 'Nombre completo requerido' });
        continue;
      }
      if (!body.cedula && !body.pasaporte) {
        results.errores.push({ fila: i + 2, error: 'Se requiere cédula o pasaporte para identificar al becario' });
        continue;
      }
      console.log(`[importar] fila ${i + 2}: cedula=${body.cedula} pasaporte=${body.pasaporte} nombre=${body.nombresApellidos}`);
      try {
        const r = await extranjerosService.registrarExtranjero(body, {});
        if (r.isUpdate) results.actualizados++; else results.insertados++;
      } catch (err) {
        results.errores.push({ fila: i + 2, error: err.message || 'Error desconocido' });
      }
    }

    return res.json(results);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listarExtranjeros,
  detalleExtranjero,
  registrarExtranjero,
  actualizarExtranjero,
  eliminarExtranjero,
  exportarExtranjeros,
  importarExtranjeros,
};
