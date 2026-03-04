#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Importar funciones del fileManager
const { getManagedDirs, ensureDirectories } = require('../utils/fileManager');

console.log('🔍 Verificando permisos de directorios de uploads...\n');

try {
  const dirs = getManagedDirs();
  
  console.log('Directorios configurados:');
  Object.entries(dirs).forEach(([name, path]) => {
    console.log(`  ${name}: ${path}`);
  });
  console.log('');

  // Verificar cada directorio
  for (const [name, dirPath] of Object.entries(dirs)) {
    console.log(`📁 Verificando ${name}: ${dirPath}`);
    
    try {
      // Verificar si existe
      const exists = fs.existsSync(dirPath);
      console.log(`  ✅ Existe: ${exists}`);
      
      if (exists) {
        // Verificar permisos
        const stats = fs.statSync(dirPath);
        console.log(`  📊 Es directorio: ${stats.isDirectory()}`);
        console.log(`  🔑 Modo: ${stats.mode.toString(8)}`);
        console.log(`  👤 UID: ${stats.uid} (proceso: ${process.getuid ? process.getuid() : 'N/A'})`);
        console.log(`  👥 GID: ${stats.gid} (proceso: ${process.getgid ? process.getgid() : 'N/A'})`);
        
        // Verificar permisos de acceso
        try {
          fs.accessSync(dirPath, fs.constants.R_OK);
          console.log(`  ✅ Lectura: OK`);
        } catch (e) {
          console.log(`  ❌ Lectura: DENEGADO`);
        }
        
        try {
          fs.accessSync(dirPath, fs.constants.W_OK);
          console.log(`  ✅ Escritura: OK`);
        } catch (e) {
          console.log(`  ❌ Escritura: DENEGADO`);
        }
        
        try {
          fs.accessSync(dirPath, fs.constants.X_OK);
          console.log(`  ✅ Ejecución: OK`);
        } catch (e) {
          console.log(`  ❌ Ejecución: DENEGADO`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Intentar crear directorios si no existen
  console.log('🔨 Intentando asegurar directorios...');
  try {
    ensureDirectories();
    console.log('✅ Directorios asegurados exitosamente');
  } catch (error) {
    console.log(`❌ Error al asegurar directorios: ${error.message}`);
    console.log('\n💡 Soluciones sugeridas:');
    console.log('1. Ejecutar: sudo chown -R $USER:$USER /home/fundaya/becarios/backend-becas/uploads');
    console.log('2. Ejecutar: sudo chmod -R 755 /home/fundaya/becarios/backend-becas/uploads');
    console.log('3. Verificar que el proceso Node.js se ejecuta con el usuario correcto');
  }

} catch (error) {
  console.error(`Error general: ${error.message}`);
}

console.log('\n🏁 Fin del diagnóstico');
