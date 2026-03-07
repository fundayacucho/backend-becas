const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');

async function fixSequence() {
    try {
        console.log('Iniciando sincronización de secuencia para cat_roles...');

        // Sincroniza la secuencia cat_roles_id_seq con el ID máximo actual
        const [results] = await sequelize.query(`
      SELECT setval('cat_roles_id_seq', (SELECT MAX(id) FROM cat_roles));
    `);

        console.log('Secuencia actualizada correctamente:', results[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error al sincronizar secuencia:', error.message);
        process.exit(1);
    }
}

fixSequence();
