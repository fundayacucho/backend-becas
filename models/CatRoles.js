const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CatRoles = sequelize.define('CatRole', {
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
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'cat_roles',
  timestamps: false
});

module.exports = CatRoles;
