const { Pool } = require('pg');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// MANTENER TEMPORALMENTE (Legacy) - Se apuntará a la vieja base por ahora si no cambias el env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// NUEVO - Instancia Sequelize para becarios_v2
const sequelize = new Sequelize('becarios_v2', process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

module.exports = { pool, sequelize };