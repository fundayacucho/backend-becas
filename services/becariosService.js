const { Op } = require('sequelize');
const {
  sequelize,
  BecarioUnificado,
  EstudioBecario,
  DocumentoBecario
} = require('../models');
const { moveFileToFolder, getManagedDirs } = require('../utils/fileManager');

function buildGeoFilters({ estado = '', municipio = '', parroquia = '' }, params) {
  const conditions = [];
  if (estado) {
    params.push(estado);
    conditions.push(`b.estado = $${params.length}`);
  }
  if (municipio) {
    params.push(municipio);
    conditions.push(`b.municipio = $${params.length}`);
  }
  if (parroquia) {
    params.push(parroquia);
    conditions.push(`b.parroquia = $${params.length}`);
  }
  return conditions.length ? ` AND ${conditions.join(' AND ')}` : '';
}

function parseIntOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function extraerAnio(fechaIngreso) {
  if (!fechaIngreso) return null;
  const str = String(fechaIngreso);
  if (/^\d{4}$/.test(str)) return parseInt(str, 10);
  const match = str.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

function splitNombreCompleto(fullName) {
  const source = String(fullName || '').trim();
  if (!source) return { nombres: 'Sin Nombre', apellidos: 'Sin Apellido' };
  const parts = source.split(/\s+/);
  if (parts.length === 1) return { nombres: parts[0], apellidos: 'Sin Apellido' };
  if (parts.length === 2) return { nombres: parts[0], apellidos: parts[1] };
  const mid = Math.ceil(parts.length / 2);
  return {
    nombres: parts.slice(0, mid).join(' '),
    apellidos: parts.slice(mid).join(' ')
  };
}

async function upsertDocumento(idBecario, idTipoDocumento, rutaArchivo, transaction) {
  if (!rutaArchivo) return;
  const existing = await DocumentoBecario.findOne({
    where: { id_becario: idBecario, id_tipo_documento: idTipoDocumento },
    transaction
  });

  if (existing) {
    await existing.update({ ruta_archivo: rutaArchivo }, { transaction });
    return;
  }

  await DocumentoBecario.create(
    { id_becario: idBecario, id_tipo_documento: idTipoDocumento, ruta_archivo: rutaArchivo },
    { transaction }
  );
}

async function upsertEstudio(idBecario, payload, transaction) {
  const existing = await EstudioBecario.findOne({
    where: { id_becario: idBecario },
    order: [['createdAt', 'DESC']],
    transaction
  });

  if (existing) {
    await existing.update(payload, { transaction });
    return existing;
  }

  return EstudioBecario.create({ id_becario: idBecario, ...payload }, { transaction });
}

async function obtenerPorTipo(idTipo, filters) {
  const params = [idTipo];
  const geoFilter = buildGeoFilters(filters, params);

  const query = `
    SELECT
      b.id AS id_becario,
      b.id_usuario_legacy AS id_usuario,
      TRIM(CONCAT(COALESCE(b.nombres,''), ' ', COALESCE(b.apellidos,''))) AS nombres_apellidos,
      b.cedula,
      b.pasaporte,
      b.correo,
      b.telefono_principal,
      b.telefono_alternativo,
      b.estado AS codigoestado,
      b.municipio AS codigomunicipio,
      b.parroquia AS codigoparroquia,
      e.nombre AS estado,
      m.nombre AS municipio,
      p.nombre AS parroquia,
      COALESCE(s.institucion_nombre, CAST(s.id_institucion AS TEXT), '') AS institucion,
      COALESCE(s.carrera_nombre, CAST(s.id_carrera AS TEXT), '') AS programa_estudio,
      s.anio_ingreso,
      s.semestre_actual,
      b.latitud,
      b.longitud,
      b.latitud_pais,
      b.longitud_pais,
      b.nombre_representante,
      b.parentesco,
      b.pais_origen
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_institucion, id_carrera, institucion_nombre, carrera_nombre, anio_ingreso, semestre_actual
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE b.id_tipo_becario = $1
    ${geoFilter}
    ORDER BY b.id_usuario_legacy NULLS LAST, b.id
  `;

  return sequelize.query(query, { bind: params, type: sequelize.QueryTypes.SELECT });
}

async function obtenerBecariosVenezuela({ estado = '', municipio = '', parroquia = '' }) {
  return obtenerPorTipo(1, { estado, municipio, parroquia });
}

async function obtenerBecariosExterior({ estado = '', municipio = '', parroquia = '' }) {
  return obtenerPorTipo(2, { estado, municipio, parroquia });
}

async function obtenerEgresados({ estado = '', municipio = '', parroquia = '' }) {
  const params = [];
  const geoFilter = buildGeoFilters({ estado, municipio, parroquia }, params);

  const query = `
    SELECT
      b.id AS id_becario,
      b.id_usuario_legacy AS id_usuario,
      TRIM(CONCAT(COALESCE(b.nombres,''), ' ', COALESCE(b.apellidos,''))) AS nombre_completo,
      b.cedula,
      b.correo,
      b.telefono_principal AS telefono_celular,
      b.fecha_nacimiento,
      b.es_militar,
      b.pais_origen AS descripcion_becario,
      b.estado AS codigoestado,
      b.municipio AS codigomunicipio,
      b.parroquia AS codigoparroquia,
      e.nombre AS estado,
      m.nombre AS municipio,
      p.nombre AS parroquia,
      b.latitud,
      b.longitud,
      b.direccion,
      s.fecha_egreso,
      s.tipo_beca,
      s.estado_estudio AS titularidad,
      s.idiomas,
      s.ocupacion_actual,
      COALESCE(s.institucion_nombre, CAST(s.id_institucion AS TEXT), '') AS universidad,
      COALESCE(s.carrera_nombre, CAST(s.id_carrera AS TEXT), '') AS carrera_cursada,
      s.trabajando
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_estatus, id_institucion, institucion_nombre, id_carrera, carrera_nombre,
        fecha_egreso, tipo_beca, estado_estudio, idiomas, ocupacion_actual, trabajando
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE s.id_estatus = 2
    ${geoFilter}
    ORDER BY b.id_usuario_legacy NULLS LAST, b.id
  `;

  return sequelize.query(query, { bind: params, type: sequelize.QueryTypes.SELECT });
}

async function obtenerDetalleBecario(id) {
  const query = `
    SELECT
      b.id AS id_becario,
      b.id_usuario_legacy AS id_usuario,
      TRIM(CONCAT(COALESCE(b.nombres,''), ' ', COALESCE(b.apellidos,''))) AS nombres_apellidos,
      b.cedula,
      b.fecha_nacimiento,
      b.genero,
      b.nacionalidad,
      b.correo,
      b.telefono_principal,
      b.telefono_alternativo,
      b.direccion,
      b.estado AS codigo_estado,
      b.municipio AS codigo_municipio,
      b.parroquia AS codigo_parroquia,
      e.nombre AS estado,
      m.nombre AS municipio,
      p.nombre AS parroquia,
      COALESCE(s.institucion_nombre, CAST(s.id_institucion AS TEXT), '') AS institucion,
      COALESCE(s.carrera_nombre, CAST(s.id_carrera AS TEXT), '') AS programa_estudio,
      s.anio_ingreso,
      s.semestre_actual,
      s.turno_estudio,
      s.modalidad_estudio,
      s.tipo_beca AS programa_beca,
      b.latitud,
      b.longitud,
      MAX(CASE WHEN d.id_tipo_documento = 1 THEN d.ruta_archivo END) AS anexo_cedula,
      MAX(CASE WHEN d.id_tipo_documento = 2 THEN d.ruta_archivo END) AS anexo_constancia,
      MAX(CASE WHEN d.id_tipo_documento = 3 THEN d.ruta_archivo END) AS anexo_residencia,
      MAX(CASE WHEN d.id_tipo_documento = 4 THEN d.ruta_archivo END) AS anexo_foto,
      MAX(CASE WHEN d.id_tipo_documento = 7 THEN d.ruta_archivo END) AS contrato_convenio,
      MAX(CASE WHEN d.id_tipo_documento = 2 THEN d.ruta_archivo END) AS constancia_semestre
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_institucion, institucion_nombre, id_carrera, carrera_nombre,
        anio_ingreso, semestre_actual, turno_estudio, modalidad_estudio, tipo_beca
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN documentos_becario d ON d.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE b.id_usuario_legacy = $1 AND b.id_tipo_becario = 1
    GROUP BY b.id, b.id_usuario_legacy, e.nombre, m.nombre, p.nombre,
             s.id_institucion, s.institucion_nombre, s.id_carrera, s.carrera_nombre,
             s.anio_ingreso, s.semestre_actual, s.turno_estudio, s.modalidad_estudio, s.tipo_beca
    LIMIT 1
  `;

  const rows = await sequelize.query(query, { bind: [id], type: sequelize.QueryTypes.SELECT });
  return rows[0] || null;
}

async function obtenerDetalleBecarioExterior(id) {
  const query = `
    SELECT
      b.id AS id_becario,
      b.id_usuario_legacy AS id_usuario,
      TRIM(CONCAT(COALESCE(b.nombres,''), ' ', COALESCE(b.apellidos,''))) AS nombres_apellidos,
      b.cedula,
      b.pasaporte,
      b.fecha_nacimiento,
      b.genero,
      b.nacionalidad,
      b.correo,
      b.telefono_principal,
      b.telefono_alternativo,
      b.nombre_representante,
      b.parentesco,
      b.pais_origen AS pais_procedencia,
      b.estado AS codigoestado,
      b.municipio AS codigomunicipio,
      b.parroquia AS codigoparroquia,
      e.nombre AS estado,
      m.nombre AS municipio,
      p.nombre AS parroquia,
      COALESCE(s.institucion_nombre, CAST(s.id_institucion AS TEXT), '') AS institucion_academica,
      COALESCE(s.carrera_nombre, CAST(s.id_carrera AS TEXT), '') AS carrera,
      s.anio_ingreso,
      s.semestre_actual,
      b.latitud,
      b.longitud,
      b.latitud_pais,
      b.longitud_pais,
      MAX(CASE WHEN d.id_tipo_documento = 1 THEN d.ruta_archivo END) AS anexo_cedula,
      MAX(CASE WHEN d.id_tipo_documento = 2 THEN d.ruta_archivo END) AS anexo_constancia,
      MAX(CASE WHEN d.id_tipo_documento = 3 THEN d.ruta_archivo END) AS anexo_residencia,
      MAX(CASE WHEN d.id_tipo_documento = 4 THEN d.ruta_archivo END) AS anexo_foto,
      MAX(CASE WHEN d.id_tipo_documento = 7 THEN d.ruta_archivo END) AS contrato_convenio
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_institucion, institucion_nombre, id_carrera, carrera_nombre, anio_ingreso, semestre_actual
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN documentos_becario d ON d.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE b.id_usuario_legacy = $1 AND b.id_tipo_becario = 2
    GROUP BY b.id, b.id_usuario_legacy, e.nombre, m.nombre, p.nombre,
             s.id_institucion, s.institucion_nombre, s.id_carrera, s.carrera_nombre,
             s.anio_ingreso, s.semestre_actual
    LIMIT 1
  `;

  const rows = await sequelize.query(query, { bind: [id], type: sequelize.QueryTypes.SELECT });
  return rows[0] || null;
}

async function obtenerDetalleEgresado(id) {
  const query = `
    SELECT
      b.id AS id_becario,
      b.id_usuario_legacy AS id_usuario,
      TRIM(CONCAT(COALESCE(b.nombres,''), ' ', COALESCE(b.apellidos,''))) AS nombre_completo,
      b.cedula,
      b.correo,
      b.telefono_principal AS telefono_celular,
      b.fecha_nacimiento,
      b.es_militar,
      b.pais_origen AS descripcion_becario,
      b.estado AS codigoestado,
      b.municipio AS codigomunicipio,
      b.parroquia AS codigoparroquia,
      e.nombre AS estado,
      m.nombre AS municipio,
      p.nombre AS parroquia,
      b.latitud,
      b.longitud,
      b.direccion,
      s.fecha_egreso,
      s.tipo_beca,
      s.estado_estudio AS titularidad,
      s.idiomas,
      s.ocupacion_actual,
      COALESCE(s.institucion_nombre, CAST(s.id_institucion AS TEXT), '') AS universidad,
      COALESCE(s.carrera_nombre, CAST(s.id_carrera AS TEXT), '') AS carrera_cursada,
      s.trabajando
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_estatus, id_institucion, institucion_nombre, id_carrera, carrera_nombre,
        fecha_egreso, tipo_beca, estado_estudio, idiomas, ocupacion_actual, trabajando
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE b.id_usuario_legacy = $1 AND s.id_estatus = 2
    LIMIT 1
  `;

  const rows = await sequelize.query(query, { bind: [id], type: sequelize.QueryTypes.SELECT });
  return rows[0] || null;
}

async function registrarOActualizarBecarioVenezuela(body, files = {}) {
  const {
    id_usuario,
    nombresApellidos,
    cedula,
    fechaNacimiento,
    genero,
    nacionalidad,
    correo,
    telefonoPrincipal,
    telefonoAlternativo,
    direccion,
    institucion,
    programaEstudio,
    anioIngreso,
    semestreActual,
    turnoEstudio,
    modalidadEstudio,
    programaBeca,
    estadoBeca,
    codigoestado,
    codigomunicipio,
    codigoparroquia,
    latitud,
    longitud
  } = body;

  const t = await sequelize.transaction();
  try {
    const existing = await BecarioUnificado.findOne({
      where: {
        id_tipo_becario: 1,
        [Op.or]: [
          ...(cedula ? [{ cedula: String(cedula) }] : []),
          ...(correo ? [{ correo: String(correo) }] : [])
        ]
      },
      transaction: t
    });

    const { nombres, apellidos } = splitNombreCompleto(nombresApellidos || (existing ? `${existing.nombres} ${existing.apellidos}` : ''));

    const payload = {
      id_usuario_legacy: parseIntOrNull(id_usuario) || existing?.id_usuario_legacy || null,
      id_tipo_becario: 1,
      cedula: String(cedula || existing?.cedula || ''),
      nombres,
      apellidos,
      fecha_nacimiento: fechaNacimiento || existing?.fecha_nacimiento || null,
      genero: genero || existing?.genero || null,
      nacionalidad: nacionalidad || existing?.nacionalidad || null,
      correo: correo || existing?.correo || null,
      telefono_principal: telefonoPrincipal || existing?.telefono_principal || null,
      telefono_alternativo: telefonoAlternativo || existing?.telefono_alternativo || null,
      direccion: direccion || existing?.direccion || null,
      estado: codigoestado || existing?.estado || null,
      municipio: codigomunicipio || existing?.municipio || null,
      parroquia: codigoparroquia || existing?.parroquia || null,
      latitud: latitud || existing?.latitud || null,
      longitud: longitud || existing?.longitud || null
    };

    const becario = existing
      ? await existing.update(payload, { transaction: t })
      : await BecarioUnificado.create(payload, { transaction: t });

    await upsertEstudio(
      becario.id,
      {
        id_estatus: 1,
        id_institucion: parseIntOrNull(institucion),
        institucion_nombre: parseIntOrNull(institucion) ? null : (institucion || null),
        id_carrera: parseIntOrNull(programaEstudio),
        carrera_nombre: parseIntOrNull(programaEstudio) ? null : (programaEstudio || null),
        anio_ingreso: extraerAnio(anioIngreso),
        semestre_actual: semestreActual || null,
        turno_estudio: turnoEstudio || null,
        modalidad_estudio: modalidadEstudio || null,
        tipo_beca: programaBeca || null,
        estado_estudio: estadoBeca || null
      },
      t
    );

    const dirs = getManagedDirs();
    const docs = {
      anexoCedula: files.anexoCedula?.[0] ? moveFileToFolder(files.anexoCedula[0], dirs.anexos, payload.cedula, 'cedula') : null,
      anexoConstancia: files.anexoConstancia?.[0] ? moveFileToFolder(files.anexoConstancia[0], dirs.anexos, payload.cedula, 'constancia') : null,
      anexoResidencia: files.anexoResidencia?.[0] ? moveFileToFolder(files.anexoResidencia[0], dirs.anexos, payload.cedula, 'residencia') : null,
      anexoFoto: files.anexoFoto?.[0] ? moveFileToFolder(files.anexoFoto[0], dirs.fotos, payload.cedula, 'foto') : null,
      contratoConvenio: files.Contrato_convenio?.[0] ? moveFileToFolder(files.Contrato_convenio[0], dirs.anexos, payload.cedula, 'contrato_convenio') : null,
      constanciaSemestre: files.constancia_semestre?.[0] ? moveFileToFolder(files.constancia_semestre[0], dirs.constancias, payload.cedula, 'constancia_semestre') : null
    };

    await upsertDocumento(becario.id, 1, docs.anexoCedula, t);
    await upsertDocumento(becario.id, 2, docs.anexoConstancia, t);
    await upsertDocumento(becario.id, 3, docs.anexoResidencia, t);
    await upsertDocumento(becario.id, 4, docs.anexoFoto, t);
    await upsertDocumento(becario.id, 7, docs.contratoConvenio, t);
    await upsertDocumento(becario.id, 2, docs.constanciaSemestre, t);

    await t.commit();

    const detalle = await obtenerDetalleBecario(payload.id_usuario_legacy);
    return { isUpdate: !!existing, becario: detalle };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function registrarOActualizarBecarioExterior(body, files = {}) {
  const {
    id_usuario,
    nombresApellidos,
    cedula,
    pasaporte,
    fechaNacimiento,
    genero,
    nacionalidad,
    correo,
    telefonoPrincipal,
    telefonoAlternativo,
    nombre_representante,
    parentesco,
    pais_procedencia,
    institucion_academica,
    carrera,
    anioIngreso,
    semestreActual,
    codigoestado,
    codigomunicipio,
    codigoparroquia,
    latitud,
    longitud,
    latitud_pais,
    longitud_pais
  } = body;

  const t = await sequelize.transaction();
  try {
    const existing = await BecarioUnificado.findOne({
      where: {
        id_tipo_becario: 2,
        [Op.or]: [
          ...(cedula ? [{ cedula: String(cedula) }] : []),
          ...(correo ? [{ correo: String(correo) }] : [])
        ]
      },
      transaction: t
    });

    const { nombres, apellidos } = splitNombreCompleto(nombresApellidos || (existing ? `${existing.nombres} ${existing.apellidos}` : ''));

    const payload = {
      id_usuario_legacy: parseIntOrNull(id_usuario) || existing?.id_usuario_legacy || null,
      id_tipo_becario: 2,
      cedula: String(cedula || existing?.cedula || ''),
      pasaporte: pasaporte || existing?.pasaporte || null,
      nombres,
      apellidos,
      fecha_nacimiento: fechaNacimiento || existing?.fecha_nacimiento || null,
      genero: genero || existing?.genero || null,
      nacionalidad: nacionalidad || existing?.nacionalidad || null,
      correo: correo || existing?.correo || null,
      telefono_principal: telefonoPrincipal || existing?.telefono_principal || null,
      telefono_alternativo: telefonoAlternativo || existing?.telefono_alternativo || null,
      nombre_representante: nombre_representante || existing?.nombre_representante || null,
      parentesco: parentesco || existing?.parentesco || null,
      pais_origen: pais_procedencia || existing?.pais_origen || null,
      estado: codigoestado || existing?.estado || null,
      municipio: codigomunicipio || existing?.municipio || null,
      parroquia: codigoparroquia || existing?.parroquia || null,
      latitud: latitud || existing?.latitud || null,
      longitud: longitud || existing?.longitud || null,
      latitud_pais: latitud_pais || existing?.latitud_pais || null,
      longitud_pais: longitud_pais || existing?.longitud_pais || null
    };

    const becario = existing
      ? await existing.update(payload, { transaction: t })
      : await BecarioUnificado.create(payload, { transaction: t });

    await upsertEstudio(
      becario.id,
      {
        id_estatus: 1,
        id_institucion: parseIntOrNull(institucion_academica),
        institucion_nombre: parseIntOrNull(institucion_academica) ? null : (institucion_academica || null),
        id_carrera: parseIntOrNull(carrera),
        carrera_nombre: parseIntOrNull(carrera) ? null : (carrera || null),
        anio_ingreso: extraerAnio(anioIngreso),
        semestre_actual: semestreActual || null
      },
      t
    );

    const dirs = getManagedDirs();
    const docs = {
      anexoCedula: files.anexoCedula?.[0] ? moveFileToFolder(files.anexoCedula[0], dirs.anexos, payload.cedula, 'cedula') : null,
      anexoConstancia: files.anexoConstancia?.[0] ? moveFileToFolder(files.anexoConstancia[0], dirs.anexos, payload.cedula, 'constancia') : null,
      anexoResidencia: files.anexoResidencia?.[0] ? moveFileToFolder(files.anexoResidencia[0], dirs.anexos, payload.cedula, 'residencia') : null,
      anexoFoto: files.anexoFoto?.[0] ? moveFileToFolder(files.anexoFoto[0], dirs.fotos, payload.cedula, 'foto') : null,
      contratoConvenio: files.Contrato_convenio?.[0] ? moveFileToFolder(files.Contrato_convenio[0], dirs.anexos, payload.cedula, 'contrato_convenio') : null
    };

    await upsertDocumento(becario.id, 1, docs.anexoCedula, t);
    await upsertDocumento(becario.id, 2, docs.anexoConstancia, t);
    await upsertDocumento(becario.id, 3, docs.anexoResidencia, t);
    await upsertDocumento(becario.id, 4, docs.anexoFoto, t);
    await upsertDocumento(becario.id, 7, docs.contratoConvenio, t);

    await t.commit();

    const detalle = await obtenerDetalleBecarioExterior(payload.id_usuario_legacy);
    return { isUpdate: !!existing, becario: detalle };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function registrarEgresado(body) {
  const {
    id_usuario,
    nombre_completo,
    cedula,
    correo,
    telefono_celular,
    fecha_nacimiento,
    tipo_beca,
    carrera_cursada,
    fecha_egreso,
    titularidad,
    idiomas,
    ocupacion_actual,
    universidad,
    becario_tipo,
    descripcion_becario,
    codigoestado,
    codigomunicipio,
    codigoparroquia,
    latitud,
    longitud,
    direccion,
    es_militar,
    trabajando
  } = body;

  const exists = await BecarioUnificado.findOne({
    where: {
      [Op.or]: [
        ...(cedula ? [{ cedula: String(cedula) }] : []),
        ...(correo ? [{ correo: String(correo) }] : [])
      ]
    }
  });

  if (exists) {
    const error = new Error('El becario ya esta registrado con esta cedula o correo');
    error.status = 400;
    throw error;
  }

  const tipo = String(becario_tipo || '').toLowerCase() === 'internacional' ? 3 : 1;
  const { nombres, apellidos } = splitNombreCompleto(nombre_completo);

  const t = await sequelize.transaction();
  try {
    const becario = await BecarioUnificado.create({
      id_usuario_legacy: parseIntOrNull(id_usuario),
      id_tipo_becario: tipo,
      cedula: String(cedula || ''),
      nombres,
      apellidos,
      correo: correo || null,
      telefono_principal: telefono_celular || null,
      fecha_nacimiento: fecha_nacimiento || null,
      estado: codigoestado || null,
      municipio: codigomunicipio || null,
      parroquia: codigoparroquia || null,
      latitud: latitud || null,
      longitud: longitud || null,
      direccion: direccion || null,
      es_militar: es_militar || null,
      pais_origen: descripcion_becario || null
    }, { transaction: t });

    await EstudioBecario.create({
      id_becario: becario.id,
      id_estatus: 2,
      id_institucion: parseIntOrNull(universidad),
      institucion_nombre: parseIntOrNull(universidad) ? null : (universidad || null),
      id_carrera: parseIntOrNull(carrera_cursada),
      carrera_nombre: parseIntOrNull(carrera_cursada) ? null : (carrera_cursada || null),
      fecha_egreso: fecha_egreso || null,
      tipo_beca: tipo_beca || null,
      estado_estudio: titularidad || null,
      idiomas: idiomas || null,
      ocupacion_actual: ocupacion_actual || null,
      trabajando: trabajando || null
    }, { transaction: t });

    await t.commit();
    const detalle = await obtenerDetalleEgresado(becario.id_usuario_legacy);
    return detalle;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function eliminarBecarioExterior(id) {
  const [rows] = await sequelize.query(
    `DELETE FROM becarios_unificados WHERE id_usuario_legacy = $1 AND id_tipo_becario = 2 RETURNING id`,
    { bind: [id] }
  );

  if (!rows || rows.length === 0) return null;
  return { ok: true, deleted: rows.length };
}

module.exports = {
  obtenerBecariosVenezuela,
  obtenerBecariosExterior,
  obtenerEgresados,
  obtenerDetalleBecario,
  obtenerDetalleBecarioExterior,
  obtenerDetalleEgresado,
  registrarOActualizarBecarioVenezuela,
  registrarOActualizarBecarioExterior,
  registrarEgresado,
  eliminarBecarioExterior
};
