/**
 * Script para crear el rol ADMIN_EXT_VEN en la base de datos.
 * Uso: node scripts/add-admin-ext-ven-role.js
 */
const { pool } = require('../config/database');

async function addAdminExtVenRole() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar el nuevo rol en cat_roles
    const insertRolResult = await client.query(
      `INSERT INTO cat_roles (codigo, nombre, descripcion)
       VALUES ($1, $2, $3)
       ON CONFLICT (codigo) DO NOTHING
       RETURNING id, codigo, nombre`,
      [
        'ADMIN_EXT_VEN',
        'Admin Extranjeros Venezuela',
        'Acceso de solo lectura a estadísticas de extranjeros en Venezuela',
      ]
    );

    if (insertRolResult.rowCount === 0) {
      console.log('El rol ADMIN_EXT_VEN ya existe. No se realizaron cambios.');
      await client.query('ROLLBACK');
      return;
    }

    const nuevoRolId = insertRolResult.rows[0].id;
    console.log(`Rol creado: id=${nuevoRolId}, codigo=ADMIN_EXT_VEN`);

    // 2. Insertar permisos: solo ver=true, resto false
    await client.query(
      `INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
       VALUES ($1, true, false, false, false)`,
      [nuevoRolId]
    );

    console.log('Permisos asignados: ver=true, crear=false, editar=false, borrar=false');

    await client.query('COMMIT');
    console.log('\nRol ADMIN_EXT_VEN creado exitosamente.');
    console.log('Asigna este rol a los usuarios con: UPDATE usuarios SET id_rol = ' + nuevoRolId + ' WHERE email = \'<correo>\';');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear el rol:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

addAdminExtVenRole();
