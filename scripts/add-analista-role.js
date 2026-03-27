/**
 * Script para crear o actualizar el rol ANALISTA en la base de datos con permisos de crear y editar.
 * Uso: node scripts/add-analista-role.js
 */
const { pool } = require('../config/database');

async function addAnalistaRole() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar o actualizar el rol en cat_roles
    const upsertRolResult = await client.query(
      `INSERT INTO cat_roles (codigo, nombre, descripcion)
       VALUES ($1, $2, $3)
       ON CONFLICT (codigo) DO UPDATE 
       SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion
       RETURNING id, codigo, nombre`,
      [
        'ANALISTA',
        'Analista',
        'Rol con capacidad para ver, crear y editar registros.',
      ]
    );

    const rolId = upsertRolResult.rows[0].id;
    console.log(`Rol configurado: id=${rolId}, codigo=ANALISTA`);

    // 2. Insertar o actualizar permisos: ver=true, crear=true, editar=true, borrar=false
    await client.query(
      `INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
       VALUES ($1, true, true, true, false)
       ON CONFLICT (rol_id) DO UPDATE
       SET ver = true, crear = true, editar = true, borrar = false`,
      [rolId]
    );

    console.log('Permisos asignados: ver=true, crear=true, editar=true, borrar=false');

    await client.query('COMMIT');
    console.log('\nRol ANALISTA configurado exitosamente.');
    console.log('Puedes asignar este rol a un usuario con:');
    console.log(`UPDATE usuarios SET id_rol = ${rolId} WHERE email = '<correo>';`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al configurar el rol:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

addAnalistaRole();
