-- Agregar columna comuna a la tabla becarios_unificados si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='becarios_unificados' AND column_name='comuna'
    ) THEN
        ALTER TABLE becarios_unificados ADD COLUMN comuna VARCHAR(100);
        RAISE NOTICE 'Columna comuna agregada a becarios_unificados';
    ELSE
        RAISE NOTICE 'La columna comuna ya existe en becarios_unificados';
    END IF;
END $$;
