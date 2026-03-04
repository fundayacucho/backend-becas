const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');
const { sequelize } = require('../config/database');
const {
  Usuario,
  BecarioUnificado,
  EstudioBecario,
  DocumentoBecario
} = require('../models');
const LEGACY_DB_NAME = process.env.LEGACY_DB_NAME || 'becario_newBecarios';
const NEW_DB_NAME = process.env.DB_NAME || 'becarios_v2';
const LEGACY_DB_USER = process.env.LEGACY_DB_USER || process.env.DB_USER;
const LEGACY_DB_HOST = process.env.LEGACY_DB_HOST || process.env.DB_HOST;
const LEGACY_DB_PORT = process.env.LEGACY_DB_PORT || process.env.DB_PORT;
const LEGACY_DB_PASSWORD = process.env.LEGACY_DB_PASSWORD || process.env.DB_PASSWORD;

// Conexion legacy para lectura
const legacyPool = new Pool({
  user: LEGACY_DB_USER,
  host: LEGACY_DB_HOST,
  database: LEGACY_DB_NAME,
  password: LEGACY_DB_PASSWORD,
  port: LEGACY_DB_PORT,
});

// Helpers de limpieza de datos
function parseCedula(rawCedula) {
  if (!rawCedula) return { cedula: null, nacionalidad: null };
  const str = String(rawCedula).trim();
  const match = str.match(/^([VE]-?)?(\d+)$/i);
  if (match) {
    let nac = match[1] ? match[1].replace('-', '').toUpperCase() : 'V';
    return { cedula: match[2], nacionalidad: nac };
  }
  return { cedula: str, nacionalidad: 'V' };
}

function procesarNombres(fullName) {
  if (!fullName) return { nombres: 'Sin Nombre', apellidos: 'Sin Apellido' };
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return { nombres: parts[0], apellidos: 'Sin Apellido' };
  if (parts.length === 2) return { nombres: parts[0], apellidos: parts[1] };
  if (parts.length === 3) return { nombres: parts[0] + ' ' + parts[1], apellidos: parts[2] };
  const mid = Math.ceil(parts.length / 2);
  return {
    nombres: parts.slice(0, mid).join(' '),
    apellidos: parts.slice(mid).join(' ')
  };
}

function extraerAnio(fecha_ingreso) {
  if (!fecha_ingreso) return null;
  const str = String(fecha_ingreso);
  // Si parece ser un aÃ±o como "2021"
  if (/^\d{4}$/.test(str)) return parseInt(str);
  // Si contiene el aÃ±o en una fecha larga (ej. "Mon Jan 12 2026")
  const match = str.match(/\d{4}/);
  if (match) return parseInt(match[0]);
  return null;
}
function padCode(code, len) {
  if (!code) return null;
  const str = String(code).trim();
  if (/^\d+$/.test(str)) return str.padStart(len, '0');
  return str;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumericCandidate(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const numbers = raw.match(/\d+/g);
  if (!numbers || numbers.length !== 1) return null;
  return parseInt(numbers[0], 10);
}

let unerCache = null;
let carrerasCache = null;

async function getUnerCache() {
  if (unerCache) return unerCache;
  const q = await legacyPool.query('SELECT id, codigo, nombre_uner FROM tbl_uner');
  unerCache = q.rows.map(r => ({
    id: r.id,
    codigo: r.codigo,
    nombre_uner: r.nombre_uner,
    nombre_norm: normalizeText(r.nombre_uner)
  }));
  return unerCache;
}

async function getCarrerasCache() {
  if (carrerasCache) return carrerasCache;
  const q = await legacyPool.query('SELECT id, codigo, cod_nuc_unv, carreras FROM tbl_carreras');
  carrerasCache = q.rows.map(r => ({
    id: r.id,
    codigo: r.codigo,
    cod_nuc_unv: r.cod_nuc_unv,
    carreras: r.carreras,
    carrera_norm: normalizeText(r.carreras)
  }));
  return carrerasCache;
}
async function buscarInstitucion(codigoOId, nombre) {
  if (!codigoOId && !nombre) return { id: null, nombre: null };

  const records = await getUnerCache();
  const numeric = parseNumericCandidate(codigoOId ?? nombre);

  if (numeric !== null) {
    const byCode = records.find(r => Number(r.codigo) === numeric) || records.find(r => Number(r.id) === numeric);
    if (byCode) return { id: byCode.id, nombre: byCode.nombre_uner };
  }

  const nameSource = nombre || codigoOId;
  const nameNorm = normalizeText(nameSource);
  if (nameNorm) {
    const exact = records.find(r => r.nombre_norm === nameNorm);
    if (exact) return { id: exact.id, nombre: exact.nombre_uner };

    const partial = records.find(r => r.nombre_norm.includes(nameNorm) || nameNorm.includes(r.nombre_norm));
    if (partial) return { id: partial.id, nombre: partial.nombre_uner };
  }

  return { id: null, nombre: nameSource || null };
}

async function buscarCarrera(codigoOId, nombre) {
  if (!codigoOId && !nombre) return { id: null, nombre: null };

  const records = await getCarrerasCache();
  const numeric = parseNumericCandidate(codigoOId ?? nombre);

  if (numeric !== null) {
    const byCode = records.find(r => Number(r.cod_nuc_unv) === numeric) || records.find(r => Number(r.codigo) === numeric) || records.find(r => Number(r.id) === numeric);
    if (byCode) return { id: byCode.id, nombre: byCode.carreras };
  }

  const nameSource = nombre || codigoOId;
  const nameNorm = normalizeText(nameSource);
  if (nameNorm) {
    const exact = records.find(r => r.carrera_norm === nameNorm);
    if (exact) return { id: exact.id, nombre: exact.carreras };

    const partial = records.find(r => r.carrera_norm.includes(nameNorm) || nameNorm.includes(r.carrera_norm));
    if (partial) return { id: partial.id, nombre: partial.carreras };
  }

  return { id: null, nombre: nameSource || null };
}

async function migrarUsuarios() {
  console.log('ðŸ‘¥ Migrando Usuarios...');
  const res = await legacyPool.query('SELECT * FROM usuarios');
  
  let count = 0;
  for (const user of res.rows) {
    // Mapeo legacy roles (1: Estudiante, 2: Admin/Analista)
    let newRoleId = null;
    if (user.id_rol === 1) newRoleId = 1; // ESTUDIANTE
    else if (user.id_rol === 2) {
      // En mapeo normalizado: 4 = ADMIN, 2 = ANALISTA
      const tipo = String(user.tipo_usuario || '').toLowerCase();
      newRoleId = tipo === 'admin' ? 4 : 2;
    }

    await Usuario.findOrCreate({
      where: { cedula: user.cedula ? String(user.cedula) : `legacy-${user.id_usuario}` },
      defaults: {
        id: user.id_usuario, // Forzar ID legacy para mantener referencias
        nombre_completo: user.nombre_usuario || user.cedula,
        email: user.email,
        password: user.password,
        id_rol: newRoleId,
        tipo_usuario: user.tipo_usuario,
        activo: true
      }
    });
    count++;
  }
  console.log(`âœ… ${count} usuarios migrados.`);
}

async function findOrCreateEstudio(payload, transaction) {
  await EstudioBecario.findOrCreate({
    where: {
      id_becario: payload.id_becario,
      id_estatus: payload.id_estatus,
      id_institucion: payload.id_institucion,
      id_carrera: payload.id_carrera,
      anio_ingreso: payload.anio_ingreso || null,
      fecha_egreso: payload.fecha_egreso || null
      
    },
    defaults: payload,
    transaction
  });
}

async function insertDocumentosSinDuplicar(idBecario, docs, transaction) {
  for (const doc of docs) {
    await DocumentoBecario.findOrCreate({
      where: {
        id_becario: idBecario,
        id_tipo_documento: doc.id_tipo_documento,
        ruta_archivo: doc.ruta_archivo
      },
      defaults: {
        id_becario: idBecario,
        id_tipo_documento: doc.id_tipo_documento,
        ruta_archivo: doc.ruta_archivo
      },
      transaction
    });
  }
}

async function migrarBecariosNacionales() {
  console.log('ðŸ‡»ðŸ‡ª Migrando Becarios Nacionales (VEN_VEN)...');
  const res = await legacyPool.query('SELECT * FROM becarios');
  
  let count = 0;
  for (const row of res.rows) {
    const t = await sequelize.transaction();
    try {
      const { cedula, nacionalidad } = parseCedula(row.cedula);
      if (!cedula) throw new Error("CÃ©dula nula");

      const { nombres, apellidos } = procesarNombres(row.nombres_apellidos);

      let originNac = "V";
      if (row.nacionalidad && row.nacionalidad.toLowerCase().includes("extranjero")) originNac = "E";

      const [{ id: idBecario }] = await BecarioUnificado.findOrCreate({
        where: { cedula: cedula },
        defaults: {
          id_tipo_becario: 1, // VEN_VEN
          id_usuario_legacy: row.id_usuario,
          nombres: nombres,
          apellidos: apellidos,
          nacionalidad: nacionalidad || originNac,
          fecha_nacimiento: row.fecha_nacimiento,
          genero: row.genero,
          correo: row.correo,
          telefono_principal: row.telefono_principal,
          telefono_alternativo: row.telefono_alternativo,
          estado: padCode(row.codigo_estado, 2),
          municipio: padCode(row.codigo_municipio, 4),
          parroquia: padCode(row.codigo_parroquia, 6),
          comuna: row.comuna || null,
          direccion: row.direccion,
          latitud: row.latitud ? String(row.latitud) : null,
          longitud: row.longitud ? String(row.longitud) : null,
          codigoestado2: padCode(row.codigoestado2, 2),
        },
        transaction: t
      });

      const inst = await buscarInstitucion(row.institucion);
      const carr = await buscarCarrera(row.programa_estudio);

      await findOrCreateEstudio({
        id_becario: idBecario,
        id_estatus: 1, // ACTIVO
        id_institucion: inst.id,
        id_carrera: carr.id,
        institucion_nombre: inst.nombre,
        carrera_nombre: carr.nombre,
        anio_ingreso: extraerAnio(row.anio_ingreso),
        semestre_actual: row.semestre_actual,
        turno_estudio: row.turno_estudio,
        modalidad_estudio: row.modalidad_estudio,
        tipo_beca: row.programa_beca,
        tipoTarea: row.tipo_tarea || null,
        dependencia: row.dependencia || null
      }, t);

      // Documentos (Legacy paths)
      const docs = [];
      if (row.anexo_cedula) docs.push({ id_becario: idBecario, id_tipo_documento: 1, ruta_archivo: row.anexo_cedula });
      if (row.constancia_semestre) docs.push({ id_becario: idBecario, id_tipo_documento: 2, ruta_archivo: row.constancia_semestre });
      if (row.anexo_foto) docs.push({ id_becario: idBecario, id_tipo_documento: 4, ruta_archivo: row.anexo_foto });
      
      if (docs.length > 0) {
        await insertDocumentosSinDuplicar(idBecario, docs, t);
      }

      await t.commit();
      count++;
    } catch (error) {
      await t.rollback();
      console.error(`Error migrando becario VEN ${row.cedula}:`, error.message);
    }
  }
  console.log(`âœ… ${count} becarios nacionales migrados.`);
}

async function migrarBecariosExterior() {
  console.log('âœˆï¸ Migrando Becarios en el Exterior (VEN_EXT)...');
  const res = await legacyPool.query('SELECT * FROM tbl_becario_exterior');
  
  let count = 0;
  for (const row of res.rows) {
    const t = await sequelize.transaction();
    try {
      const { cedula, nacionalidad } = parseCedula(row.cedula);
      if (!cedula) throw new Error("CÃ©dula nula");

      const { nombres, apellidos } = procesarNombres(row.nombres_apellidos);

      const [{ id: idBecario }] = await BecarioUnificado.findOrCreate({
        where: { cedula: cedula },
        defaults: {
          id_tipo_becario: 2, // VEN_EXT
          id_usuario_legacy: row.id_usuario,
          nombres: nombres,
          apellidos: apellidos,
          nacionalidad: nacionalidad,
          pasaporte: row.pasaporte,
          fecha_nacimiento: row.fecha_nacimiento,
          genero: row.genero,
          correo: row.correo,
          telefono_principal: row.telefono_principal,
          nombre_representante: row.nombre_representante,
          parentesco: row.parentesco,
          pais_origen: row.pais_procedencia,
          estado: padCode(row.codigoestado, 2),
          municipio: padCode(row.codigomunicipio, 4),
          parroquia: padCode(row.codigoparroquia, 6),
          comuna: row.comuna || null,
          latitud: row.latitud ? String(row.latitud) : null,
          longitud: row.longitud ? String(row.longitud) : null,
          latitud_pais: row.latitud_pais ? String(row.latitud_pais) : null,
          longitud_pais: row.longitud_pais ? String(row.longitud_pais) : null
        },
        transaction: t
      });

      const inst = await buscarInstitucion(null, row.institucion_academica);
      const carr = await buscarCarrera(null, row.carrera);

      await findOrCreateEstudio({
        id_becario: idBecario,
        id_estatus: 1, // ACTIVO
        id_institucion: inst.id,
        id_carrera: carr.id,
        institucion_nombre: inst.nombre,
        carrera_nombre: carr.nombre,
        anio_ingreso: extraerAnio(row.anio_ingreso),
        semestre_actual: row.semestre_actual
      }, t);

      // Documentos
      const docs = [];
      if (row.anexo_cedula) docs.push({ id_becario: idBecario, id_tipo_documento: 1, ruta_archivo: row.anexo_cedula });
      if (row.anexo_foto) docs.push({ id_becario: idBecario, id_tipo_documento: 4, ruta_archivo: row.anexo_foto });
      
      if (docs.length > 0) {
        await insertDocumentosSinDuplicar(idBecario, docs, t);
      }

      await t.commit();
      count++;
    } catch (error) {
      await t.rollback();
      console.error(`Error migrando becario EXT ${row.cedula}:`, error.message);
    }
  }
  console.log(`âœ… ${count} becarios en el exterior migrados.`);
}

async function migrarEgresados() {
  console.log('ðŸŽ“ Migrando Egresados...');
  const res = await legacyPool.query('SELECT * FROM datos_egresados');
  
  let count = 0;
  for (const row of res.rows) {
    const t = await sequelize.transaction();
    try {
      const tipoBecario = row.becario_tipo === 'internacional' ? 3 : 1;

      const { cedula, nacionalidad } = parseCedula(row.cedula);
      if (!cedula) throw new Error("CÃ©dula nula");

      const { nombres, apellidos } = procesarNombres(row.nombre_completo);

      const [{ id: idBecario }] = await BecarioUnificado.findOrCreate({
        where: { cedula: cedula },
        defaults: {
          id_tipo_becario: tipoBecario,
          id_usuario_legacy: row.id_usuario,
          nombres: nombres,
          apellidos: apellidos,
          nacionalidad: nacionalidad,
          correo: row.correo,
          telefono_principal: row.telefono_celular,
          fecha_nacimiento: row.fecha_nacimiento,
          estado: padCode(row.cod_estado || row.codigoestado, 2),
          municipio: padCode(row.codigomunicipio, 4),
          parroquia: padCode(row.codigoparroquia, 6),
          comuna: row.comuna || null,
          direccion: row.direccion,
          es_militar: row.es_militar,
          latitud: row.latitud ? String(row.latitud) : null,
          longitud: row.longitud ? String(row.longitud) : null,
          latitud_pais: row.latitud_pais ? String(row.latitud_pais) : null,
          longitud_pais: row.longitud_pais ? String(row.longitud_pais) : null
        },
        transaction: t
      });

      const inst = await buscarInstitucion(null, row.universidad);
      const carr = await buscarCarrera(null, row.carrera_cursada);

      await findOrCreateEstudio({
        id_becario: idBecario,
        id_estatus: 2, // EGRESADO
        id_institucion: inst.id,
        id_carrera: carr.id,
        institucion_nombre: inst.nombre,
        carrera_nombre: carr.nombre,
        fecha_egreso: row.fecha_egreso,
        tipo_beca: row.tipo_beca,
        estado_estudio: row.titularidad,
        idiomas: row.idiomas,
        ocupacion_actual: row.ocupacion_actual,
        trabajando: row.trabajando
      }, t);

      await t.commit();
      count++;
    } catch (error) {
      await t.rollback();
      console.error(`Error migrando egresado ${row.cedula}:`, error.message);
    }
  }
  console.log(`âœ… ${count} egresados migrados.`);
}
async function runMigration() {
  try {
    console.log('================================================================');
    console.log('ðŸš€ INICIANDO MIGRACIÃ“N DE DATOS (Sprint 2 - V1 a V2 con Sequelize)');
    console.log(`ðŸ—„ï¸ Fuente LEGACY_DB_NAME=${LEGACY_DB_NAME}`);
    console.log('================================================================');
    
    await sequelize.authenticate();
    
    await migrarUsuarios();
    await migrarBecariosNacionales();
    await migrarBecariosExterior();
    await migrarEgresados();
    
    console.log('================================================================');
    console.log('ðŸŽ‰ MIGRACIÃ“N COMPLETA Y EXITOSA.');
    console.log(`Los datos han sido normalizados e insertados en ${NEW_DB_NAME}.`);
    console.log('================================================================');

  } catch (err) {
    console.error('âŒ Error general durante la migraciÃ³n:', err);
  } finally {
    await legacyPool.end();
    process.exit(0);
  }
}

runMigration();


