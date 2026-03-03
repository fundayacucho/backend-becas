const Becarios = require('../models/becarios.legacy');

async function obtenerBecariosVenezuela({ estado = '', municipio = '', parroquia = '' }) {
  return Becarios.get_becariosx(estado, municipio, parroquia);
}

async function obtenerBecariosExterior({ estado = '', municipio = '', parroquia = '' }) {
  return Becarios.get_becariosEsterior(estado, municipio, parroquia);
}

async function obtenerEgresados({ estado = '', municipio = '', parroquia = '' }) {
  return Becarios.get_egresados(estado, municipio, parroquia);
}

async function obtenerDetalleBecario(id) {
  return Becarios.becarioXid(id);
}

async function obtenerDetalleBecarioExterior(id) {
  return Becarios.becarioXid_esteriol(id);
}

async function obtenerDetalleEgresado(id) {
  return Becarios.egresadoXid(id);
}

async function eliminarBecarioExterior(id) {
  return Becarios.delete_becario_exterior(id);
}

module.exports = {
  obtenerBecariosVenezuela,
  obtenerBecariosExterior,
  obtenerEgresados,
  obtenerDetalleBecario,
  obtenerDetalleBecarioExterior,
  obtenerDetalleEgresado,
  eliminarBecarioExterior
};
