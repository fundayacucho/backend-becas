const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');
const becariosService = require('../services/becariosService');

async function debugData() {
  try {
    const data = await becariosService.obtenerBecariosVenezuela({});

    // Buscar específicamente a Johandry Rojas que sabemos que tiene duplicados
    const johandry = data.find(b => b.nombres_apellidos.toLowerCase().includes('johandry'));

    if (johandry) {
      console.log('RESULTADO_JOHANDRY:', JSON.stringify({
        nombres_apellidos: johandry.nombres_apellidos,
        programa_estudio: johandry.programa_estudio,
        nivel_academico: johandry.nivel_academico,
        semestre_actual: johandry.semestre_actual,
        tipo_beca: johandry.tipo_beca
      }, null, 2));
    } else {
      console.log('No se encontró a Johandry para la prueba de prioridad.');
    }


    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugData();
