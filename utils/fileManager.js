const fs = require('fs');
const path = require('path');

function getUploadBaseDir() {
  const fromEnv = process.env.UPLOAD_BASE_DIR;
  if (fromEnv && String(fromEnv).trim()) {
    return path.resolve(fromEnv);
  }
  return path.resolve(__dirname, '../uploads');
}

function getManagedDirs() {
  const base = getUploadBaseDir();
  return {
    base,
    becarios: path.join(base, 'becarios'),
    anexos: path.join(base, 'becarios', 'anexos'),
    fotos: path.join(base, 'becarios', 'fotos'),
    constancias: path.join(base, 'becarios', 'constancias')
  };
}

function ensureDirectories() {
  const dirs = Object.values(getManagedDirs());
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
  }
}

function resolveSubfolder(folder) {
  if (!folder) return null;
  const normalized = String(folder).replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/anexos') || normalized.endsWith('anexos')) return 'anexos';
  if (normalized.includes('/fotos') || normalized.endsWith('fotos')) return 'fotos';
  if (normalized.includes('/constancias') || normalized.endsWith('constancias')) return 'constancias';
  return null;
}

function buildPublicPath(subfolder, fileName) {
  return `/uploads/becarios/${subfolder}/${fileName}`;
}

function publicPathToDiskPath(publicPath) {
  if (!publicPath) return null;
  const cleaned = String(publicPath).replace(/\\/g, '/').replace(/^\/+/, '');
  return path.join(getUploadBaseDir(), cleaned.replace(/^uploads\//, ''));
}

function moveFileToFolder(file, folder, cedula, tipo) {
  const subfolder = resolveSubfolder(folder);
  if (!subfolder) {
    throw new Error('Subcarpeta de destino no valida para adjunto');
  }

  const extension = path.extname(file.originalname || '');
  const fileName = `${cedula}_${tipo}${extension}`;
  const dirs = getManagedDirs();
  const targetPath = path.join(dirs[subfolder], fileName);
  const publicPath = buildPublicPath(subfolder, fileName);

  ensureDirectories();
  fs.renameSync(file.path, targetPath);
  fs.chmodSync(targetPath, 0o644);

  return publicPath;
}

function deleteFile(targetPath) {
  if (!targetPath) return;
  const diskPath = targetPath.startsWith('/uploads/') ? publicPathToDiskPath(targetPath) : targetPath;
  if (diskPath && fs.existsSync(diskPath)) {
    fs.unlinkSync(diskPath);
  }
}

function cleanupUploadedTempFiles(files) {
  if (!files) return;
  Object.values(files).forEach((fileArray) => {
    fileArray.forEach((file) => {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  });
}

function toPublicUrl(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const base = process.env.BASE_URL || 'http://localhost:3001';
  const normalizedBase = /^https?:\/\//i.test(base) ? base : `http://${base}`;
  const normalizedPath = String(filePath).replace(/\\/g, '/');
  return `${normalizedBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
}

module.exports = {
  ensureDirectories,
  getManagedDirs,
  moveFileToFolder,
  deleteFile,
  cleanupUploadedTempFiles,
  toPublicUrl,
  publicPathToDiskPath
};
