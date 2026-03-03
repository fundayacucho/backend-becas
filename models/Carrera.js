const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Carrera = sequelize.define('Carrera', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cod_nuc_unv: { type: DataTypes.INTEGER, allowNull: true },
  codigo: { type: DataTypes.INTEGER, allowNull: true },
  carreras: { type: DataTypes.STRING(250), allowNull: true }
}, {
  tableName: 'tbl_carreras',
  timestamps: false
});

module.exports = Carrera;
