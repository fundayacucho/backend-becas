const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Becarios = require('../models/becarios.legacy');
const { Usuario, CatRoles } = require('../models');

const getUsuarios = async (req, res) => {
  try {
    const users = await User.findAll();
    // ADMIN_EXT_VEN solo ve sus propios usuarios
    if (req.user?.rol_codigo === 'ADMIN_EXT_VEN') {
      return res.json(users.filter(u => u.rol_codigo === 'ADMIN_EXT_VEN'));
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await CatRoles.findAll({
      attributes: ['id', 'codigo', 'nombre', 'descripcion']
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const updateUsuarioRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_rol } = req.body;

    if (!id_rol) {
      return res.status(400).json({ message: 'El id_rol es requerido' });
    }

    // Verificar que el rol exista
    const rol = await CatRoles.findByPk(id_rol);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Verificar que el usuario exista
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar el rol del usuario
    await usuario.update({ id_rol });

    res.status(200).json({ 
      message: 'Rol de usuario actualizado exitosamente',
      usuario: {
        id: usuario.id,
        id_rol: usuario.id_rol,
        rol_codigo: rol.codigo,
        rol_nombre: rol.nombre
      }
    });
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

const register_admin = async (req, res) => {
  try {
    const { 
      cedula, 
      nacionalidad = 'V', 
      email, 
      tipo_usuario = 'ADMIN', 
      password, 
      id_rol,
      nombre_completo,
      activo = true
    } = req.body;

    // Validaciones básicas
    if (!cedula || !email || !password || !id_rol) {
      return res.status(400).json({ 
        success: false,
        message: 'Los campos cedula, email, password e id_rol son requeridos' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'El formato del email es inválido' 
      });
    }

    // Verificar que el rol exista
    const rol = await CatRoles.findByPk(id_rol);
    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'El rol especificado no existe'
      });
    }

    // ADMIN_EXT_VEN solo puede crear usuarios con su mismo rol
    if (req.user?.rol_codigo === 'ADMIN_EXT_VEN' && rol.codigo !== 'ADMIN_EXT_VEN') {
      return res.status(403).json({
        success: false,
        message: 'Solo puede crear usuarios con rol ADMIN_EXT_VEN'
      });
    }

    // Verificar si el usuario ya existe por email
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un usuario con este email' 
      });
    }

    // Verificar si ya existe un usuario con la misma cédula
    const { pool } = require('../config/database');
    const existingUserByCedula = await pool.query(
      'SELECT id FROM usuarios WHERE cedula = $1', 
      [cedula]
    );
    if (existingUserByCedula.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un usuario con esta cédula' 
      });
    }

    // Validar longitud de la contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Crear el usuario
    const newUser = await User.create({ 
      cedula, 
      nacionalidad, 
      email, 
      tipo_usuario, 
      password, 
      id_rol 
    });

    // Si se proporcionó nombre_completo, actualizarlo
    if (nombre_completo) {
      await pool.query(
        'UPDATE usuarios SET nombre_completo = $1 WHERE id = $2',
        [nombre_completo, newUser.id]
      );
    }

    // Obtener el usuario creado con su rol
    const usuarioConRol = await Usuario.findByPk(newUser.id, {
      include: [{ model: CatRoles, as: 'rol', attributes: ['codigo', 'nombre'] }],
      attributes: ['id', 'id_rol', 'tipo_usuario', 'cedula', 'email', 'nombre_completo', 'activo']
    });

    res.status(201).json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      data: {
        id: newUser.id,
        cedula: newUser.cedula,
        email: newUser.email,
        tipo_usuario: newUser.tipo_usuario,
        nacionalidad: newUser.nacionalidad,
        id_rol: newUser.id_rol,
        nombre_completo: nombre_completo || null,
        activo: activo,
        rol: {
          id: rol.id,
          codigo: rol.codigo,
          nombre: rol.nombre,
          descripcion: rol.descripcion
        }
      }
    });
  } catch (error) {
    console.error('Error en register_admin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor al crear usuario administrador',
      error: error.message 
    });
  }
};

module.exports = { register, login, recupera_clave, getUsuarios, deleteUsuario, getRoles, updateUsuarioRol, register_admin };
