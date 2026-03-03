const jwt = require('jsonwebtoken');
const { Usuario, CatRoles } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: CatRoles, as: 'rol', attributes: ['codigo', 'nombre'] }],
      attributes: ['id', 'email', 'cedula', 'id_rol', 'tipo_usuario', 'activo']
    });

    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = {
      ...decoded,
      id: usuario.id,
      email: usuario.email,
      cedula: usuario.cedula,
      id_rol: usuario.id_rol,
      tipo_usuario: usuario.tipo_usuario,
      activo: usuario.activo,
      rol_codigo: usuario.rol ? usuario.rol.codigo : null,
      rol_nombre: usuario.rol ? usuario.rol.nombre : null
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalido' });
  }
};

module.exports = { authenticateToken };
