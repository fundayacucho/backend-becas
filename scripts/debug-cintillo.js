const fs = require('fs');
const path = require('path');

const cintilloPath = path.join(__dirname, '..', 'uploads', 'cintillos', 'cintillo6.png');

console.log('Ruta buscada:', cintilloPath);
console.log('Existe:', fs.existsSync(cintilloPath));

if (fs.existsSync(cintilloPath)) {
    const stats = fs.statSync(cintilloPath);
    console.log('Tamaño:', stats.size, 'bytes');
} else {
    // Probar rutas alternativas
    const altPath = path.join(__dirname, 'uploads', 'cintillos', 'cintillo6.png');
    console.log('Probando ruta alternativa:', altPath);
    console.log('Existe en ruta alternativa:', fs.existsSync(altPath));
}
