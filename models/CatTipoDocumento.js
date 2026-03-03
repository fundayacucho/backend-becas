const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CatTipoDocumento = sequelize.define('CatTipoDocumento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'cat_tipo_documento',
  timestamps: false
});

module.exports = CatTipoDocumento;
