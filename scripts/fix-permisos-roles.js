const { pool } = require('../config/database');

async function verificarYActualizarPermisos() {
  try {
    
    
    // Verificar permisos actuales
    const permisosActuales = await pool.query(`
      SELECT 
        cr.id,
        cr.codigo,
        cr.nombre,
        COALESCE(pr.ver, false) as tiene_permiso_ver,
        COALESCE(pr.crear, false) as tiene_permiso_crear,
        COALESCE(pr.editar, false) as tiene_permiso_editar,
        COALESCE(pr.borrar, false) as tiene_permiso_borrar
      FROM cat_roles cr
      LEFT JOIN permisos_rol pr ON cr.id = pr.rol_id
      WHERE cr.codigo IN ('ADMIN', 'SUPERVISOR', 'ANALISTA')
      ORDER BY cr.codigo
    `);

    
    
    // Para SUPERVISOR: puede ver, pero no crear/editar/borrar
    await pool.query(`
      INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
      VALUES (
        (SELECT id FROM cat_roles WHERE codigo = 'SUPERVISOR'),
        true, false, false, false
      )
      ON CONFLICT (rol_id) 
      DO UPDATE SET 
        ver = true,
        crear = false,
        editar = false,
        borrar = false,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    // Para ANALISTA: puede ver, pero no crear/editar/borrar
    await pool.query(`
      INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
      VALUES (
        (SELECT id FROM cat_roles WHERE codigo = 'ANALISTA'),
        true, false, false, false
      )
      ON CONFLICT (rol_id) 
      DO UPDATE SET 
        ver = true,
        crear = false,
        editar = false,
        borrar = false,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    // Verificar permisos después de la actualización
    const permisosActualizados = await pool.query(`
      SELECT 
        cr.codigo,
        cr.nombre,
        pr.ver,
        pr.crear,
        pr.editar,
        pr.borrar
      FROM cat_roles cr
      JOIN permisos_rol pr ON cr.id = pr.rol_id
      WHERE cr.codigo IN ('ADMIN', 'SUPERVISOR', 'ANALISTA')
      ORDER BY cr.codigo
    `);
    

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

verificarYActualizarPermisos();
