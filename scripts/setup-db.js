const { sequelize } = require('../config/database');
const { Pool } = require('pg');
const { poblarCatalogos } = require('./seeders/catalogs');
const dbModels = require('../models/index');

const LEGACY_DB_NAME = process.env.LEGACY_DB_NAME || 'becario_newBecarios';
const NEW_DB_NAME = process.env.DB_NAME || 'becarios_v2';
const LEGACY_DB_USER = process.env.LEGACY_DB_USER || process.env.DB_USER;
const LEGACY_DB_HOST = process.env.LEGACY_DB_HOST || process.env.DB_HOST;
const LEGACY_DB_PORT = process.env.LEGACY_DB_PORT || process.env.DB_PORT;
const LEGACY_DB_PASSWORD = process.env.LEGACY_DB_PASSWORD || process.env.DB_PASSWORD;

async function autoSetup() {
  try {
    console.log(`⚠️ ADVERTENCIA: Este script creará/sobreescribirá las tablas en la BD ${NEW_DB_NAME}`);
    console.log('Conectando a bases de datos...');
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa al clúster PostgreSQL de ${NEW_DB_NAME}`);

    // 1) Crear esquema V2 desde modelos (force=true borra tablas existentes)
    console.log('🚧 Modelando esquemas de la Base de Datos V2. Por favor espere...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas creadas con éxito bajo Sequelize.');

    // 2) Seed de catálogos base
    await poblarCatalogos();

    // 3) Copia de cartografía desde legacy
    console.log(`🚚 Migrando Cartografía desde la vieja DB (${LEGACY_DB_NAME}). Esto toma un par de segundos...`);

    const legacyPool = new Pool({
      user: LEGACY_DB_USER,
      host: LEGACY_DB_HOST,
      database: LEGACY_DB_NAME,
      password: LEGACY_DB_PASSWORD,
      port: LEGACY_DB_PORT,
    });

    async function copiarTablaLegacy(tablaLegacy, modeloV2) {
      console.log(`Copiando ${tablaLegacy}...`);
      const res = await legacyPool.query(`SELECT * FROM ${tablaLegacy}`);

      if (!res.rows.length) {
        console.log(`   └─ ⚠️ La tabla ${tablaLegacy} estaba vacía.`);
        return;
      }

      const rows = res.rows.map((row) => {
        const newRow = { ...row };
        if (newRow.codigoestado) newRow.codigoestado = String(newRow.codigoestado).trim().padStart(2, '0');
        if (newRow.codigomunicipio) newRow.codigomunicipio = String(newRow.codigomunicipio).trim().padStart(4, '0');
        if (newRow.codigoparroquia) newRow.codigoparroquia = String(newRow.codigoparroquia).trim().padStart(6, '0');
        return newRow;
      });

      await modeloV2.bulkCreate(rows, { ignoreDuplicates: true });
      console.log(`   └─ ✅ Se copiaron ${res.rows.length} registros en ${modeloV2.name}`);
    }

    await copiarTablaLegacy('tbl_estado', dbModels.Estado);
    await copiarTablaLegacy('tbl_municipio', dbModels.Municipio);
    await copiarTablaLegacy('tbl_parroquia', dbModels.Parroquia);
    await copiarTablaLegacy('tbl_pais', dbModels.Pais);
    await copiarTablaLegacy('tbl_uner', dbModels.Uner);
    await copiarTablaLegacy('tbl_carreras', dbModels.Carrera);

    await legacyPool.end();

    console.log('🎉 Migración de cartografía completada a la perfección.');
    console.log('----------------------------------------------------');
    console.log(`🚀 BASE DE DATOS ${NEW_DB_NAME} ESTÁ LISTA PARA RECIBIR LA MIGRACIÓN MASIVA (Sprint 2)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error catastrófico durante el Database Setup:', error);
    if (error?.code === '28P01') {
      console.error(
        'Sugerencia: valida .env legacy -> LEGACY_DB_USER, LEGACY_DB_PASSWORD, LEGACY_DB_HOST, LEGACY_DB_PORT, LEGACY_DB_NAME.'
      );
    }
    process.exit(1);
  }
}

autoSetup();
