const { pool } = require('./config/database');

async function fixAdminExtVenPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buscar el rol
    const rolResult = await client.query("SELECT id FROM cat_roles WHERE codigo = 'ADMIN_EXT_VEN'");
    if (rolResult.rowCount === 0) {
      console.log('El rol ADMIN_EXT_VEN no existe.');
      return;
    }
    const rolId = rolResult.rows[0].id;

    // 2. Ver permisos actuales
    const currentPerms = await client.query("SELECT * FROM permisos_rol WHERE rol_id = $1", [rolId]);
    console.log('Permisos actuales para ADMIN_EXT_VEN:');
    console.table(currentPerms.rows);

    // 3. Actualizar a todos los permisos true
    await client.query(
      `INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
       VALUES ($1, true, true, true, true)
       ON CONFLICT (rol_id) DO UPDATE
       SET ver = true, crear = true, editar = true, borrar = true`,
      [rolId]
    );

    console.log('\n--- Permisos actualizados a TRUE para ver, crear, editar, borrar ---');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

fixAdminExtVenPermissions();
