const { pool } = require('./config/database');

async function checkRoles() {
  const client = await pool.connect();
  try {
    const roles = await client.query('SELECT * FROM cat_roles');
    console.log('--- CAT_ROLES ---');
    console.table(roles.rows);

    const permisos = await client.query(`
      SELECT p.*, r.codigo as rol_codigo 
      FROM permisos_rol p 
      JOIN cat_roles r ON p.rol_id = r.id
    `);
    console.log('\n--- PERMISOS_ROL ---');
    console.table(permisos.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

checkRoles();
