const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BecarioUnificado = require('./BecarioUnificado');
const CatEstatusAcademico = require('./CatEstatusAcademico');

const EstudioBecario = sequelize.define('EstudioBecario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_becario: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BecarioUnificado,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_estatus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CatEstatusAcademico,
      key: 'id'
    }
  },
  id_institucion: {
    type: DataTypes.INTEGER,
    allowNull: true // Puede ser null para extranjeros o exteriores que no traen ID exacto
  },
  id_carrera: {
    type: DataTypes.INTEGER,
    allowNull: true // Puede ser null
  },
  institucion_nombre: { type: DataTypes.STRING(250) },
  carrera_nombre: { type: DataTypes.STRING(250) },
  anio_ingreso: { type: DataTypes.INTEGER },
  semestre_actual: { type: DataTypes.STRING(50) },
  turno_estudio: { type: DataTypes.STRING(100) },
  modalidad_estudio: { type: DataTypes.STRING(100) },
  nivel_academico: { type: DataTypes.STRING(150) },
  estado_estudio: { type: DataTypes.STRING(150) },
  fecha_egreso: { type: DataTypes.DATEONLY },
  tipo_beca: { type: DataTypes.STRING(150) },
  idiomas: { type: DataTypes.STRING(200) },
  ocupacion_actual: { type: DataTypes.STRING(150) },
  trabajando: { type: DataTypes.STRING(50) }
}, {
  tableName: 'estudios_becario',
  timestamps: true
});

module.exports = EstudioBecario;
