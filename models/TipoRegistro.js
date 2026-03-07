const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TipoRegistro = sequelize.define('TipoRegistro', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    path: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'tipos_registro',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = TipoRegistro;
