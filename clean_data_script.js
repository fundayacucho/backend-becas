const { 
    sequelize, 
    BecarioUnificado, 
    EstudioBecario, 
    DocumentoBecario, 
    InfoMigratoria, 
    Usuario 
} = require('./models');

async function cleanDatabase() {
    try {
        console.log('Iniciando limpieza de base de datos...');

        // 1. Eliminar datos en orden de dependencia (hijos primero)
        console.log('Limpiando estudios, documentos e info migratoria...');
        await DocumentoBecario.destroy({ where: {}, truncate: false });
        await EstudioBecario.destroy({ where: {}, truncate: false });
        await InfoMigratoria.destroy({ where: {}, truncate: false });

        // 2. Eliminar becarios
        console.log('Limpiando becarios unificados...');
        await BecarioUnificado.destroy({ where: {}, truncate: false });

        // 3. Eliminar usuarios (excepto el admin que acabamos de crear o los que tengan rol ADMIN)
        console.log('Limpiando usuarios (preservando administradores)...');
        // Asuma que el rol ADMIN es id_rol = 2, pero mejor buscamos por el correo del admin o roles
        const { CatRoles } = require('./models');
        const adminRole = await CatRoles.findOne({ where: { codigo: 'ADMIN' } });
        
        if (adminRole) {
            await Usuario.destroy({
                where: {
                    id_rol: { [require('sequelize').Op.ne]: adminRole.id }
                }
            });
            console.log('Usuarios no administradores eliminados.');
        } else {
            console.log('No se encontró el rol ADMIN, omitiendo eliminación selectiva de usuarios para evitar pérdida de acceso.');
        }

        console.log('=== LIMPIEZA COMPLETADA EXITOSAMENTE ===');
        console.log('La base de datos está lista para nuevos registros.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la limpieza de la base de datos:', error);
        process.exit(1);
    }
}

cleanDatabase();
