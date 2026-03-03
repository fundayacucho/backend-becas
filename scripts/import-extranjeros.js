const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('../config/database');
const {
  Usuario,
  BecarioUnificado,
  EstudioBecario,
  InfoMigratoria,
  Estado
} = require('../models');

function extraerAnio(fecha_ingreso) {
  if (!fecha_ingreso) return null;
  const str = String(fecha_ingreso);
  if (/^\d{4}$/.test(str)) return parseInt(str);
  const match = str.match(/\d{4}/);
  if (match) return parseInt(match[0]);
  return null;
}

function formatFecha(str) {
  if (!str || str.trim() === '' || str.toLowerCase().includes('ref')) return null;
  const parts = str.split('/');
  if (parts.length === 3) {
    let [p1, p2, p3] = parts.map(p => p.trim());
    
    // Padding
    if (p1.length === 1) p1 = '0' + p1;
    if (p2.length === 1) p2 = '0' + p2;
    if (p3.length === 2) p3 = (parseInt(p3) < 50 ? '20' : '19') + p3;

    // Lógica para detectar si es MM/DD o DD/MM
    // Si la segunda parte es > 12, definitivamente es MM/DD/YYYY
    if (parseInt(p2) > 12) {
      return `${p3}-${p1}-${p2}`; // YYYY-MM-DD (p1 era el mes)
    }
    // Si la primera parte es > 12, definitivamente es DD/MM/YYYY
    if (parseInt(p1) > 12) {
      return `${p3}-${p2}-${p1}`; // YYYY-MM-DD (p2 era el mes)
    }
    
    // Caso ambiguo (ej 05/02/2024): Asumimos DD/MM/YYYY por ser el estándar local
    return `${p3}-${p2}-${p1}`;
  }
  return str;
}

async function migrarCSVExtranjeros() {
  console.log('📄 Iniciando Importación de Estudiantes Extranjeros en Venezuela (Desde CSV)...');
  const csvFilePath = path.join(__dirname, '../estudiantes_ext_en_venezuela.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ Error: Archivo estudiantes_ext_en_venezuela.csv no encontrado.');
    process.exit(1);
  }

  const resultados = [];
  const headerKeys = Array.from({ length: 65 }, (_, i) => `c${i + 1}`);

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ 
        headers: headerKeys
      }))
      .on('data', (data) => resultados.push(data))
      .on('end', async () => {
        let count = 0;
        let skipped = 0;

        for (const row of resultados) {
          // Filtrar: Debe ser una fila de datos (c1 es un número) y tener Nombres/Apellidos
          if (!row.c1 || isNaN(row.c1)) {
            continue;
          }

          if (!row.c11 || !row.c11.trim() || !row.c12 || !row.c12.trim()) {
            console.log(`⚠️ Saltando fila ${row.c1}: Nombres o Apellidos faltantes.`);
            skipped++;
            continue;
          }

          const t = await sequelize.transaction();
          try {
            // Analista asoc
            let analistaId = null;
            if (row.c2 && row.c2.trim() !== '') {
              const analista = await Usuario.findOne({ where: { nombre_completo: row.c2 }});
              if (analista) analistaId = analista.id;
            }

            // Buscar el código de estado por nombre
            let codEstado = null;
            if (row.c24 && row.c24.trim() !== '') {
              const estadoMatch = await Estado.findOne({ 
                where: { nombre: { [sequelize.Sequelize.Op.iLike]: `%${row.c24.trim()}%` } } 
              });
              if (estadoMatch) codEstado = estadoMatch.codigoestado;
            }

            const fallbackCedula = `EXT-${Math.floor(Math.random() * 1000000)}`;
            const [{ id: idBecario }] = await BecarioUnificado.findOrCreate({
              where: { cedula: row.c10 ? String(row.c10).trim() : fallbackCedula },
              defaults: {
                id_tipo_becario: 3, // EXT_VEN
                registrado_por: analistaId,
                pasaporte: row.c4,
                nombres: row.c12.trim(),
                apellidos: row.c11.trim(),
                correo: row.c16,
                telefono_principal: row.c17,
                pais_origen: row.c18,
                genero: row.c13 === 'M' ? 'Masculino' : (row.c13 === 'F' ? 'Femenino' : row.c13),
                fecha_nacimiento: formatFecha(row.c14),
                estado: codEstado
              },
              transaction: t
            });

            // Estudio
            let estatusMapping = 1; // ACTIVO
            if (row.c26 && row.c26.toLowerCase().includes('egresado')) estatusMapping = 2; // EGRESADO
            
            await EstudioBecario.create({
              id_becario: idBecario,
              id_estatus: estatusMapping,
              institucion_nombre: row.c23,
              carrera_nombre: row.c22,
              anio_ingreso: extraerAnio(row.c19),
              nivel_academico: 'PREGRADO',
              estado_estudio: row.c26
            }, { transaction: t });

            // Info Migratoria
            await InfoMigratoria.create({
              id_becario: idBecario,
              fecha_vencimiento_pasaporte: formatFecha(row.c5),
              visa_numero: row.c7,
              fecha_vencimiento_visa: formatFecha(row.c8),
              estatus_pasaporte: row.c57,
              status_visa: row.c58,
              observaciones: row.c59
            }, { transaction: t });

            await t.commit();
            count++;
          } catch (error) {
            await t.rollback();
            console.error(`❌ Error en fila ${count + skipped + 3}:`, error.message);
          }
        }
        console.log(`✅ Importación finalizada: ${count} registros insertados, ${skipped} saltados.`);
        resolve();
      });
  });
}

async function run() {
  try {
    await sequelize.authenticate();
    await migrarCSVExtranjeros();
  } catch (err) {
    console.error('❌ Error general:', err);
  } finally {
    process.exit(0);
  }
}

run();
