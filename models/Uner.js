const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Uner = sequelize.define('Uner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: { type: DataTypes.INTEGER, allowNull: true },
  codigoestado: { type: DataTypes.STRING(250), allowNull: true },
  codigomunicipio: { type: DataTypes.STRING(250), allowNull: true },
  codigoparraquia: { type: DataTypes.STRING(250), allowNull: true },
  nombre_uner: { type: DataTypes.STRING(250), allowNull: true }
}, {
  tableName: 'tbl_uner',
  timestamps: false
});

module.exports = Uner;
