// scripts/migrateFiles.js
const fs = require('fs');
const path = require('path');

const migrateFiles = async () => {
  const sourceDir = path.join(__dirname, '../uploads');
  const targetDir = path.join(__dirname, '../public_html/uploads');
  
  try {
    // Copiar estructura completa
    const copyDir = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      
      files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copiado: ${file}`);
        }
      });
    };
    
    copyDir(sourceDir, targetDir);
    console.log('Migración completada');
    
  } catch (error) {
    console.error('Error en migración:', error);
  }
};

migrateFiles();