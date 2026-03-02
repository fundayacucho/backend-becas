-- Add contrato_convenio column to becarios table
ALTER TABLE becarios ADD COLUMN IF NOT EXISTS contrato_convenio TEXT;
