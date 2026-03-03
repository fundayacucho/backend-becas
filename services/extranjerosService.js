const { Op } = require('sequelize');
const {
  sequelize,
  BecarioUnificado,
  EstudioBecario,
  DocumentoBecario,
  InfoMigratoria
} = require('../models');
const { moveFileToFolder, getManagedDirs } = require('../utils/fileManager');

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

function pickValue(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
}

function buildFilters(
  {
    estado = '',
    municipio = '',
    parroquia = '',
    pais_origen = '',
    estatus_academico = '',
    status_visa = ''
  },
  params
) {
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
  if (pais_origen) {
    params.push(`%${pais_origen}%`);
    conditions.push(`COALESCE(b.pais_origen, '') ILIKE $${params.length}`);
  }
  if (estatus_academico) {
    params.push(estatus_academico);
    conditions.push(`COALESCE(ca.codigo, '') = $${params.length}`);
  }
  if (status_visa) {
    params.push(status_visa);
    conditions.push(`COALESCE(im.status_visa, '') = $${params.length}`);
  }

  return conditions.length ? ` AND ${conditions.join(' AND ')}` : '';
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

async function upsertInfoMigratoria(idBecario, payload, transaction) {
  const existing = await InfoMigratoria.findOne({
    where: { id_becario: idBecario },
    transaction
  });

  if (existing) {
    await existing.update(payload, { transaction });
    return existing;
  }

  return InfoMigratoria.create({ id_becario: idBecario, ...payload }, { transaction });
}

async function findExtranjeroById(id, transaction) {
  const where = {
    id_tipo_becario: 3,
    [Op.or]: [{ id: String(id) }]
  };
  const numericId = parseIntOrNull(id);
  if (numericId !== null) {
    where[Op.or].push({ id_usuario_legacy: numericId });
  }
  return BecarioUnificado.findOne({ where, transaction });
}

async function listarExtranjeros(filters) {
  const params = [3];
  const extraFilter = buildFilters(filters, params);

  const query = `
    SELECT
      b.id AS id_becario,
      b.id_usuario_legacy AS id_usuario,
      TRIM(CONCAT(COALESCE(b.nombres,''), ' ', COALESCE(b.apellidos,''))) AS nombres_apellidos,
      b.cedula,
      b.pasaporte,
      b.correo,
      b.telefono_principal,
      b.pais_origen,
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
      ca.codigo AS estatus_academico,
      ca.descripcion AS estatus_academico_desc,
      im.visa_numero,
      im.status_visa,
      im.fecha_vencimiento_visa,
      im.estatus_pasaporte,
      im.fecha_vencimiento_pasaporte,
      im.observaciones,
      b.latitud,
      b.longitud
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_estatus, id_institucion, id_carrera, institucion_nombre, carrera_nombre,
        anio_ingreso, semestre_actual
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN cat_estatus_academico ca ON ca.id = s.id_estatus
    LEFT JOIN info_migratoria im ON im.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE b.id_tipo_becario = $1
    ${extraFilter}
    ORDER BY b.id_usuario_legacy NULLS LAST, b.id
  `;

  return sequelize.query(query, { bind: params, type: sequelize.QueryTypes.SELECT });
}

async function detalleExtranjero(id) {
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
      b.direccion,
      b.pais_origen,
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
      s.nivel_academico,
      s.estado_estudio,
      ca.codigo AS estatus_academico,
      ca.descripcion AS estatus_academico_desc,
      im.fecha_vencimiento_pasaporte,
      im.estatus_pasaporte,
      im.visa_numero,
      im.fecha_vencimiento_visa,
      im.status_visa,
      im.sede_residencia,
      im.contrato_firmado,
      im.observaciones,
      b.latitud,
      b.longitud,
      MAX(CASE WHEN d.id_tipo_documento = 1 THEN d.ruta_archivo END) AS anexo_cedula,
      MAX(CASE WHEN d.id_tipo_documento = 2 THEN d.ruta_archivo END) AS anexo_constancia,
      MAX(CASE WHEN d.id_tipo_documento = 4 THEN d.ruta_archivo END) AS anexo_foto,
      MAX(CASE WHEN d.id_tipo_documento = 5 THEN d.ruta_archivo END) AS anexo_pasaporte,
      MAX(CASE WHEN d.id_tipo_documento = 6 THEN d.ruta_archivo END) AS anexo_visa,
      MAX(CASE WHEN d.id_tipo_documento = 7 THEN d.ruta_archivo END) AS contrato_convenio
    FROM becarios_unificados b
    LEFT JOIN (
      SELECT DISTINCT ON (id_becario)
        id_becario, id_estatus, id_institucion, id_carrera, institucion_nombre, carrera_nombre,
        anio_ingreso, semestre_actual, nivel_academico, estado_estudio
      FROM estudios_becario
      ORDER BY id_becario, "createdAt" DESC
    ) s ON s.id_becario = b.id
    LEFT JOIN cat_estatus_academico ca ON ca.id = s.id_estatus
    LEFT JOIN info_migratoria im ON im.id_becario = b.id
    LEFT JOIN documentos_becario d ON d.id_becario = b.id
    LEFT JOIN tbl_estado e ON e.codigoestado = b.estado
    LEFT JOIN tbl_municipio m ON m.codigomunicipio = b.municipio
    LEFT JOIN tbl_parroquia p ON p.codigoparroquia = b.parroquia
    WHERE b.id_tipo_becario = 3
      AND (CAST(b.id AS TEXT) = $1 OR CAST(b.id_usuario_legacy AS TEXT) = $1)
    GROUP BY
      b.id, b.id_usuario_legacy, e.nombre, m.nombre, p.nombre,
      s.id_estatus, s.id_institucion, s.id_carrera, s.institucion_nombre, s.carrera_nombre,
      s.anio_ingreso, s.semestre_actual, s.nivel_academico, s.estado_estudio,
      ca.codigo, ca.descripcion, im.id
    LIMIT 1
  `;

  const rows = await sequelize.query(query, { bind: [String(id)], type: sequelize.QueryTypes.SELECT });
  return rows[0] || null;
}

async function guardarExtranjero(body, files = {}, explicitTarget = null) {
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
    direccion,
    pais_origen,
    codigoestado,
    codigomunicipio,
    codigoparroquia,
    latitud,
    longitud,
    institucion,
    programaEstudio,
    anioIngreso,
    semestreActual,
    nivelAcademico,
    estadoEstudio,
    id_estatus,
    fechaVencimientoPasaporte,
    estatusPasaporte,
    visaNumero,
    fechaVencimientoVisa,
    statusVisa,
    sedeResidencia,
    observaciones
  } = body;

  const t = await sequelize.transaction();
  try {
    let existing = null;
    if (explicitTarget) {
      existing = await findExtranjeroById(explicitTarget, t);
    } else {
      const whereOr = [
        ...(cedula ? [{ cedula: String(cedula) }] : []),
        ...(correo ? [{ correo: String(correo) }] : []),
        ...(pasaporte ? [{ pasaporte: String(pasaporte) }] : [])
      ];
      existing = await BecarioUnificado.findOne({
        where: { id_tipo_becario: 3, ...(whereOr.length ? { [Op.or]: whereOr } : {}) },
        transaction: t
      });
    }

    const identityNumber = String(
      cedula || pasaporte || existing?.cedula || existing?.pasaporte || `EXT-${Date.now()}`
    );
    const { nombres, apellidos } = splitNombreCompleto(
      nombresApellidos || (existing ? `${existing.nombres} ${existing.apellidos}` : '')
    );

    const payload = {
      id_usuario_legacy: parseIntOrNull(id_usuario) || existing?.id_usuario_legacy || null,
      id_tipo_becario: 3,
      cedula: String(pickValue(cedula, existing?.cedula || identityNumber)),
      pasaporte: pickValue(pasaporte, existing?.pasaporte || null),
      nombres,
      apellidos,
      fecha_nacimiento: pickValue(fechaNacimiento, existing?.fecha_nacimiento || null),
      genero: pickValue(genero, existing?.genero || null),
      nacionalidad: pickValue(nacionalidad, existing?.nacionalidad || null),
      correo: pickValue(correo, existing?.correo || null),
      telefono_principal: pickValue(telefonoPrincipal, existing?.telefono_principal || null),
      telefono_alternativo: pickValue(telefonoAlternativo, existing?.telefono_alternativo || null),
      direccion: pickValue(direccion, existing?.direccion || null),
      pais_origen: pickValue(pais_origen, existing?.pais_origen || null),
      estado: pickValue(codigoestado, existing?.estado || null),
      municipio: pickValue(codigomunicipio, existing?.municipio || null),
      parroquia: pickValue(codigoparroquia, existing?.parroquia || null),
      latitud: pickValue(latitud, existing?.latitud || null),
      longitud: pickValue(longitud, existing?.longitud || null)
    };

    const becario = existing
      ? await existing.update(payload, { transaction: t })
      : await BecarioUnificado.create(payload, { transaction: t });

    const estudioActual = await EstudioBecario.findOne({
      where: { id_becario: becario.id },
      order: [['createdAt', 'DESC']],
      transaction: t
    });

    const estatusAcademico =
      parseIntOrNull(id_estatus) ||
      (String(pickValue(estadoEstudio, estudioActual?.estado_estudio || '')).toLowerCase().includes('egresad') ? 2 : 1);

    await upsertEstudio(
      becario.id,
      {
        id_estatus: estatusAcademico,
        id_institucion: parseIntOrNull(institucion) ?? estudioActual?.id_institucion ?? null,
        institucion_nombre: parseIntOrNull(institucion)
          ? null
          : pickValue(institucion, estudioActual?.institucion_nombre || null),
        id_carrera: parseIntOrNull(programaEstudio) ?? estudioActual?.id_carrera ?? null,
        carrera_nombre: parseIntOrNull(programaEstudio)
          ? null
          : pickValue(programaEstudio, estudioActual?.carrera_nombre || null),
        anio_ingreso: extraerAnio(anioIngreso) ?? estudioActual?.anio_ingreso ?? null,
        semestre_actual: pickValue(semestreActual, estudioActual?.semestre_actual || null),
        nivel_academico: pickValue(nivelAcademico, estudioActual?.nivel_academico || null),
        estado_estudio: pickValue(estadoEstudio, estudioActual?.estado_estudio || null)
      },
      t
    );

    const dirs = getManagedDirs();
    const docs = {
      anexoCedula: files.anexoCedula?.[0]
        ? moveFileToFolder(files.anexoCedula[0], dirs.anexos, identityNumber, 'cedula')
        : null,
      anexoConstancia: files.anexoConstancia?.[0]
        ? moveFileToFolder(files.anexoConstancia[0], dirs.anexos, identityNumber, 'constancia')
        : null,
      anexoFoto: files.anexoFoto?.[0]
        ? moveFileToFolder(files.anexoFoto[0], dirs.fotos, identityNumber, 'foto')
        : null,
      anexoPasaporte: files.anexoPasaporte?.[0]
        ? moveFileToFolder(files.anexoPasaporte[0], dirs.anexos, identityNumber, 'pasaporte')
        : null,
      anexoVisa: files.anexoVisa?.[0]
        ? moveFileToFolder(files.anexoVisa[0], dirs.anexos, identityNumber, 'visa')
        : null,
      contratoConvenio: files.Contrato_convenio?.[0]
        ? moveFileToFolder(files.Contrato_convenio[0], dirs.anexos, identityNumber, 'contrato_convenio')
        : null
    };

    await upsertDocumento(becario.id, 1, docs.anexoCedula, t);
    await upsertDocumento(becario.id, 2, docs.anexoConstancia, t);
    await upsertDocumento(becario.id, 4, docs.anexoFoto, t);
    await upsertDocumento(becario.id, 5, docs.anexoPasaporte, t);
    await upsertDocumento(becario.id, 6, docs.anexoVisa, t);
    await upsertDocumento(becario.id, 7, docs.contratoConvenio, t);

    const infoActual = await InfoMigratoria.findOne({
      where: { id_becario: becario.id },
      transaction: t
    });

    await upsertInfoMigratoria(
      becario.id,
      {
        fecha_vencimiento_pasaporte: pickValue(
          fechaVencimientoPasaporte,
          infoActual?.fecha_vencimiento_pasaporte || null
        ),
        estatus_pasaporte: pickValue(estatusPasaporte, infoActual?.estatus_pasaporte || null),
        visa_numero: pickValue(visaNumero, infoActual?.visa_numero || null),
        fecha_vencimiento_visa: pickValue(fechaVencimientoVisa, infoActual?.fecha_vencimiento_visa || null),
        status_visa: pickValue(statusVisa, infoActual?.status_visa || null),
        sede_residencia: pickValue(sedeResidencia, infoActual?.sede_residencia || null),
        contrato_firmado: docs.contratoConvenio || infoActual?.contrato_firmado || null,
        observaciones: pickValue(observaciones, infoActual?.observaciones || null)
      },
      t
    );

    await t.commit();

    const detalle = await detalleExtranjero(becario.id);
    return { isUpdate: !!existing, becario: detalle };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function registrarExtranjero(body, files = {}) {
  return guardarExtranjero(body, files);
}

async function actualizarExtranjero(id, body, files = {}) {
  const exists = await findExtranjeroById(id);
  if (!exists) {
    const error = new Error('Becario extranjero no encontrado');
    error.status = 404;
    throw error;
  }
  return guardarExtranjero(body, files, id);
}

async function eliminarExtranjero(id) {
  const t = await sequelize.transaction();
  try {
    const becario = await findExtranjeroById(id, t);
    if (!becario) return null;

    const documentos = await DocumentoBecario.findAll({
      where: { id_becario: becario.id },
      transaction: t
    });
    for (const doc of documentos) {
      await doc.destroy({ transaction: t });
    }

    const infoMigratoria = await InfoMigratoria.findOne({
      where: { id_becario: becario.id },
      transaction: t
    });
    if (infoMigratoria) {
      await infoMigratoria.destroy({ transaction: t });
    }

    await becario.destroy({ transaction: t });
    await t.commit();
    return { ok: true, deleted: 1 };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = {
  listarExtranjeros,
  detalleExtranjero,
  registrarExtranjero,
  actualizarExtranjero,
  eliminarExtranjero
};
