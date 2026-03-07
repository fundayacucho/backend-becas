const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });


async function setupTable() {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    const sql = `
    CREATE TABLE IF NOT EXISTS tipos_registro (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Insertar datos iniciales solo si la tabla está vacía
    INSERT INTO tipos_registro (title, description, image, path)
    SELECT 'Becario en Venezuela', 'Registro para becarios que residen actualmente en Venezuela', 'https://fundayacucho.gob.ve/img/becario1.png', '/registro/1'
    WHERE NOT EXISTS (SELECT 1 FROM tipos_registro WHERE id = 1);

    INSERT INTO tipos_registro (title, description, image, path)
    SELECT 'Becario en el Exterior', 'Registro para becarios que residen actualmente en el exterior', 'https://fundayacucho.gob.ve/img/becario4.png', '/registro/3'
    WHERE NOT EXISTS (SELECT 1 FROM tipos_registro WHERE id = 2);

    INSERT INTO tipos_registro (title, description, image, path)
    SELECT 'Egresado Fundayacucho', 'Registro para egresado fundayacucho', 'https://fundayacucho.gob.ve/img/becario3.png', '/registro/2'
    WHERE NOT EXISTS (SELECT 1 FROM tipos_registro WHERE id = 3);
  `;

    try {
        console.log('Iniciando creación de tabla y datos iniciales...');
        await pool.query(sql);
        console.log('Tabla tipos_registro configurada exitosamente.');
    } catch (error) {
        console.error('Error al configurar la tabla:', error);
    } finally {
        await pool.end();
    }
}

setupTable();
