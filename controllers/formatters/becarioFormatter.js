const { toPublicUrl } = require('../../utils/fileManager');

function formatBecarioLegacy(becario) {
  if (!becario) return null;

  return {
    ...becario,
    anexo_cedula: becario.anexo_cedula || null,
    anexo_constancia: becario.anexo_constancia || null,
    anexo_residencia: becario.anexo_residencia || null,
    anexo_foto: becario.anexo_foto || null,
    constancia_semestre: becario.constancia_semestre || null,
    anexo_cedula_url: toPublicUrl(becario.anexo_cedula),
    anexo_constancia_url: toPublicUrl(becario.anexo_constancia),
    anexo_residencia_url: toPublicUrl(becario.anexo_residencia),
    anexo_foto_url: toPublicUrl(becario.anexo_foto),
    constancia_semestre_url: toPublicUrl(becario.constancia_semestre)
  };
}

module.exports = { formatBecarioLegacy };
