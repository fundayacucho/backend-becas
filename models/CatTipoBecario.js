const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CatTipoBecario = sequelize.define('CatTipoBecario', {
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
  tableName: 'cat_tipo_becario',
  timestamps: false
});

module.exports = CatTipoBecario;
