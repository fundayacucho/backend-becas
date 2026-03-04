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
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        console.log(`Directorio creado: ${dir}`);
      }
      
      // Verificar que tenemos permisos de escritura
      fs.accessSync(dir, fs.constants.W_OK);
    } catch (error) {
      if (error.code === 'EACCES') {
        throw new Error(`Sin permisos para crear o escribir en directorio: ${dir}. Verifique ownership y permisos.`);
      } else {
        throw new Error(`Error al verificar directorio ${dir}: ${error.message}`);
      }
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

  if (!file || !file.path) {
    throw new Error('Archivo de origen invalido o sin ruta');
  }

  const extension = path.extname(file.originalname || '');
  const fileName = `${cedula}_${tipo}${extension}`;
  const dirs = getManagedDirs();
  const targetPath = path.join(dirs[subfolder], fileName);
  const publicPath = buildPublicPath(subfolder, fileName);

  // Verificar que el archivo de origen existe
  if (!fs.existsSync(file.path)) {
    throw new Error(`Archivo de origen no existe: ${file.path}`);
  }

  // Asegurar que los directorios existan con permisos correctos
  try {
    ensureDirectories();
  } catch (error) {
    throw new Error(`Error al crear directorios: ${error.message}`);
  }

  // Verificar permisos del directorio destino
  try {
    fs.accessSync(dirs[subfolder], fs.constants.W_OK);
  } catch (error) {
    throw new Error(`Sin permisos de escritura en directorio destino: ${dirs[subfolder]} - ${error.message}`);
  }

  // Intentar mover el archivo con manejo de errores
  try {
    fs.renameSync(file.path, targetPath);
  } catch (error) {
    // Si rename falla, intentar copiar y luego borrar
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      try {
        fs.copyFileSync(file.path, targetPath);
        fs.unlinkSync(file.path);
      } catch (copyError) {
        throw new Error(`Error al mover archivo (rename y copy fallaron): ${copyError.message}. Origen: ${file.path}, Destino: ${targetPath}`);
      }
    } else {
      throw new Error(`Error al mover archivo: ${error.message}. Origen: ${file.path}, Destino: ${targetPath}`);
    }
  }

  // Establecer permisos correctos al archivo destino
  try {
    fs.chmodSync(targetPath, 0o644);
  } catch (error) {
    console.warn(`Advertencia: no se pudieron establecer permisos del archivo ${targetPath}: ${error.message}`);
  }

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
