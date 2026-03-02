const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Becarios = require('../models/becarios');
//const nodemailer = require('nodemailer');


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
    // ante de eliminar verifica si el usuario no tiene formulario registrado 
    const becario = await Becarios.findByCedulaOrEmail_esterior(id);
    if (becario.length > 0) {
      return res.status(200).json({ message: 'El usuario tiene un formulario registrado' });
      
    }else{
       await User.delete(id);
       res.status(200).json({ message: 'Usuario eliminado exitosamente' });
      
    }

  
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { cedula, nacionalidad , email, tipo_usuario, password ,id_rol} = req.body;

    parseInt(tipo_usuario)

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear nuevo usuario
    const newUser = await User.create({ cedula, nacionalidad , email,tipo_usuario , password,id_rol });
    
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
      const correoEmpresa = 'fundaciongranmariscalayacuchot@gmail.com';

      // este es correo del usuario para enviar el correo
      const correoUsuario = user.email;
      // este es el asunto del correo
      const asunto = 'Recuperar Clave';

      // este es el mensaje del correo
      const mensaje = 'Hola, has solicitado recuperar tu clave, para recuperarla ingresa a la siguiente direccion: http://localhost:3000/recuperar-clave';

      // enviar correo
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: correoEmpresa,
          pass: 'fundaciongranmariscalayacuchot',
        },
      });

      const mailOptions = {
        from: correoEmpresa,
        to: correoUsuario,
        subject: asunto,
        text: mensaje,
      };

      await transporter.sendMail(mailOptions);  

      res.status(200).json({ message: 'Correo enviado exitosamente' });
    } 
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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

      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

module.exports = { register, login ,recupera_clave ,getUsuarios ,deleteUsuario };