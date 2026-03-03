const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol_codigo || !allowedRoles.includes(req.user.rol_codigo)) {
      return res.status(403).json({ message: 'No tienes permisos para esta accion' });
    }
    next();
  };
};

module.exports = { authorize };
