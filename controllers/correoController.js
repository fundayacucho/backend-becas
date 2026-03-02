const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const API_URL = 'https://mails-admin.fundayacucho.gob.ve';
const API_KEY = 'e5a61aa242cbe227140f093bb25e6432d80f37fd682420dbbeb395095c7d1df055779a029fb58c44e089846cc7ce0ee7';

async function sendEmail(to, subject, content) {
  try {
    const response = await fetch(`${API_URL}/mail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        to,
        subject,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error ${response.status}: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw error;
  }
}

const recupera_clave = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'El usuario no existe' });
    }

    // Generar una nueva contraseña aleatoria
    const newPassword = Math.random().toString(36).slice(-8); // Contraseña más segura
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña del usuario
    await User.updatePassword(user.id, hashedPassword);
   
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center;">
            <img src="https://fundayacucho.gob.ve/img/c1.png" alt="Logo" width="100%" height="200">
          </div>
          <h2 style="color: #2c3e50;">Recuperación de contraseña</h2>
          <p>Hola ${user.email || 'usuario'},</p>
          <p>Tu nueva contraseña es: <strong>${newPassword}</strong></p>
          <p>Por seguridad, te recomendamos cambiar esta contraseña después de iniciar sesión.</p>
          <hr>
          <p style="color: #7f8c8d; font-size: 0.9em;">
            Si no solicitaste este cambio, por favor contacta a soporte inmediatamente.
          </p>
      </div>
    `;

    await sendEmail(
      user.email,
      'Recuperación de contraseña',
      emailHtml
    );
    res.status(200).json({ message: 'Correo enviado exitosamente' });
  } catch (error) {
    console.error('Error en recupera_clave:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

module.exports = { recupera_clave };