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
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_add_nacionalidad_to_usuarios.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Ejecutando migracion: 002_add_nacionalidad_to_usuarios.sql');
    await pool.query(sql);
    console.log('Migracion completada: columna nacionalidad en usuarios lista (default V).');
  } catch (error) {
    console.error('Error ejecutando migracion de nacionalidad:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
