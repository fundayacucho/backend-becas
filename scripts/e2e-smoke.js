/* eslint-disable no-console */
require('dotenv').config();

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';

function buildUrl(path) {
  return `${BASE_URL}${path}`;
}

async function requestJson(path, options = {}) {
  const res = await fetch(buildUrl(path), options);
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function testReadEndpoints() {
  const readResults = {};

  const ven = await requestJson('/api/becarios/becarios?estado=&municipio=&parroquia=');
  assert(ven.res.status === 200, `GET becarios esperado 200, recibido ${ven.res.status}`);
  assert(Array.isArray(ven.body), 'GET becarios debe devolver arreglo');
  assert(ven.body.length > 0, 'GET becarios no devolvio registros');
  readResults.venCount = ven.body.length;

  const venId = ven.body[0].id_usuario;
  const venDet = await requestJson(`/api/becarios/get_becario?id=${venId}`);
  assert(venDet.res.status === 200, `GET detalle becario esperado 200, recibido ${venDet.res.status}`);

  const ext = await requestJson('/api/becarios/get_becarioesterior?estado=&municipio=&parroquia=');
  assert(ext.res.status === 200, `GET becarios exterior esperado 200, recibido ${ext.res.status}`);
  assert(Array.isArray(ext.body), 'GET becarios exterior debe devolver arreglo');
  assert(ext.body.length > 0, 'GET becarios exterior no devolvio registros');
  readResults.extCount = ext.body.length;

  const extId = ext.body[0].id_usuario;
  const extDet = await requestJson(`/api/becarios/get_becario_esteriol?id=${extId}`);
  assert(extDet.res.status === 200, `GET detalle exterior esperado 200, recibido ${extDet.res.status}`);

  const egr = await requestJson('/api/becarios/egresado?estado=&municipio=&parroquia=');
  assert(egr.res.status === 200, `GET egresados esperado 200, recibido ${egr.res.status}`);
  assert(Array.isArray(egr.body), 'GET egresados debe devolver arreglo');
  assert(egr.body.length > 0, 'GET egresados no devolvio registros');
  readResults.egrCount = egr.body.length;

  const egrId = egr.body[0].id_usuario;
  const egrDet = await requestJson(`/api/becarios/get_egresado?id=${egrId}`);
  assert(egrDet.res.status === 200, `GET detalle egresado esperado 200, recibido ${egrDet.res.status}`);

  const uner = await requestJson('/api/becarios/uner?estado=01');
  assert(uner.res.status === 200, `GET uner esperado 200, recibido ${uner.res.status}`);
  assert(Array.isArray(uner.body), 'GET uner debe devolver arreglo');
  readResults.unerCount = uner.body.length;

  const pais = await requestJson('/api/becarios/tbl_pais');
  assert(pais.res.status === 200, `GET tbl_pais esperado 200, recibido ${pais.res.status}`);
  assert(Array.isArray(pais.body), 'GET tbl_pais debe devolver arreglo');
  readResults.paisCount = pais.body.length;

  const carr = await requestJson('/api/becarios/carreras?codigo=11');
  assert(carr.res.status === 200, `GET carreras esperado 200, recibido ${carr.res.status}`);
  assert(Array.isArray(carr.body), 'GET carreras debe devolver arreglo');
  readResults.carrCount = carr.body.length;

  const extranjeros = await requestJson('/api/extranjeros/listar?estado=&municipio=&parroquia=');
  assert(extranjeros.res.status === 200, `GET extranjeros/listar esperado 200, recibido ${extranjeros.res.status}`);
  assert(Array.isArray(extranjeros.body), 'GET extranjeros/listar debe devolver arreglo');
  assert(extranjeros.body.length > 0, 'GET extranjeros/listar no devolvio registros');
  readResults.extVenCount = extranjeros.body.length;

  const extVenId = extranjeros.body[0].id_usuario || extranjeros.body[0].id_becario;
  const extVenDet = await requestJson(`/api/extranjeros/detalle?id=${extVenId}`);
  assert(extVenDet.res.status === 200, `GET extranjeros/detalle esperado 200, recibido ${extVenDet.res.status}`);

  return readResults;
}

async function postMultipart(path, payload) {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => form.append(k, v));
  return requestJson(path, { method: 'POST', body: form });
}

async function testWriteEndpoints() {
  const now = Date.now().toString().slice(-6);

  const venPayload = {
    id_usuario: '990001',
    nombresApellidos: 'E2E Test Venezuela',
    cedula: `88${now}`,
    fechaNacimiento: '2000-01-01',
    genero: 'Masculino',
    nacionalidad: 'Venezolano',
    correo: `e2e.ven.${now}@test.com`,
    telefonoPrincipal: '04120000000',
    telefonoAlternativo: '04120000001',
    direccion: 'Direccion E2E',
    institucion: '11',
    programaEstudio: '1',
    anioIngreso: '2023',
    semestreActual: '3',
    turnoEstudio: 'diurno',
    modalidadEstudio: 'presencial',
    programaBeca: 'universidad',
    estadoBeca: 'activo',
    codigoestado: '01',
    codigomunicipio: '0101',
    codigoparroquia: '010101',
    latitud: '10.5',
    longitud: '-66.9'
  };

  const ven = await postMultipart('/api/becarios/registro', venPayload);
  assert([200, 201].includes(ven.res.status), `POST registro becario esperado 200/201, recibido ${ven.res.status}`);

  const extPayload = {
    id_usuario: '990002',
    nombresApellidos: 'E2E Test Exterior',
    cedula: `89${now}`,
    pasaporte: `P89${now}`,
    fechaNacimiento: '1998-05-12',
    genero: 'Femenino',
    nacionalidad: 'Venezolano',
    correo: `e2e.ext.${now}@test.com`,
    telefonoPrincipal: '04120000002',
    telefonoAlternativo: '04120000003',
    nombre_representante: 'Representante E2E',
    parentesco: 'Madre',
    pais_procedencia: 'Argentina',
    institucion_academica: '11',
    carrera: '1',
    anioIngreso: '2022',
    semestreActual: '4',
    codigoestado: '01',
    codigomunicipio: '0101',
    codigoparroquia: '010101',
    latitud: '10.5',
    longitud: '-66.9',
    latitud_pais: '-34.6',
    longitud_pais: '-58.4'
  };

  const ext = await postMultipart('/api/becarios/registroBecarioExteriol', extPayload);
  assert([200, 201].includes(ext.res.status), `POST registro exterior esperado 200/201, recibido ${ext.res.status}`);

  const extDelete = await requestJson('/api/becarios/delete_becario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: '990002' })
  });
  assert(extDelete.res.status === 200, `POST delete exterior esperado 200, recibido ${extDelete.res.status}`);

  const egrPayload = {
    id_usuario: '990003',
    nombre_completo: 'E2E Test Egresado',
    cedula: `87${now}`,
    correo: `e2e.egr.${now}@test.com`,
    telefono_celular: '04120000004',
    fecha_nacimiento: '1997-02-11',
    tipo_beca: 'Internacional',
    carrera_cursada: 'Ingenieria de Prueba',
    fecha_egreso: '2025-07-01',
    titularidad: 'Pre-grado',
    idiomas: 'ES',
    ocupacion_actual: 'Trabajando',
    universidad: '11',
    becario_tipo: 'nacional',
    descripcion_becario: 'Observacion test',
    codigoestado: '01',
    codigomunicipio: '0101',
    codigoparroquia: '010101',
    latitud: '10.5',
    longitud: '-66.9',
    direccion: 'Dir test',
    es_militar: 'No',
    trabajando: 'si'
  };

  const egr = await requestJson('/api/egresado/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(egrPayload)
  });
  assert([200, 201].includes(egr.res.status), `POST register egresado esperado 200/201, recibido ${egr.res.status}`);

  const extVenPayload = {
    id_usuario: '990004',
    nombresApellidos: 'E2E Test Extranjero',
    cedula: `86${now}`,
    pasaporte: `XP86${now}`,
    fechaNacimiento: '1999-03-15',
    genero: 'Masculino',
    nacionalidad: 'Extranjero',
    correo: `e2e.extven.${now}@test.com`,
    telefonoPrincipal: '04120000005',
    telefonoAlternativo: '04120000006',
    direccion: 'Direccion extranjero E2E',
    pais_origen: 'Cuba',
    codigoestado: '01',
    codigomunicipio: '0101',
    codigoparroquia: '010101',
    latitud: '10.5',
    longitud: '-66.9',
    institucion: '11',
    programaEstudio: '1',
    anioIngreso: '2024',
    semestreActual: '2',
    nivelAcademico: 'PREGRADO',
    estadoEstudio: 'ACTIVO',
    fechaVencimientoPasaporte: '2028-01-01',
    estatusPasaporte: 'VIGENTE',
    visaNumero: `VISA${now}`,
    fechaVencimientoVisa: '2027-01-01',
    statusVisa: 'VIGENTE',
    sedeResidencia: 'Caracas',
    observaciones: 'Registro smoke E2E'
  };

  const extVen = await postMultipart('/api/extranjeros/registro', extVenPayload);
  assert([200, 201].includes(extVen.res.status), `POST extranjeros/registro esperado 200/201, recibido ${extVen.res.status}`);
  const extVenId = extVen.body?.becario?.id_becario || extVen.body?.becario?.id_usuario || extVenPayload.id_usuario;

  const extVenUpdate = await requestJson(`/api/extranjeros/actualizar/${extVenId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      estadoEstudio: 'ACTIVO',
      statusVisa: 'POR_VENCER',
      observaciones: 'Actualizado smoke E2E'
    })
  });
  assert([200, 201].includes(extVenUpdate.res.status), `PUT extranjeros/actualizar esperado 200/201, recibido ${extVenUpdate.res.status}`);

  const extVenDelete = await requestJson(`/api/extranjeros/eliminar/${extVenId}`, {
    method: 'DELETE'
  });
  assert(extVenDelete.res.status === 200, `DELETE extranjeros/eliminar esperado 200, recibido ${extVenDelete.res.status}`);
}

async function testAdminAuthProtected() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('SKIP auth/getUsuarios: define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para validar ruta protegida.');
    return;
  }

  const login = await requestJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert(login.res.status === 200, `Login admin esperado 200, recibido ${login.res.status}`);
  assert(login.body && login.body.token, 'Login admin no devolvio token');
  const rolCodigo = login.body?.user?.rol_codigo || null;
  if (rolCodigo !== 'ADMIN') {
    console.log(
      `SKIP auth/getUsuarios: credenciales E2E autenticaron con rol ${rolCodigo || 'N/A'} (se requiere ADMIN).`
    );
    return;
  }

  const usuarios = await requestJson('/api/auth/getUsuarios', {
    headers: { Authorization: `Bearer ${login.body.token}` }
  });
  assert(usuarios.res.status === 200, `GET /auth/getUsuarios esperado 200, recibido ${usuarios.res.status}`);
  assert(Array.isArray(usuarios.body), 'GET /auth/getUsuarios debe devolver arreglo');
}

async function main() {
  console.log(`E2E smoke against: ${BASE_URL}`);
  const read = await testReadEndpoints();
  await testWriteEndpoints();
  await testAdminAuthProtected();
  console.log('E2E smoke OK', read);
}

main().catch((err) => {
  console.error('E2E smoke FAILED:', err.message);
  process.exit(1);
});
