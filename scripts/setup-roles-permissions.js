#!/usr/bin/env node

/**
 * Script para ejecutar la migración de permisos de roles
 * Uso: node scripts/setup-roles-permissions.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Iniciando migración de permisos de roles...');
  
  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../migrations/005_create_permisos_rol.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Ejecutando script SQL...');
    
    // Ejecutar la migración
    await pool.query(migrationSQL);
    
    console.log('✅ Migración ejecutada exitosamente');
    
    // Verificar que la tabla fue creada
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM permisos_rol
    `);
    
    console.log(`📊 Permisos creados: ${result.rows[0].count}`);
    
    // Mostrar permisos actuales
    const permisos = await pool.query(`
      SELECT 
        pr.id,
        pr.rol_id,
        cr.codigo as rol_codigo,
        cr.nombre as rol_nombre,
        pr.ver,
        pr.crear,
        pr.editar,
        pr.borrar
      FROM permisos_rol pr
      JOIN cat_roles cr ON pr.rol_id = cr.id
      ORDER BY cr.nombre
    `);
    
    console.log('\n📋 Permisos configurados:');
    console.table(permisos.rows);
    
    console.log('\n🎉 Configuración de roles y permisos completada');
    console.log('\n📌 Endpoints disponibles:');
    console.log('  GET /api/roles/permisos - Obtener todos los permisos');
    console.log('  GET /api/roles/permisos/:rol_id - Obtener permisos de un rol');
    console.log('  PUT /api/roles/permisos - Actualizar permisos de un rol');
    console.log('  GET /api/roles/con-permisos - Obtener roles con sus permisos');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
