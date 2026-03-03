// config/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear la carpeta de uploads si no existe
const uploadBase = process.env.UPLOAD_BASE_DIR
  ? path.resolve(process.env.UPLOAD_BASE_DIR)
  : path.join(__dirname, '../uploads');
const uploadDir = path.join(uploadBase, 'becarios');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtrar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes y documentos PDF/DOC'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite por archivo
  },
  fileFilter: fileFilter
});

module.exports = upload;
