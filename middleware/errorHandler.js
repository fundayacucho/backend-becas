const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Error interno del servidor'
  };

  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack;
  }

  if (!res.headersSent) {
    return res.status(status).json(payload);
  }

  return next(err);
};

module.exports = { errorHandler };
