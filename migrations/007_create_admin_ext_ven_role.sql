-- Reparar secuencia por si está desincronizada
SELECT setval('cat_roles_id_seq', (SELECT MAX(id) FROM cat_roles));

-- Insertar rol ADMIN_EXT_VEN si no existe
INSERT INTO cat_roles (codigo, nombre, descripcion)
VALUES (
  'ADMIN_EXT_VEN',
  'Admin Extranjeros Venezuela',
  'Acceso a estadísticas y gestión de extranjeros en Venezuela'
)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar permisos del rol (ver=true, resto false) si no existen
INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
SELECT id, true, false, false, false
FROM cat_roles
WHERE codigo = 'ADMIN_EXT_VEN'
  AND NOT EXISTS (
    SELECT 1 FROM permisos_rol pr
    JOIN cat_roles cr ON pr.rol_id = cr.id
    WHERE cr.codigo = 'ADMIN_EXT_VEN'
  );
