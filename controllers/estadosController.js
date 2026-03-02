const EstadoModel = require('../models/estados');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getEstado = async (req, res) => {
  try {
    const estados = await EstadoModel.obtenerTodos();
    
    if (!estados || estados.length === 0) {
      return res.status(404).json({ message: 'Estados no encontrados' });
    }
    
    res.json(estados);
  } catch (error) {
    console.error('Error en getEstado:', error);
    res.status(500).json({ 
      message: 'Error del servidor al obtener estados',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};
const getMunicipio = async (req, res) => {
  try {
    const queryString = req._parsedUrl.query;
    if (!queryString) {
      return res.status(400).json({ message: 'Código de municipio requerido' });
    }

    const params = new URLSearchParams(queryString);
    const codigoMunicipio = params.get('codigomunicipio');
    if (!codigoMunicipio) {
      return res.status(400).json({ message: 'Código de municipio requerido' });
    }

    const municipio = await EstadoModel.obtenerMunicipio(codigoMunicipio);

    if (!municipio || municipio.length === 0) {
      return res.status(404).json({ message: 'Municipio no encontrado' });
    }
    
    res.json(municipio);
  } catch (error) {
    console.error('Error en getMunicipio:', error);
    res.status(500).json({ 
      message: 'Error del servidor al obtener el municipio',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};
const getParroquia = async (req, res) => {
    try {
    const queryString = req._parsedUrl.query;
    if (!queryString) {
      return res.status(400).json({ message: 'Código de parroquia requerido' });
    }

    const params = new URLSearchParams(queryString);
    const codigoparroquia = params.get('codigomunicipio');
    if (!codigoparroquia) {
      return res.status(400).json({ message: 'Código de Parroquia requerido' });
    }

    const parroquia = await EstadoModel.obtenerParroquia(codigoparroquia);

    if (!parroquia || parroquia.length === 0) {
      return res.status(404).json({ message: 'Parroquia no encontrado' });
    }
    
    res.json(parroquia);
  } catch (error) {
    console.error('Error en getParroquia:', error);
    res.status(500).json({ 
      message: 'Error del servidor al obtener el parroquia',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

module.exports = { getEstado , getMunicipio , getParroquia };
