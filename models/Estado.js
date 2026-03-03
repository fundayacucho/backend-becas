const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Estado = sequelize.define('Estado', {
  codigoestado: {
    type: DataTypes.STRING(250),
    primaryKey: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  activo: {
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
  tableName: 'tbl_estado',
  timestamps: false
});

module.exports = Estado;
