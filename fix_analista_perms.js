const { CatRoles, PermisosRol } = require('./models');

async function fixAnalistaPerms() {
  try {
    const rol = await CatRoles.findOne({ where: { codigo: 'ANALISTA' } });
    if (!rol) {
      console.log('Rol ANALISTA no encontrado en CatRoles.');
      return;
    }

    const [permisos, created] = await PermisosRol.findOrCreate({
      where: { rol_id: rol.id },
      defaults: {
        rol_id: rol.id,
        ver: true,
        crear: true,
        editar: true,
        borrar: false // Usualmente analistas no borran, pero si el usuario quiere, lo ponemos true
      }
    });

    if (!created) {
      await permisos.update({
        ver: true,
        crear: true,
        editar: true,
        borrar: true // Activamos todo segun peticion del usuario ("editar borra o crear")
      });
      console.log('Permisos del rol ANALISTA actualizados a TRUE.');
    } else {
      console.log('Permisos del rol ANALISTA creados con éxito.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error al corregir permisos de ANALISTA:', err);
    process.exit(1);
  }
}

fixAnalistaPerms();
