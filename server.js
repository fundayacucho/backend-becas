console.log('=== ENVIRONMENT INFO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BASE_URL:', process.env.BASE_URL);
console.log('Directorio actual:', __dirname);
console.log('========================');

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const estadoRoutes = require('./routes/estado');
const becarioRoutes = require('./routes/becarios');
const egresadoRoutes = require('./routes/becarios');
const correoRoutes = require('./routes/correo');

const app = express();

// Configuración CORS completa en una línea
app.use(cors({
  origin: ['https://becarios.fundayacucho.gob.ve', 'http://localhost:3000', 'http://localhost:4000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());


if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}


// SERVIR ARCHIVOS ESTÁTICOS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/std', estadoRoutes);
app.use('/api/becarios', becarioRoutes);
app.use('/api/egresado', egresadoRoutes);
app.use('/api/correo', correoRoutes);
// Servir frontend estático (si aplica)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Ruta para el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;


app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  
});