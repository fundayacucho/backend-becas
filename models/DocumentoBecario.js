const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BecarioUnificado = require('./BecarioUnificado');
const CatTipoDocumento = require('./CatTipoDocumento');
const fileManager = require('../utils/fileManager');

const DocumentoBecario = sequelize.define('DocumentoBecario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_becario: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BecarioUnificado,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  id_tipo_documento: {
    type: DataTypes.INTEGER,
    references: {
      model: CatTipoDocumento,
      key: 'id'
    }
  },
  ruta_archivo: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  estatus: {
    type: DataTypes.STRING(100),
    defaultValue: 'Cargado'
  }
}, {
  tableName: 'documentos_becario',
  timestamps: true
});

DocumentoBecario.addHook('beforeDestroy', async (documento) => {
  if (documento.ruta_archivo) {
    fileManager.deleteFile(documento.ruta_archivo);
  }
});

module.exports = DocumentoBecario;
