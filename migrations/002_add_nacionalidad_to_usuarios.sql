DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'nacionalidad'
  ) THEN
    ALTER TABLE public.usuarios
      ADD COLUMN nacionalidad VARCHAR(1) NOT NULL DEFAULT 'V';
  END IF;
END $$;

UPDATE public.usuarios
SET nacionalidad = 'V'
WHERE nacionalidad IS NULL OR TRIM(nacionalidad) = '';
