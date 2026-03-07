const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const extranjerosService = require('./extranjerosService');

const TEMPLATE_DIR = path.join(__dirname, '..', 'data', 'templates');
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'constancia_internacional.json');

const PLACEHOLDERS = [
  'destinatario',
  'nombre_becario',
  'cedula',
  'pasaporte',
  'nacionalidad',
  'programa',
  'institucion',
  'pais_destino',
  'fecha_inicio',
  'fecha_fin',
  'duracion',
  'monto_beca',
  'fecha_emision',
  'firmante_nombre',
  'firmante_cargo',
  'numero_constancia',
  'observaciones'
];

const DEFAULT_TEMPLATE = {
  nombre: 'Plantilla base constancia internacional',
  encabezado: 'FUNDACION GRAN MARISCAL DE AYACUCHO',
  subtitulo: 'CONSTANCIA DE BECA INTERNACIONAL',
  ciudad_fecha: 'Caracas, {{fecha_emision}}',
  cuerpo: [
    'Quien suscribe, {{firmante_nombre}}, en su caracter de {{firmante_cargo}} de la Fundacion Gran Mariscal de Ayacucho, hace constar por medio de la presente que el(la) ciudadano(a) {{nombre_becario}}, titular de la cedula {{cedula}} y pasaporte {{pasaporte}}, de nacionalidad {{nacionalidad}}, es beneficiario(a) activo(a) del programa de becas internacionales.',
    'El(la) becario(a) cursa {{programa}} en {{institucion}} ({{pais_destino}}), con periodo academico comprendido entre {{fecha_inicio}} y {{fecha_fin}}, para una duracion estimada de {{duracion}}.',
    'La asignacion academica registrada para el periodo vigente es de {{monto_beca}}. Se emite la presente constancia a solicitud de la parte interesada para los fines legales y administrativos que correspondan.',
    'Observaciones: {{observaciones}}'
  ],
  firma: 'Atentamente,\n\n{{firmante_nombre}}\n{{firmante_cargo}}',
  pie: 'Numero de constancia: {{numero_constancia}}'
};

function ensureTemplateFile() {
  if (!fs.existsSync(TEMPLATE_DIR)) fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  if (!fs.existsSync(TEMPLATE_PATH)) {
    fs.writeFileSync(TEMPLATE_PATH, JSON.stringify(DEFAULT_TEMPLATE, null, 2), 'utf8');
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replacePlaceholders(text, data = {}) {
  return String(text || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    const raw = data[key];
    if (raw === undefined || raw === null || raw === '') return '';
    return String(raw);
  });
}

function replacePlaceholdersEscaped(text, data = {}) {
  return String(text || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    const raw = data[key];
    if (raw === undefined || raw === null || raw === '') return '';
    return escapeHtml(raw);
  });
}

function normalizeTemplate(input) {
  const body = Array.isArray(input?.cuerpo)
    ? input.cuerpo.map((line) => String(line || '').trim()).filter(Boolean)
    : [];

  return {
    nombre: String(input?.nombre || DEFAULT_TEMPLATE.nombre).trim(),
    encabezado: String(input?.encabezado || DEFAULT_TEMPLATE.encabezado).trim(),
    subtitulo: String(input?.subtitulo || DEFAULT_TEMPLATE.subtitulo).trim(),
    ciudad_fecha: String(input?.ciudad_fecha || DEFAULT_TEMPLATE.ciudad_fecha).trim(),
    cuerpo: body.length ? body : DEFAULT_TEMPLATE.cuerpo,
    firma: String(input?.firma || DEFAULT_TEMPLATE.firma).trim(),
    pie: String(input?.pie || DEFAULT_TEMPLATE.pie).trim()
  };
}

function getTemplate() {
  ensureTemplateFile();
  try {
    const raw = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    return normalizeTemplate(JSON.parse(raw));
  } catch (error) {
    return DEFAULT_TEMPLATE;
  }
}

function saveTemplate(templateInput) {
  ensureTemplateFile();
  const nextTemplate = normalizeTemplate(templateInput || {});
  fs.writeFileSync(TEMPLATE_PATH, JSON.stringify(nextTemplate, null, 2), 'utf8');
  return nextTemplate;
}

function buildHtml(template, data = {}) {
  const paragraphs = template.cuerpo
    .map((line) => `<p>${replacePlaceholdersEscaped(line, data)}</p>`)
    .join('\n');

  // Intentamos cargar el cintillo en base64 para la previsualización
  let cintilloBase64 = '';
  try {
    const cintilloPath = path.join(__dirname, '..', 'uploads', 'cintillos', 'cintillo6.png');
    if (fs.existsSync(cintilloPath)) {
      const buffer = fs.readFileSync(cintilloPath);
      cintilloBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
    }
  } catch (e) {
    console.error('Error cargando cintillo para HTML:', e.message);
  }

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(template.subtitulo)}</title>
  <style>
    body { font-family: 'Times New Roman', serif; color: #111; margin: 0; background: #f4f4f4; }
    .sheet { max-width: 840px; margin: 28px auto; background: #fff; border: 1px solid #d8d8d8; padding: 42px 56px; box-shadow: 0 2px 6px rgba(0,0,0,.06); }
    .cintillo { width: 100%; height: auto; margin-bottom: 20px; }
    .header { text-align: center; margin-bottom: 22px; }
    .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: .6px; }
    .header h2 { margin: 8px 0 0; font-size: 18px; text-transform: uppercase; }
    .city-date { text-align: right; margin: 20px 0; font-size: 15px; }
    .content p { text-align: justify; line-height: 1.65; margin: 0 0 14px; font-size: 15px; }
    .signature { margin-top: 34px; white-space: pre-line; line-height: 1.7; font-size: 15px; }
    .footer { margin-top: 24px; font-size: 13px; color: #444; border-top: 1px solid #e6e6e6; padding-top: 10px; }
  </style>
</head>
<body>
  <main class="sheet">
    ${cintilloBase64 ? `<img src="${cintilloBase64}" class="cintillo" alt="Cintillo" />` : ''}
    <header class="header">
      <h1>${replacePlaceholdersEscaped(template.encabezado, data)}</h1>
      <h2>${replacePlaceholdersEscaped(template.subtitulo, data)}</h2>
    </header>
    <section class="city-date">${replacePlaceholdersEscaped(template.ciudad_fecha, data)}</section>
    <section class="content">${paragraphs}</section>
    <section class="signature">${replacePlaceholdersEscaped(template.firma, data)}</section>
    <footer class="footer">${replacePlaceholdersEscaped(template.pie, data)}</footer>
  </main>
</body>
</html>`;
}


function buildPdf(template, data = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 56 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  try {
    const cintilloPath = path.join(__dirname, '..', 'uploads', 'cintillos', 'cintillo6.png');
    if (fs.existsSync(cintilloPath)) {
      doc.image(cintilloPath, 56, 30, { width: 500 });
      doc.moveDown(4);
    }
  } catch (e) {
    console.error('Error añadiendo cintillo al PDF:', e.message);
  }

  doc.font('Times-Roman').fillColor('#111111');
  doc.fontSize(15).text(replacePlaceholders(template.encabezado, data), { align: 'center' });

  doc.moveDown(0.3).fontSize(14).text(replacePlaceholders(template.subtitulo, data), { align: 'center' });
  doc.moveDown(1.2).fontSize(12).text(replacePlaceholders(template.ciudad_fecha, data), { align: 'right' });
  doc.moveDown(1);
  template.cuerpo.forEach((line) => {
    doc.fontSize(12).text(replacePlaceholders(line, data), { align: 'justify', lineGap: 4 });
    doc.moveDown(0.6);
  });
  doc.moveDown(1.2).fontSize(12).text(replacePlaceholders(template.firma, data), { align: 'left', lineGap: 4 });
  doc.moveDown(1.2).fontSize(10).fillColor('#444444').text(replacePlaceholders(template.pie, data), { align: 'left' });
  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function formatDateIso(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

function mapExtranjeroToTemplateData(detail = {}) {
  return {
    destinatario: 'A QUIEN PUEDA INTERESAR',
    nombre_becario: detail.nombres_apellidos || '',
    cedula: detail.cedula || '',
    pasaporte: detail.pasaporte || '',
    nacionalidad: detail.nacionalidad || detail.pais_origen || '',
    programa: detail.programa_estudio || '',
    institucion: detail.institucion || '',
    pais_destino: 'Venezuela',
    fecha_inicio: detail.anio_ingreso ? `${detail.anio_ingreso}-01-01` : '',
    fecha_fin: '',
    duracion: detail.semestre_actual ? `Semestre ${detail.semestre_actual}` : '',
    monto_beca: '',
    fecha_emision: formatDateIso(new Date()),
    firmante_nombre: 'Nombre del Responsable',
    firmante_cargo: 'Coordinacion de Becas Internacionales',
    numero_constancia: detail.id_becario ? `EXT-VEN-${detail.id_becario}` : '',
    observaciones: detail.observaciones || 'Sin observaciones'
  };
}

async function listExtranjerosForConstancia(filters = {}) {
  const rows = await extranjerosService.listarExtranjeros(filters);
  return (rows || []).map((row) => ({
    id_becario: row.id_becario,
    id_usuario: row.id_usuario,
    nombres_apellidos: row.nombres_apellidos,
    cedula: row.cedula,
    pasaporte: row.pasaporte,
    correo: row.correo,
    institucion: row.institucion,
    programa_estudio: row.programa_estudio,
    pais_origen: row.pais_origen
  }));
}

async function getConstanciaDataFromBecario(id) {
  const detail = await extranjerosService.detalleExtranjero(id);
  if (!detail) {
    const error = new Error('Becario extranjero no encontrado');
    error.status = 404;
    throw error;
  }
  return { becario: detail, data: mapExtranjeroToTemplateData(detail) };
}

function previewConstancia(data = {}, customTemplate = null) {
  const template = customTemplate ? normalizeTemplate(customTemplate) : getTemplate();
  return { template, html: buildHtml(template, data) };
}

function generateConstancia(data = {}, options = {}) {
  const template = options.template ? normalizeTemplate(options.template) : getTemplate();
  const html = buildHtml(template, data);
  const filename = options.filename || `constancia_internacional_${Date.now()}.html`;
  return { filename, mimeType: 'text/html; charset=utf-8', html };
}

async function generateConstanciaPdf(data = {}, options = {}) {
  const template = options.template ? normalizeTemplate(options.template) : getTemplate();
  const buffer = await buildPdf(template, data);
  const filename = options.filename || `constancia_internacional_${Date.now()}.pdf`;
  return { filename, mimeType: 'application/pdf', buffer };
}

module.exports = {
  PLACEHOLDERS,
  getTemplate,
  saveTemplate,
  previewConstancia,
  generateConstancia,
  generateConstanciaPdf,
  listExtranjerosForConstancia,
  getConstanciaDataFromBecario
};
