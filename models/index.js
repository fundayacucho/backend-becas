const { sequelize } = require('../config/database');

// 1. Importar todos los Modelos
const CatRoles = require('./CatRoles');
const CatTipoBecario = require('./CatTipoBecario');
const CatEstatusAcademico = require('./CatEstatusAcademico');
const CatTipoDocumento = require('./CatTipoDocumento');
const Usuario = require('./Usuario');
const BecarioUnificado = require('./BecarioUnificado');
const EstudioBecario = require('./EstudioBecario');
const DocumentoBecario = require('./DocumentoBecario');
const InfoMigratoria = require('./InfoMigratoria');

// Modelos Geográficos (Lectura)
const Estado = require('./Estado');
const Municipio = require('./Municipio');
const Parroquia = require('./Parroquia');
const Pais = require('./Pais');
const Uner = require('./Uner');
const Carrera = require('./Carrera');
const TipoRegistro = require('./TipoRegistro');


// 2. Establecer Asociaciones (Relaciones entre tablas)

// Usuario y Roles (Ya definida en modelo, pero bueno reafirmar o extender aquí no hace daño)
// Usuario.belongsTo(CatRoles, { foreignKey: 'id_rol', as: 'rol' }); 

// Becario ↔ Catálogo Tipo
BecarioUnificado.belongsTo(CatTipoBecario, { foreignKey: 'id_tipo_becario', as: 'tipo' });

// Becario ↔ Usuario Analyst (Quien lo registró)
BecarioUnificado.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'analista' });

// Becario ↔ Estudio
BecarioUnificado.hasMany(EstudioBecario, { foreignKey: 'id_becario', as: 'estudios', onDelete: 'CASCADE' });
EstudioBecario.belongsTo(BecarioUnificado, { foreignKey: 'id_becario' });

// Estudio ↔ Estatus Académico 
EstudioBecario.belongsTo(CatEstatusAcademico, { foreignKey: 'id_estatus', as: 'estatus_registro' });

// Becario ↔ Documentos
BecarioUnificado.hasMany(DocumentoBecario, { foreignKey: 'id_becario', as: 'documentos', onDelete: 'CASCADE' });
DocumentoBecario.belongsTo(BecarioUnificado, { foreignKey: 'id_becario' });
DocumentoBecario.belongsTo(CatTipoDocumento, { foreignKey: 'id_tipo_documento', as: 'tipo_documento' });

// Becario ↔ Info Migratoria
BecarioUnificado.hasOne(InfoMigratoria, { foreignKey: 'id_becario', as: 'info_migratoria', onDelete: 'CASCADE' });
InfoMigratoria.belongsTo(BecarioUnificado, { foreignKey: 'id_becario' });

module.exports = {
  sequelize,
  CatRoles,
  CatTipoBecario,
  CatEstatusAcademico,
  CatTipoDocumento,
  Usuario,
  BecarioUnificado,
  EstudioBecario,
  DocumentoBecario,
  InfoMigratoria,
  Estado,
  Municipio,
  Parroquia,
  Pais,
  Uner,
  Carrera,
  TipoRegistro
};

