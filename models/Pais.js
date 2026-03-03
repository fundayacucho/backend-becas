const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pais = sequelize.define('Pais', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_pais: { type: DataTypes.STRING, allowNull: true },
  continente: { type: DataTypes.STRING, allowNull: true },
  capital: { type: DataTypes.STRING, allowNull: true },
  latitud: { type: DataTypes.STRING, allowNull: true },
  longitud: { type: DataTypes.STRING, allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: true }
}, {
  tableName: 'tbl_pais',
  timestamps: false
});

module.exports = Pais;
