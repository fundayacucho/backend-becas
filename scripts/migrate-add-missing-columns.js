const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', '003_add_missing_columns_to_estudios.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8').replace(/^\uFEFF/, '');

    console.log('Ejecutando migracion: 003_add_missing_columns_to_estudios.sql');
    await pool.query(sql);
    console.log('Migracion completada: columnas tipoTarea y dependencia actualizadas con valores por defecto.');
  } catch (error) {
    console.error('Error ejecutando migracion de columnas faltantes:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
