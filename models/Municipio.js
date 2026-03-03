const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Municipio = sequelize.define('Municipio', {
  codigomunicipio: {
    type: DataTypes.STRING(250),
    primaryKey: true,
    allowNull: false
  },
  codigoestado: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  longitud: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  latitud: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tbl_municipio',
  timestamps: false
});

module.exports = Municipio;
