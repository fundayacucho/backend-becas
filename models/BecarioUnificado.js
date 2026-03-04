const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const CatTipoBecario = require('./CatTipoBecario');
const Usuario = require('./Usuario');

const BecarioUnificado = sequelize.define('BecarioUnificado', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_tipo_becario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CatTipoBecario,
      key: 'id'
    }
  },
  registrado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  id_usuario_legacy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Vinculo temporal con id de usuario de tabla antigua"
  },
  cedula: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  pasaporte: {
    type: DataTypes.STRING(50)
  },
  nombres: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  genero: {
    type: DataTypes.STRING(20)
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY
  },
  correo: {
    type: DataTypes.STRING(150)
  },
  telefono_principal: {
    type: DataTypes.STRING(50)
  },
  telefono_alternativo: {
    type: DataTypes.STRING(50)
  },
  comuna: { type: DataTypes.STRING(100) },
  codigoestado2: { type: DataTypes.STRING(100) },
  
  estado: { type: DataTypes.STRING(100) },
  municipio: { type: DataTypes.STRING(100) },
  parroquia: { type: DataTypes.STRING(100) },
  direccion: { type: DataTypes.TEXT },
  pais_origen: { type: DataTypes.STRING(100) },
  nombre_representante: { type: DataTypes.STRING(200) },
  parentesco: { type: DataTypes.STRING(50) },
  latitud: { type: DataTypes.STRING(100) },
  longitud: { type: DataTypes.STRING(100) },
  latitud_pais: { type: DataTypes.STRING(100) },
  longitud_pais: { type: DataTypes.STRING(100) },
  nacionalidad: { type: DataTypes.STRING(20) }, // "V" o "E" o "Venezolano"
  es_militar: { type: DataTypes.STRING(20) },
  codigoestado2: { type: DataTypes.STRING(100) },

}, {
  tableName: 'becarios_unificados',
  timestamps: true,
  indexes: [
    { fields: ['cedula'] },
    { fields: ['correo'] },
    { fields: ['id_tipo_becario'] },
    { fields: ['registrado_por'] }
  ],
  scopes: {
    venezolanos: { where: { id_tipo_becario: 1 } },
    exterior: { where: { id_tipo_becario: 2 } },
    extranjeros: { where: { id_tipo_becario: 3 } }
  }
});

module.exports = BecarioUnificado;
