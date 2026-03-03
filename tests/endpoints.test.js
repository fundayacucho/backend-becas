const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../app');
const { sequelize } = require('../models');

jest.setTimeout(30000);

const app = createApp();

function expectObjectWithKeys(obj, requiredKeys) {
  expect(obj).toBeTruthy();
  requiredKeys.forEach((key) => {
    expect(Object.prototype.hasOwnProperty.call(obj, key)).toBe(true);
  });
}

async function getUserByRoleCode(roleCode) {
  const rows = await sequelize.query(
    `
      SELECT u.id, u.email, r.codigo AS rol_codigo
      FROM usuarios u
      INNER JOIN cat_roles r ON r.id = u.id_rol
      WHERE r.codigo = $1
      LIMIT 1
    `,
    { bind: [roleCode], type: sequelize.QueryTypes.SELECT }
  );
  return rows[0] || null;
}

async function getAnyNonAdminUser() {
  const rows = await sequelize.query(
    `
      SELECT u.id, u.email, r.codigo AS rol_codigo
      FROM usuarios u
      INNER JOIN cat_roles r ON r.id = u.id_rol
      WHERE r.codigo <> 'ADMIN'
      LIMIT 1
    `,
    { type: sequelize.QueryTypes.SELECT }
  );
  return rows[0] || null;
}

async function getUserByRoleCodes(roleCodes = []) {
  const rows = await sequelize.query(
    `
      SELECT u.id, u.email, r.codigo AS rol_codigo
      FROM usuarios u
      INNER JOIN cat_roles r ON r.id = u.id_rol
      WHERE r.codigo = ANY($1)
      LIMIT 1
    `,
    { bind: [roleCodes], type: sequelize.QueryTypes.SELECT }
  );
  return rows[0] || null;
}

function buildToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado para pruebas');
  }
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });
}

describe('Regression API contract', () => {
  test('GET /api/becarios/becarios mantiene estructura legacy', async () => {
    const res = await request(app).get('/api/becarios/becarios?estado=&municipio=&parroquia=');
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expectObjectWithKeys(res.body[0], [
        'id_becario',
        'cedula',
        'nombres_apellidos',
        'programa_estudio'
      ]);
    }
  });

  test('GET /api/becarios/get_becario?id=X mantiene formato de detalle', async () => {
    const listRes = await request(app).get('/api/becarios/becarios?estado=&municipio=&parroquia=');
    expect([200, 404]).toContain(listRes.statusCode);
    if (listRes.statusCode !== 200 || !Array.isArray(listRes.body) || listRes.body.length === 0) {
      return;
    }

    const targetId = listRes.body[0].id_usuario;
    const detailRes = await request(app).get(`/api/becarios/get_becario?id=${targetId}`);
    expect([200, 404]).toContain(detailRes.statusCode);

    if (detailRes.statusCode === 200) {
      expectObjectWithKeys(detailRes.body, [
        'id_becario',
        'id_usuario',
        'nombres_apellidos',
        'cedula',
        'correo'
      ]);
    }
  });

  test('POST /api/auth/login retorna rol_codigo en respuesta de exito', async () => {
    const email = process.env.E2E_ADMIN_EMAIL || process.env.E2E_ANALYST_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_ANALYST_PASSWORD;
    if (!email || !password) {
      return;
    }

    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('rol_codigo');
  });
});

describe('Security and authorization', () => {
  test('GET /api/auth/getUsuarios con token no ADMIN retorna 403', async () => {
    const nonAdmin = (await getUserByRoleCode('ANALISTA')) || (await getAnyNonAdminUser());
    expect(nonAdmin).toBeTruthy();

    const token = buildToken(nonAdmin);
    const res = await request(app)
      .get('/api/auth/getUsuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  test('POST /api/becarios/registro con token ANALISTA retorna 200/201', async () => {
    const analyst = (await getUserByRoleCode('ANALISTA')) || (await getAnyNonAdminUser());
    expect(analyst).toBeTruthy();

    const token = buildToken(analyst);
    const suffix = Date.now().toString().slice(-6);

    const res = await request(app)
      .post('/api/becarios/registro')
      .set('Authorization', `Bearer ${token}`)
      .field('id_usuario', String(990100 + Number(suffix)))
      .field('nombresApellidos', 'Jest Analista Registro')
      .field('cedula', `77${suffix}`)
      .field('fechaNacimiento', '2001-01-01')
      .field('genero', 'Masculino')
      .field('nacionalidad', 'Venezolano')
      .field('correo', `jest.analista.${suffix}@test.com`)
      .field('telefonoPrincipal', '04120009999')
      .field('direccion', 'Direccion prueba jest')
      .field('institucion', '11')
      .field('programaEstudio', '1')
      .field('anioIngreso', '2024')
      .field('semestreActual', '1')
      .field('codigoestado', '01')
      .field('codigomunicipio', '0101')
      .field('codigoparroquia', '010101')
      .field('latitud', '10.50')
      .field('longitud', '-66.90');

    expect([200, 201]).toContain(res.statusCode);
  });
});

describe('New unified upsert endpoint by type', () => {
  test('POST /api/becarios/upsert-por-tipo tipo VEN_VEN registra/actualiza', async () => {
    const suffix = Date.now().toString().slice(-6);
    const res = await request(app)
      .post('/api/becarios/upsert-por-tipo')
      .field('tipo_becario', 'VEN_VEN')
      .field('id_usuario', String(991100 + Number(suffix)))
      .field('nombresApellidos', 'Jest Unified VEN')
      .field('cedula', `66${suffix}`)
      .field('fechaNacimiento', '2002-01-01')
      .field('genero', 'Femenino')
      .field('nacionalidad', 'Venezolano')
      .field('correo', `jest.unified.ven.${suffix}@test.com`)
      .field('telefonoPrincipal', '04120001000')
      .field('direccion', 'Direccion unified VEN')
      .field('institucion', '11')
      .field('programaEstudio', '1')
      .field('anioIngreso', '2024')
      .field('semestreActual', '2')
      .field('codigoestado', '01')
      .field('codigomunicipio', '0101')
      .field('codigoparroquia', '010101');

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('tipo_becario', 'VEN_VEN');
  });

  test('POST /api/becarios/upsert-por-tipo tipo VEN_EXT registra/actualiza', async () => {
    const suffix = Date.now().toString().slice(-6);
    const res = await request(app)
      .post('/api/becarios/upsert-por-tipo')
      .field('tipo_becario', 'VEN_EXT')
      .field('id_usuario', String(992100 + Number(suffix)))
      .field('nombresApellidos', 'Jest Unified Exterior')
      .field('cedula', `65${suffix}`)
      .field('pasaporte', `P65${suffix}`)
      .field('fechaNacimiento', '2001-05-12')
      .field('genero', 'Masculino')
      .field('nacionalidad', 'Venezolano')
      .field('correo', `jest.unified.ext.${suffix}@test.com`)
      .field('telefonoPrincipal', '04120001001')
      .field('institucion_academica', '11')
      .field('carrera', '1')
      .field('anioIngreso', '2023')
      .field('semestreActual', '4')
      .field('codigoestado', '01')
      .field('codigomunicipio', '0101')
      .field('codigoparroquia', '010101');

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('tipo_becario', 'VEN_EXT');
  });

  test('POST /api/becarios/upsert-por-tipo tipo EGRESADO registra/actualiza', async () => {
    const suffix = Date.now().toString().slice(-6);
    const res = await request(app)
      .post('/api/becarios/upsert-por-tipo')
      .field('tipo_becario', 'EGRESADO')
      .field('id_usuario', String(993100 + Number(suffix)))
      .field('nombre_completo', 'Jest Unified Egresado')
      .field('cedula', `64${suffix}`)
      .field('correo', `jest.unified.egr.${suffix}@test.com`)
      .field('telefono_celular', '04120001002')
      .field('fecha_nacimiento', '1999-02-10')
      .field('tipo_beca', 'Internacional')
      .field('carrera_cursada', '1')
      .field('fecha_egreso', '2025-06-01')
      .field('titularidad', 'Pre-grado')
      .field('universidad', '11')
      .field('becario_tipo', 'nacional')
      .field('codigoestado', '01')
      .field('codigomunicipio', '0101')
      .field('codigoparroquia', '010101');

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('tipo_becario', 'EGRESADO');
  });

  test('POST/PUT /api/becarios/upsert-por-tipo tipo EXT_VEN registra y actualiza', async () => {
    const suffix = Date.now().toString().slice(-6);
    const createRes = await request(app)
      .post('/api/becarios/upsert-por-tipo')
      .field('tipo_becario', 'EXT_VEN')
      .field('id_usuario', String(994100 + Number(suffix)))
      .field('nombresApellidos', 'Jest Unified Extranjero')
      .field('cedula', `63${suffix}`)
      .field('pasaporte', `X63${suffix}`)
      .field('fechaNacimiento', '2000-03-15')
      .field('genero', 'Masculino')
      .field('nacionalidad', 'Extranjero')
      .field('correo', `jest.unified.extven.${suffix}@test.com`)
      .field('telefonoPrincipal', '04120001003')
      .field('pais_origen', 'Cuba')
      .field('institucion', '11')
      .field('programaEstudio', '1')
      .field('anioIngreso', '2024')
      .field('semestreActual', '2')
      .field('statusVisa', 'VIGENTE')
      .field('codigoestado', '01')
      .field('codigomunicipio', '0101')
      .field('codigoparroquia', '010101');

    expect([200, 201]).toContain(createRes.statusCode);
    expect(createRes.body).toHaveProperty('tipo_becario', 'EXT_VEN');

    const updateId = createRes.body?.becario?.id_becario || createRes.body?.becario?.id_usuario;
    expect(updateId).toBeTruthy();

    const updateRes = await request(app)
      .put(`/api/becarios/upsert-por-tipo/${updateId}`)
      .field('tipo_becario', 'EXT_VEN')
      .field('statusVisa', 'POR_VENCER')
      .field('observaciones', 'Actualizacion desde test unified');

    expect([200, 201]).toContain(updateRes.statusCode);
    expect(updateRes.body).toHaveProperty('tipo_becario', 'EXT_VEN');
  });
});

describe('Constancias internacionales module', () => {
  test('GET /api/constancias-internacionales/placeholders con token permitido retorna 200', async () => {
    const user = await getUserByRoleCodes(['ANALISTA', 'SUPERVISOR', 'ADMIN']);
    expect(user).toBeTruthy();

    const token = buildToken(user);
    const res = await request(app)
      .get('/api/constancias-internacionales/placeholders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body?.placeholders)).toBe(true);
    expect(res.body.placeholders.length).toBeGreaterThan(0);
  });

  test('PUT /api/constancias-internacionales/template con token ANALISTA retorna 403', async () => {
    const analyst = await getUserByRoleCode('ANALISTA');
    if (!analyst) return;

    const token = buildToken(analyst);
    const res = await request(app)
      .put('/api/constancias-internacionales/template')
      .set('Authorization', `Bearer ${token}`)
      .send({
        template: {
          nombre: 'Plantilla prueba',
          encabezado: 'TEST',
          subtitulo: 'TEST',
          ciudad_fecha: 'Caracas, {{fecha_emision}}',
          cuerpo: ['Linea test'],
          firma: 'Firma test',
          pie: 'Pie test'
        }
      });

    expect(res.statusCode).toBe(403);
  });

  test('POST /api/constancias-internacionales/preview con token permitido retorna html', async () => {
    const user = await getUserByRoleCodes(['ANALISTA', 'SUPERVISOR', 'ADMIN']);
    expect(user).toBeTruthy();

    const token = buildToken(user);
    const res = await request(app)
      .post('/api/constancias-internacionales/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: {
          nombre_becario: 'Becario Test',
          cedula: '12345678',
          fecha_emision: '2026-03-03'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(typeof res.body?.html).toBe('string');
    expect(res.body.html).toContain('<!doctype html>');
  });

  test('POST /api/constancias-internacionales/generate format=pdf retorna PDF binario', async () => {
    const user = await getUserByRoleCodes(['ANALISTA', 'SUPERVISOR', 'ADMIN']);
    expect(user).toBeTruthy();

    const token = buildToken(user);
    const res = await request(app)
      .post('/api/constancias-internacionales/generate?format=pdf&download=1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: {
          nombre_becario: 'Becario PDF',
          cedula: '87654321',
          fecha_emision: '2026-03-03'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(String(res.headers['content-type'] || '')).toContain('application/pdf');
  });
});

afterAll(async () => {
  await sequelize.close();
});
