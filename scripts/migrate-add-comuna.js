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
    const migrationPath = path.join(__dirname, '..', 'migrations', '004_add_comuna_to_becarios_unificados.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8').replace(/^\uFEFF/, '');

    console.log('Ejecutando migracion: 004_add_comuna_to_becarios_unificados.sql');
    await pool.query(sql);
    console.log('Migracion completada: columna comuna agregada a becarios_unificados.');
  } catch (error) {
    console.error('Error ejecutando migracion de columna comuna:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
