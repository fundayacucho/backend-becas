-- Primero agregar las columnas si no existen
DO $$
BEGIN
    -- Agregar columna tipoTarea si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estudios_becario' AND column_name='tipoTarea'
    ) THEN
        ALTER TABLE estudios_becario ADD COLUMN "tipoTarea" VARCHAR(150);
        RAISE NOTICE 'Columna tipoTarea agregada';
    END IF;

    -- Agregar columna dependencia si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='estudios_becario' AND column_name='dependencia'
    ) THEN
        ALTER TABLE estudios_becario ADD COLUMN "dependencia" VARCHAR(150);
        RAISE NOTICE 'Columna dependencia agregada';
    END IF;
END $$;

-- Ahora poblar las columnas con valores por defecto
UPDATE estudios_becario SET "tipoTarea" = 'Estudiante', "dependencia" = 'No especificada' WHERE "tipoTarea" IS NULL OR "tipoTarea" = '' OR "dependencia" IS NULL OR "dependencia" = '';

DO $$
DECLARE updated_count INTEGER;
BEGIN
UPDATE estudios_becario SET "tipoTarea" = 'Estudiante', "dependencia" = 'No especificada' WHERE "tipoTarea" IS NULL OR "tipoTarea" = '' OR "dependencia" IS NULL OR "dependencia" = '';
GET DIAGNOSTICS updated_count = ROW_COUNT;
IF updated_count > 0 THEN
RAISE NOTICE 'Se actualizaron % registros con valores por defecto para tipoTarea y dependencia', updated_count;
ELSE
RAISE NOTICE 'Todos los registros ya tienen valores en tipoTarea y dependencia';
END IF;
END $$;
