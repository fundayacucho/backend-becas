-- Migration: Create permisos_rol table
-- Description: Table to store permissions for each role
-- Version: 005

CREATE TABLE IF NOT EXISTS permisos_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL,
    ver BOOLEAN DEFAULT true,
    crear BOOLEAN DEFAULT false,
    editar BOOLEAN DEFAULT false,
    borrar BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_permisos_rol_cat_roles FOREIGN KEY (rol_id) REFERENCES cat_roles(id) ON DELETE CASCADE,
    CONSTRAINT unique_rol_permiso UNIQUE (rol_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permisos_rol_rol_id ON permisos_rol(rol_id);

-- Insert default permissions for existing roles
INSERT INTO permisos_rol (rol_id, ver, crear, editar, borrar)
SELECT 
    id,
    CASE 
        WHEN codigo = 'ADMIN' THEN true
        ELSE true
    END as ver,
    CASE 
        WHEN codigo = 'ADMIN' THEN true
        ELSE false
    END as crear,
    CASE 
        WHEN codigo = 'ADMIN' THEN true
        ELSE false
    END as editar,
    CASE 
        WHEN codigo = 'ADMIN' THEN true
        ELSE false
    END as borrar
FROM cat_roles
WHERE id NOT IN (SELECT rol_id FROM permisos_rol);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_permisos_rol_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_permisos_rol_updated_at
    BEFORE UPDATE ON permisos_rol
    FOR EACH ROW
    EXECUTE FUNCTION update_permisos_rol_updated_at();
