const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
 static async create(userData) {
  const { cedula, nacionalidad, email, tipo_usuario, password,id_rol } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const query = `
    INSERT INTO usuarios (cedula, nacionalidad, email, tipo_usuario, password,id_rol) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING id, cedula, nacionalidad, email, tipo_usuario, created_at 
  `;
  
  const result = await pool.query(query, [cedula, nacionalidad, email, tipo_usuario, hashedPassword ,id_rol]);
  return result.rows[0];
}

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, cedula, email,  created_at FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT 
        id, 
        cedula, 
        email, 
        tipo_usuario, 
        created_at 
      FROM 
        usuarios 
      ORDER BY 
        created_at DESC
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
