const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const CatRoles = require('./CatRoles');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre_completo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cedula: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  id_rol: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: CatRoles,
      key: 'id'
    }
  },
  // campos legacy mantenidos por compatibilidad (opcional, recomendado migrar)
  tipo_usuario: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usuarios',
  timestamps: false // Mantenemos false si la tabla original de la DB no soportaba createdAt, updatedAt
});

// Relación: Un Usuario pertenece a un Rol
Usuario.belongsTo(CatRoles, { foreignKey: 'id_rol', as: 'rol' });
CatRoles.hasMany(Usuario, { foreignKey: 'id_rol' });

module.exports = Usuario;
