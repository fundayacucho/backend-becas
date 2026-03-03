const Becarios = require('../models/becarios.legacy');

async function obtenerUner(estado) {
  return Becarios.get_uner(estado);
}

async function obtenerPaises() {
  return Becarios.get_tbl_pais();
}

async function obtenerCarreras(codigo) {
  return Becarios.get_carrera(codigo);
}

module.exports = {
  obtenerUner,
  obtenerPaises,
  obtenerCarreras
};
