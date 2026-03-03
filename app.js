const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const estadoRoutes = require('./routes/estado');
const becarioRoutes = require('./routes/becarios');
const egresadoRoutes = require('./routes/becarios');
const extranjerosRoutes = require('./routes/extranjerosVenezuela');
const correoRoutes = require('./routes/correo');
const constanciasInternacionalesRoutes = require('./routes/constanciasInternacionales');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    'https://becarios.fundayacucho.gob.ve,http://localhost:5173,http://localhost:4000,http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );

  app.use(express.json());

  if (process.env.NODE_ENV !== 'production') {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  }

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/std', estadoRoutes);
  app.use('/api/becarios', becarioRoutes);
  app.use('/api/egresado', egresadoRoutes);
  app.use('/api/extranjeros', extranjerosRoutes);
  app.use('/api/correo', correoRoutes);
  app.use('/api/constancias-internacionales', constanciasInternacionalesRoutes);

  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

