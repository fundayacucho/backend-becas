-- Agregar columnas comuna y codigoestado2 a la tabla becarios_unificados si no existen
DO $$
BEGIN
    -- Agregar columna comuna si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='becarios_unificados' AND column_name='comuna'
    ) THEN
        ALTER TABLE becarios_unificados ADD COLUMN comuna VARCHAR(100);
        RAISE NOTICE 'Columna comuna agregada a becarios_unificados';
    ELSE
        RAISE NOTICE 'La columna comuna ya existe en becarios_unificados';
    END IF;

    -- Agregar columna codigoestado2 si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='becarios_unificados' AND column_name='codigoestado2'
    ) THEN
        ALTER TABLE becarios_unificados ADD COLUMN codigoestado2 VARCHAR(10);
        RAISE NOTICE 'Columna codigoestado2 agregada a becarios_unificados';
    ELSE
        RAISE NOTICE 'La columna codigoestado2 ya existe en becarios_unificados';
    END IF;
END $$;
