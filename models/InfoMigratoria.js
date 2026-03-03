const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BecarioUnificado = require('./BecarioUnificado');
const fileManager = require('../utils/fileManager');

const InfoMigratoria = sequelize.define('InfoMigratoria', {
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
  fecha_vencimiento_pasaporte: { type: DataTypes.DATEONLY },
  estatus_pasaporte: { type: DataTypes.STRING(150) },
  visa_numero: { type: DataTypes.STRING(100) },
  fecha_vencimiento_visa: { type: DataTypes.DATEONLY },
  status_visa: { type: DataTypes.STRING(100) },
  sede_residencia: { type: DataTypes.STRING(250) },
  contrato_firmado: { type: DataTypes.STRING(10) },
  observaciones: { type: DataTypes.TEXT }
}, {
  tableName: 'info_migratoria',
  timestamps: true
});

InfoMigratoria.addHook('beforeDestroy', async (info) => {
  if (info.contrato_firmado) {
    fileManager.deleteFile(info.contrato_firmado);
  }
});

module.exports = InfoMigratoria;
