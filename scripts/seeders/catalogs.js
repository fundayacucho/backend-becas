const {
  CatRoles,
  CatTipoBecario,
  CatEstatusAcademico,
  CatTipoDocumento
} = require('../../models/index');

async function poblarCatalogos() {
  console.log('Poblando catalogos genericos...');

  // Roles de autenticacion (mapeo requerido por arquitectura)
  await CatRoles.bulkCreate([
    { id: 1, codigo: 'ESTUDIANTE', nombre: 'Estudiante', descripcion: 'Rol solo lectura de su perfil' },
    { id: 2, codigo: 'ANALISTA', nombre: 'Analista', descripcion: 'Registra, lista y actualiza becarios de su dependencia' },
    { id: 3, codigo: 'SUPERVISOR', nombre: 'Supervisor', descripcion: 'Aprueba gestiones y vistas panoramicas' },
    { id: 4, codigo: 'ADMIN', nombre: 'Administrador', descripcion: 'Control total de la plataforma' }
  ], { ignoreDuplicates: true });

  // Tipos de becarios
  await CatTipoBecario.bulkCreate([
    { id: 1, codigo: 'VEN_VEN', descripcion: 'Becarios nacionales (en Venezuela)' },
    { id: 2, codigo: 'VEN_EXT', descripcion: 'Becarios en el exterior' },
    { id: 3, codigo: 'EXT_VEN', descripcion: 'Becarios extranjeros estudiando en Venezuela' }
  ], { ignoreDuplicates: true });

  // Estatus academico completo segun propuesta
  await CatEstatusAcademico.bulkCreate([
    { id: 1, codigo: 'ACTIVO', descripcion: 'Estudios en curso' },
    { id: 2, codigo: 'EGRESADO', descripcion: 'Graduado y culminado' },
    { id: 3, codigo: 'RETIRADO', descripcion: 'Retirado de estudios' },
    { id: 4, codigo: 'SUSPENDIDO', descripcion: 'Suspendido o congelado' }
  ], { ignoreDuplicates: true });

  await CatTipoDocumento.bulkCreate([
    { id: 1, nombre: 'Cedula de Identidad Anverso/Reverso' },
    { id: 2, nombre: 'Constancia de Estudios' },
    { id: 3, nombre: 'Constancia de Residencia' },
    { id: 4, nombre: 'Foto Tipo Carnet' },
    { id: 5, nombre: 'Pasaporte Completo' },
    { id: 6, nombre: 'Visa' },
    { id: 7, nombre: 'Contrato de Convenio de Beca' }
  ], { ignoreDuplicates: true });

  console.log('Catalogos genericos poblados exitosamente');
}

module.exports = { poblarCatalogos };
