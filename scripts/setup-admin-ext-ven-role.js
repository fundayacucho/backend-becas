#!/usr/bin/env node

/**
 * Script para crear el rol ADMIN_EXT_VEN con sus permisos.
 * Repara la secuencia de cat_roles para evitar errores de duplicate key.
 * Uso: node scripts/setup-admin-ext-ven-role.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Iniciando creación del rol ADMIN_EXT_VEN...');

  try {
    const migrationPath = path.join(__dirname, '../migrations/007_create_admin_ext_ven_role.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Ejecutando script SQL...');
    await pool.query(migrationSQL);
    console.log('Migración ejecutada exitosamente');

    // Verificar resultado
    const rol = await pool.query(
      `SELECT cr.id, cr.codigo, cr.nombre, pr.ver, pr.crear, pr.editar, pr.borrar
       FROM cat_roles cr
       LEFT JOIN permisos_rol pr ON pr.rol_id = cr.id
       WHERE cr.codigo = 'ADMIN_EXT_VEN'`
    );

    if (rol.rows.length === 0) {
      console.log('ADVERTENCIA: el rol ya existía previamente, no se modificó.');
    } else {
      console.log('\nRol configurado:');
      console.table(rol.rows);
      console.log(`\nPara asignar el rol a un usuario:`);
      console.log(`  UPDATE usuarios SET id_rol = ${rol.rows[0].id} WHERE email = '<correo>';`);
    }

    console.log('\nListo. Rol ADMIN_EXT_VEN disponible en el sistema.');

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
