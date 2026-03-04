const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
 static async create(userData) {
  const { cedula, nacionalidad, email, tipo_usuario, password,id_rol } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const query = `
      INSERT INTO usuarios (cedula, nacionalidad, email, tipo_usuario, password,id_rol)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, cedula, nacionalidad, email, tipo_usuario
    `;
    const result = await pool.query(query, [cedula, nacionalidad || 'V', email, tipo_usuario, hashedPassword, id_rol]);
    return result.rows[0];
  } catch (error) {
    // Compatibilidad con bases legacy donde usuarios aun no tiene columna nacionalidad.
    if (error?.code !== '42703') throw error;

    const fallbackQuery = `
      INSERT INTO usuarios (cedula, email, tipo_usuario, password,id_rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, cedula, email, tipo_usuario
    `;
    const result = await pool.query(fallbackQuery, [cedula, email, tipo_usuario, hashedPassword, id_rol]);
    return { ...result.rows[0], nacionalidad: nacionalidad || 'V' };
  }
}

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT
        id,
        cedula,
        email,
        COALESCE(
          to_jsonb(u)->>'created_at',
          to_jsonb(u)->>'createdAt',
          to_jsonb(u)->>'fecha_creacion'
        ) AS created_at
      FROM usuarios u
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT 
        u.id,
        u.cedula,
        u.email,
        u.tipo_usuario,
        u.id_rol,
        u.activo,
        u.nombre_completo,
        r.codigo AS rol_codigo,
        r.nombre AS rol_nombre,
        COALESCE(
          to_jsonb(u)->>'created_at',
          to_jsonb(u)->>'createdAt',
          to_jsonb(u)->>'fecha_creacion'
        ) AS created_at
      FROM usuarios u
      LEFT JOIN cat_roles r ON r.id = u.id_rol
      ORDER BY u.id DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updatePassword(id, password) {
    const query = 'UPDATE usuarios SET password = $2 WHERE id = $1';
    const result = await pool.query(query, [id, password]);
    return result.rows[0];
  }
}

module.exports = User;
