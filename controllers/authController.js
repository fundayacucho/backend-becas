const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Becarios = require('../models/becarios.legacy');
const { Usuario, CatRoles } = require('../models');

const getUsuarios = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.body;
    const becario = await Becarios.findByCedulaOrEmail_esterior(id);

    if (becario.length > 0) {
      return res.status(200).json({ message: 'El usuario tiene un formulario registrado' });
    }

    await User.delete(id);
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { cedula, nacionalidad, email, tipo_usuario, password, id_rol } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const newUser = await User.create({ cedula, nacionalidad, email, tipo_usuario, password, id_rol });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const recupera_clave = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(501).json({ message: 'Recuperacion de clave no implementada en esta version' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Credenciales invalidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const usuarioConRol = await Usuario.findByPk(user.id, {
      include: [{ model: CatRoles, as: 'rol', attributes: ['codigo', 'nombre'] }],
      attributes: ['id', 'id_rol', 'tipo_usuario', 'cedula', 'email']
    });

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        cedula: user.cedula,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        nacionalidad: user.nacionalidad,
        id_rol: user.id_rol,
        rol_codigo: usuarioConRol?.rol?.codigo || null,
        rol_nombre: usuarioConRol?.rol?.nombre || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

module.exports = { register, login, recupera_clave, getUsuarios, deleteUsuario };
