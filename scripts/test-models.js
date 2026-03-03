const {
  sequelize,
  BecarioUnificado,
  EstudioBecario,
  DocumentoBecario,
  CatTipoBecario,
  CatEstatusAcademico,
  CatTipoDocumento,
  Usuario
} = require('../models');

async function testModels() {
  const t = await sequelize.transaction();
  try {
    await sequelize.authenticate();

    const estatusActivo = await CatEstatusAcademico.findOne({ where: { codigo: 'ACTIVO' }, transaction: t });
    const tipoDocCedula = await CatTipoDocumento.findOne({ where: { id: 1 }, transaction: t });
    const analista = await Usuario.findOne({ where: { id_rol: 2 }, transaction: t });

    if (!estatusActivo) throw new Error('No existe estatus ACTIVO');
    if (!tipoDocCedula) throw new Error('No existe tipo documento id=1');

    const beforeVen = await BecarioUnificado.scope('venezolanos').count({ transaction: t });
    const beforeExt = await BecarioUnificado.scope('exterior').count({ transaction: t });
    const beforeFor = await BecarioUnificado.scope('extranjeros').count({ transaction: t });

    const ven = await BecarioUnificado.create({
      id_tipo_becario: 1,
      registrado_por: analista ? analista.id : null,
      cedula: 'TST-S3-1001',
      nombres: 'Test',
      apellidos: 'Venezolano',
      correo: 'test.s3.ven@example.com'
    }, { transaction: t });

    await EstudioBecario.create({
      id_becario: ven.id,
      id_estatus: estatusActivo.id,
      institucion_nombre: 'Institucion Test',
      carrera_nombre: 'Carrera Test'
    }, { transaction: t });

    await DocumentoBecario.create({
      id_becario: ven.id,
      id_tipo_documento: tipoDocCedula.id,
      ruta_archivo: '/tmp/test-s3-cedula.pdf'
    }, { transaction: t });

    await BecarioUnificado.create({
      id_tipo_becario: 2,
      cedula: 'TST-S3-2001',
      nombres: 'Test',
      apellidos: 'Exterior',
      correo: 'test.s3.ext@example.com'
    }, { transaction: t });

    await BecarioUnificado.create({
      id_tipo_becario: 3,
      cedula: 'TST-S3-3001',
      nombres: 'Test',
      apellidos: 'Extranjero',
      correo: 'test.s3.for@example.com'
    }, { transaction: t });

    const joined = await BecarioUnificado.findOne({
      where: { id: ven.id },
      include: [
        { model: CatTipoBecario, as: 'tipo' },
        { model: EstudioBecario, as: 'estudios', include: [{ model: CatEstatusAcademico, as: 'estatus_registro' }] },
        { model: DocumentoBecario, as: 'documentos', include: [{ model: CatTipoDocumento, as: 'tipo_documento' }] }
      ],
      transaction: t
    });

    if (!joined || !joined.tipo || joined.estudios.length === 0 || joined.documentos.length === 0) {
      throw new Error('Fallo en asociaciones include/join');
    }

    const afterVen = await BecarioUnificado.scope('venezolanos').count({ transaction: t });
    const afterExt = await BecarioUnificado.scope('exterior').count({ transaction: t });
    const afterFor = await BecarioUnificado.scope('extranjeros').count({ transaction: t });

    if (afterVen !== beforeVen + 1 || afterExt !== beforeExt + 1 || afterFor !== beforeFor + 1) {
      throw new Error('Scopes no filtran correctamente por tipo');
    }

    console.log('OK: authenticate, asociaciones y scopes validados');
    await t.rollback();
    console.log('OK: rollback aplicado (sin cambios persistentes)');
  } catch (error) {
    await t.rollback();
    console.error('ERROR test-models:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testModels();
