const { getTemplate, generateConstanciaPdf } = require('./services/constanciasInternacionalesService');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const template = getTemplate();
    const data = {
      numero_constancia: 'TEST-QR-12345',
      encabezado: 'FUNDACION GRAN MARISCAL DE AYACUCHO',
      subtitulo: 'CONSTANCIA DE PRUEBA QR',
      ciudad_fecha: 'Caracas, ' + new Date().toISOString().slice(0, 10),
      nombre_becario: 'Juan Pérez',
      cedula: '12.345.678',
      pasaporte: 'A1234567',
      nacionalidad: 'Venezolano',
      programa: 'Ingeniería',
      institucion: 'UCV',
      pais_destino: 'Venezuela',
      fecha_inicio: '2020-01-01',
      fecha_fin: '2024-01-01',
      duracion: '4 años',
      monto_beca: '1000 USD',
      firma: 'Atentamente,\n\nResponsable de Prueba',
      pie: 'Validación por QR habilitada'
    };

    console.log('Generando PDF...');
    const result = await generateConstanciaPdf(data, { template });
    
    const outputPath = path.join(__dirname, 'test_output.pdf');
    fs.writeFileSync(outputPath, result.buffer);
    console.log('PDF generado con éxito en:', outputPath);
    console.log('Tamaño del PDF:', result.buffer.length, 'bytes');
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

test();
