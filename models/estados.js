const pool = require('../config/database');

class Estado {
  static async obtenerTodos() {
    try {
      const query = 'SELECT * FROM tbl_estado';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener estados:', error);
      throw new Error('No se pudieron obtener los estados');
    }
  }

    static async obtenerMunicipio(codigoestado) {
    try {
      const query = 'SELECT * FROM tbl_municipio WHERE codigoestado = $1';
      const result = await pool.query(query, [codigoestado]);
      return result.rows || null;
    } catch (error) {
      console.error('Error al obtener municipio por ID:', error);
      throw new Error('No se pudo obtener el estado');
    }
  }

    static async obtenerParroquia(codigomunicipio) {
    try {
      const query = 'SELECT * FROM tbl_parroquia WHERE codigomunicipio = $1';
      const result = await pool.query(query, [codigomunicipio]);
      return result.rows || null;
    } catch (error) {
      console.error('Error al obtener municipio por ID:', error);
      throw new Error('No se pudo obtener el municpio');
    }
  }

  static async obtenerPorId(id) {
    try {
      const query = 'SELECT * FROM tbl_estado WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error al obtener estado por ID:', error);
      throw new Error('No se pudo obtener el estado');
    }
  }

  static async obtenerActivos() {
    try {
      const query = 'SELECT * FROM tbl_estado WHERE activo = true';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener estados activos:', error);
      throw new Error('No se pudieron obtener los estados activos');
    }
  }
}

module.exports = Estado;