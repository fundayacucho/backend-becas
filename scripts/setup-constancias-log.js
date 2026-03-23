#!/usr/bin/env node

/**
 * Script para ejecutar la migración de la tabla constancias_log
 * Uso: node scripts/setup-constancias-log.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Iniciando migración de constancias_log...');

  try {
    const migrationPath = path.join(__dirname, '../migrations/006_create_constancias_log.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Ejecutando script SQL...');
    await pool.query(migrationSQL);
    console.log('Migración ejecutada exitosamente');

    const result = await pool.query('SELECT COUNT(*) AS count FROM constancias_log');
    console.log(`Registros en constancias_log: ${result.rows[0].count}`);

    console.log('\nTabla constancias_log lista.');
    console.log('Endpoint disponible:');
    console.log('  GET /api/constancias-internacionales/count  -> total de constancias generadas');

  } catch (error) {
    console.error('Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
