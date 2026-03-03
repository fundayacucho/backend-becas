const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CatEstatusAcademico = sequelize.define('CatEstatusAcademico', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'cat_estatus_academico',
  timestamps: false
});

module.exports = CatEstatusAcademico;
