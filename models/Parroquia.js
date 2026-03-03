const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Parroquia = sequelize.define('Parroquia', {
  codigoparroquia: {
    type: DataTypes.STRING(250),
    primaryKey: true,
    allowNull: false
  },
  codigoestado: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  codigomunicipio: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  prioridad: {
    type: DataTypes.INTEGER,
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
  tableName: 'tbl_parroquia',
  timestamps: false
});

module.exports = Parroquia;
