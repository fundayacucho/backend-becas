const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function consultarBecarios() {
  try {
    console.log('Consultando becarios en Venezuela...\n');
    
    // Consulta principal para becarios venezolanos
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_venezolanos
      FROM becarios_unificados 
      WHERE id_tipo_becario = 1
    `);
    
    console.log(`📊 Becarios venezolanos registrados: ${result.rows[0].total_venezolanos}`);
    
    // Consulta detallada por tipo
    const resultDetalle = await pool.query(`
      SELECT 
        ctb.descripcion as tipo_becario,
        COUNT(*) as cantidad,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM becarios_unificados), 2) as porcentaje
      FROM becarios_unificados bu
      INNER JOIN cat_tipo_becario ctb ON bu.id_tipo_becario = ctb.id
      GROUP BY ctb.descripcion, bu.id_tipo_becario
      ORDER BY bu.id_tipo_becario
    `);
    
    console.log('\n📈 Desglose por tipo de becario:');
    resultDetalle.rows.forEach(row => {
      console.log(`  ${row.tipo_becario}: ${row.cantidad} (${row.porcentaje}%)`);
    });
    
    // Total general
    const resultTotal = await pool.query('SELECT COUNT(*) as total FROM becarios_unificados');
    console.log(`\n📋 Total general de becarios: ${resultTotal.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error.message);
  } finally {
    await pool.end();
  }
}

consultarBecarios();
