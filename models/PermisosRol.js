const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const CatRoles = require('./CatRoles');

const PermisosRol = sequelize.define('PermisosRol', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cat_roles',
      key: 'id'
    }
  },
  ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  borrar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'permisos_rol',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['rol_id']
    }
  ]
});

// Define associations
PermisosRol.belongsTo(CatRoles, { foreignKey: 'rol_id', as: 'rol' });
CatRoles.hasOne(PermisosRol, { foreignKey: 'rol_id', as: 'permisos' });

module.exports = PermisosRol;
