const PermisosRol = require('../models/PermisosRol');
const CatRoles = require('../models/CatRoles');
const { sequelize } = require('../config/database');

// Obtener todos los permisos
exports.getPermisos = async (req, res) => {
  try {
    const permisos = await PermisosRol.findAll({
      include: [
        {
          model: CatRoles,
          as: 'rol',
          attributes: ['id', 'codigo', 'nombre']
        }
      ],
      order: [
        [{ model: CatRoles, as: 'rol' }, 'nombre', 'ASC']
      ]
    });

    // Formatear la respuesta para que sea más fácil de consumir por el frontend
    const permisosFormateados = permisos.map(p => ({
      id: p.id,
      rol_id: p.rol_id,
      rol_codigo: p.rol ? p.rol.codigo : null,
      rol_nombre: p.rol ? p.rol.nombre : null,
      permisos: {
        ver: p.ver,
        crear: p.crear,
        editar: p.editar,
        borrar: p.borrar
      }
    }));

    return res.status(200).json({
      success: true,
      data: permisosFormateados
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener permisos',
      message: error.message 
    });
  }
};

// Obtener permisos por rol específico
exports.getPermisosPorRol = async (req, res) => {
  try {
    const { rol_id } = req.params;

    const permisos = await PermisosRol.findOne({
      where: { rol_id },
      include: [
        {
          model: CatRoles,
          as: 'rol',
          attributes: ['id', 'codigo', 'nombre']
        }
      ]
    });

    if (!permisos) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron permisos para este rol'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: permisos.id,
        rol_id: permisos.rol_id,
        rol_codigo: permisos.rol ? permisos.rol.codigo : null,
        rol_nombre: permisos.rol ? permisos.rol.nombre : null,
        permisos: {
          ver: permisos.ver,
          crear: permisos.crear,
          editar: permisos.editar,
          borrar: permisos.borrar
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener permisos por rol:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener permisos por rol',
      message: error.message 
    });
  }
};

// Actualizar permisos de un rol
exports.updatePermisos = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { rol_id, permisos } = req.body;

    // Validaciones
    if (!rol_id || !permisos) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Se requieren rol_id y permisos'
      });
    }

    // Validar que el rol exista
    const rolExistente = await CatRoles.findByPk(rol_id, { transaction: t });
    if (!rolExistente) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'El rol especificado no existe'
      });
    }

    // Validar estructura de permisos
    const permisosValidados = {
      ver: permisos.ver !== undefined ? Boolean(permisos.ver) : true,
      crear: Boolean(permisos.crear || false),
      editar: Boolean(permisos.editar || false),
      borrar: Boolean(permisos.borrar || false)
    };

    // Buscar si ya existen permisos para este rol
    const permisosExistentes = await PermisosRol.findOne({
      where: { rol_id },
      transaction: t
    });

    let resultado;
    if (permisosExistentes) {
      // Actualizar permisos existentes
      resultado = await PermisosRol.update(
        permisosValidados,
        {
          where: { rol_id },
          returning: true,
          transaction: t
        }
      );
    } else {
      // Crear nuevos permisos
      resultado = await PermisosRol.create(
        {
          rol_id,
          ...permisosValidados
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Obtener los permisos actualizados para devolverlos
    const permisosActualizados = await PermisosRol.findOne({
      where: { rol_id },
      include: [
        {
          model: CatRoles,
          as: 'rol',
          attributes: ['id', 'codigo', 'nombre']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      data: {
        id: permisosActualizados.id,
        rol_id: permisosActualizados.rol_id,
        rol_codigo: permisosActualizados.rol ? permisosActualizados.rol.codigo : null,
        rol_nombre: permisosActualizados.rol ? permisosActualizados.rol.nombre : null,
        permisos: {
          ver: permisosActualizados.ver,
          crear: permisosActualizados.crear,
          editar: permisosActualizados.editar,
          borrar: permisosActualizados.borrar
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar permisos:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al actualizar permisos',
      message: error.message 
    });
  }
};

// Obtener todos los roles con sus permisos (para el frontend)
exports.getRolesConPermisos = async (req, res) => {
  try {
    const roles = await CatRoles.findAll({
      include: [
        {
          model: PermisosRol,
          as: 'permisos',
          required: false // LEFT JOIN para incluir roles sin permisos
        }
      ],
      order: [
        ['nombre', 'ASC']
      ]
    });

    const rolesFormateados = roles.map(rol => ({
      id: rol.id,
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos ? {
        id: rol.permisos.id,
        ver: rol.permisos.ver,
        crear: rol.permisos.crear,
        editar: rol.permisos.editar,
        borrar: rol.permisos.borrar
      } : null
    }));

    return res.status(200).json({
      success: true,
      data: rolesFormateados
    });
  } catch (error) {
    console.error('Error al obtener roles con permisos:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener roles con permisos',
      message: error.message 
    });
  }
};
