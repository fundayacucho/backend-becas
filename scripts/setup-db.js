const { sequelize } = require('../config/database');
const { Pool } = require('pg');
const { poblarCatalogos } = require('./seeders/catalogs');
const dbModels = require('../models/index');
const LEGACY_DB_NAME = process.env.LEGACY_DB_NAME || 'becario_newBecarios';

async function autoSetup() {
  try {
    console.log('⚠️ ADVERTENCIA: Este script creará/sobreescribirá las tablas en la BD becarios_v2');
    console.log('Conectando a bases de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa al clúster PostgreSQL de becarios_v2');

    // 1. FORZAR CREACIÓN DE TABLAS - Ojo: force:true borra las existentes
    console.log('🚧 Modelando esquemas de la Base de Datos V2. Por favor espere...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas creadas con éxito bajo Sequelize.');

    // 2. SEEDEAR CATÁLOGOS SIMPLES
    await poblarCatalogos();

    // 3. MIGRAR HISTÓRICO GEOGRÁFICO DE LA BD VIEJA A LA BD NUEVA (becarios_v2)
    console.log(`🚚 Migrando Cartografía desde la vieja DB (${LEGACY_DB_NAME}). Esto toma un par de segundos...`);
    
    // Conexión específica con el usuario postgres para tener permisos de lectura total
    const legacyPool = new Pool({
      user: 'postgres',
      host: process.env.DB_HOST,
      database: LEGACY_DB_NAME,
      password: process.env.DB_PASSWORD, 
      port: process.env.DB_PORT,
    });

    // Función auxiliar para copiar una tabla de pg-pool a Sequelize-model
    async function copiarTablaLegacy(tablaLegacy, modeloV2, pkName) {
      console.log(`Copiando ${tablaLegacy}...`);
      const res = await legacyPool.query(`SELECT * FROM ${tablaLegacy}`);
      if (res.rows.length > 0) {
        
        // Formatear códigos para mantener ceros a la izquierda si es necesario
        const rows = res.rows.map(row => {
           const newRow = { ...row };
           if (newRow.codigoestado) newRow.codigoestado = String(newRow.codigoestado).trim().padStart(2, '0');
           if (newRow.codigomunicipio) newRow.codigomunicipio = String(newRow.codigomunicipio).trim().padStart(4, '0');
           if (newRow.codigoparroquia) newRow.codigoparroquia = String(newRow.codigoparroquia).trim().padStart(6, '0');
           return newRow;
        });

        // Enforce ignoreDuplicates insert en caso de algo
        await modeloV2.bulkCreate(rows, { ignoreDuplicates: true });
        console.log(`   └─ ✅ Se copiaron ${res.rows.length} registros en ${modeloV2.name}`);
      } else {
        console.log(`   └─ ⚠️ La tabla ${tablaLegacy} estaba vacía.`);
      }
    }

    await copiarTablaLegacy('tbl_estado', dbModels.Estado);
    await copiarTablaLegacy('tbl_municipio', dbModels.Municipio);
    await copiarTablaLegacy('tbl_parroquia', dbModels.Parroquia);
    await copiarTablaLegacy('tbl_pais', dbModels.Pais);
    await copiarTablaLegacy('tbl_uner', dbModels.Uner);
    await copiarTablaLegacy('tbl_carreras', dbModels.Carrera);

    await legacyPool.end(); // Cerrar el pool legacy al terminar

    console.log('🎉 Migración de cartografía completada a la perfección.');
    console.log('----------------------------------------------------');
    console.log('🚀 BASE DE DATOS `becarios_v2` ESTÁ LISTA PARA RECIBIR LA MIGRACIÓN MASIVA (Sprint 2)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error catastrófico durante el Database Setup:', error);
    process.exit(1);
  }
}

autoSetup();
