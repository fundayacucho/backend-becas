const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const becariosService = require('../services/becariosService');

async function testQuery() {
    try {
        console.log('Probando obtenerBecariosVenezuela...');
        const data = await becariosService.obtenerBecariosVenezuela({});

        if (data && data.length > 0) {
            const sample = data[0];
            console.log('MUESTRA_RESULTADO:', JSON.stringify({
                nombres_apellidos: sample.nombres_apellidos,
                institucion: sample.institucion,
                programa_estudio: sample.programa_estudio,
                nivel_academico: sample.nivel_academico,
                semestre_actual: sample.semestre_actual,
                anexo_cedula: sample.anexo_cedula
            }, null, 2));
        } else {
            console.log('No se encontraron datos.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testQuery();
