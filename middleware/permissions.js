const PermisosRol = require('../models/PermisosRol');

/**
 * Middleware para verificar permisos específicos de un usuario
 * @param {string} requiredAction - La acción requerida ('ver', 'crear', 'editar', 'borrar')
 * @returns {Function} Middleware function
 */
const requirePermission = (requiredAction) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado y tenga rol_id
      if (!req.user || !req.user.id_rol) {
        return res.status(403).json({ 
          success: false,
          message: 'Usuario no autenticado o sin rol asignado' 
        });
      }

      // Obtener los permisos del rol del usuario
      let permisos = await PermisosRol.findOne({
        where: { rol_id: req.user.id_rol }
      });

      // Si no hay fila configurada, crear defaults según nivel del rol
      if (!permisos) {
        const esRolAdmin = ['ADMIN', 'SUPERVISOR', 'ADMIN_EXT_VEN', 'ANALISTA'].includes(req.user.rol_codigo);
        permisos = await PermisosRol.create({
          rol_id: req.user.id_rol,
          ver:    true,
          crear:  esRolAdmin,
          editar: esRolAdmin,
          borrar: esRolAdmin
        });
      }

      // Verificar si el usuario tiene el permiso requerido
      if (permisos[requiredAction] !== true) {
        return res.status(403).json({ 
          success: false,
          message: `No tienes permiso para ${requiredAction} este recurso` 
        });
      }

      // Si tiene el permiso, continuar con la siguiente función
      next();
    } catch (error) {
      console.error('Error validando permisos:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error validando permisos',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware para verificar múltiples permisos
 * @param {string[]} requiredActions - Array de acciones requeridas
 * @param {string} operator - Operador lógico ('AND' u 'OR'). Default: 'AND'
 * @returns {Function} Middleware function
 */
const requirePermissions = (requiredActions, operator = 'AND') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id_rol) {
        return res.status(403).json({ 
          success: false,
          message: 'Usuario no autenticado o sin rol asignado' 
        });
      }

      let permisos = await PermisosRol.findOne({
        where: { rol_id: req.user.id_rol }
      });

      if (!permisos) {
        const esRolAdmin = ['ADMIN', 'SUPERVISOR', 'ADMIN_EXT_VEN'].includes(req.user.rol_codigo);
        permisos = await PermisosRol.create({
          rol_id: req.user.id_rol,
          ver:    true,
          crear:  esRolAdmin,
          editar: esRolAdmin,
          borrar: esRolAdmin
        });
      }

      const resultados = requiredActions.map(action => permisos[action] === true);

      let tienePermiso;
      if (operator === 'OR') {
        tienePermiso = resultados.some(resultado => resultado === true);
      } else {
        // Default: AND
        tienePermiso = resultados.every(resultado => resultado === true);
      }

      if (!tienePermiso) {
        const accionesStr = requiredActions.join(` ${operator} `);
        return res.status(403).json({ 
          success: false,
          message: `No tienes permisos suficientes (${accionesStr}) para esta acción` 
        });
      }

      next();
    } catch (error) {
      console.error('Error validando permisos múltiples:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error validando permisos',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario puede ver recursos (generalmente menos restrictivo)
 */
const canView = requirePermission('ver');

/**
 * Middleware para verificar si el usuario puede crear recursos
 */
const canCreate = requirePermission('crear');

/**
 * Middleware para verificar si el usuario puede editar recursos
 */
const canEdit = requirePermission('editar');

/**
 * Middleware para verificar si el usuario puede eliminar recursos
 */
const canDelete = requirePermission('borrar');

/**
 * Middleware condicional - aplica el middleware de permisos solo si se cumple una condición
 * @param {Function} condition - Función que retorna booleano basada en req
 * @param {Function} permissionMiddleware - Middleware de permisos a aplicar
 * @returns {Function} Middleware function
 */
const conditionalPermission = (condition, permissionMiddleware) => {
  return (req, res, next) => {
    if (condition(req)) {
      return permissionMiddleware(req, res, next);
    }
    next();
  };
};

module.exports = {
  requirePermission,
  requirePermissions,
  canView,
  canCreate,
  canEdit,
  canDelete,
  conditionalPermission
};
