const { Usuario, CatRoles } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const roles = await CatRoles.findAll();
        console.log('Roles disponibles:', roles.map(r => ({ id: r.id, codigo: r.codigo, nombre: r.nombre })));

        const adminRole = roles.find(r => r.codigo === 'ADMIN' || r.nombre.toUpperCase().includes('ADMIN'));
        
        if (!adminRole) {
            console.error('No se encontró el rol ADMIN. Por favor, verifica los roles disponibles e intenta de nuevo con el ID correcto.');
            process.exit(1);
        }

        console.log(`Usando rol ADMIN con ID: ${adminRole.id}`);

        const adminData = {
            cedula: '12345678', // Puedes cambiar estos valores si lo deseas
            nacionalidad: 'V',
            email: 'admin@fundayacucho.gob.ve',
            nombre_completo: 'Administrador Sistema',
            password: await bcrypt.hash('admin123456', 10),
            id_rol: adminRole.id,
            tipo_usuario: 'ADMIN',
            activo: true
        };

        const [user, created] = await Usuario.findOrCreate({
            where: { email: adminData.email },
            defaults: adminData
        });

        if (created) {
            console.log('Usuario administrador creado exitosamente.');
            console.log(`Email: ${adminData.email}`);
            console.log('Password: admin123456');
        } else {
            console.log('El usuario ya existe. Actualizando datos...');
            await user.update(adminData);
            console.log('Usuario actualizado correctamente.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error al crear el administrador:', error);
        process.exit(1);
    }
}

createAdmin();
