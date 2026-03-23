CREATE TABLE IF NOT EXISTS constancias_log (
  id          SERIAL PRIMARY KEY,
  id_becario  TEXT        NOT NULL,
  firmante    TEXT,
  generado_por TEXT,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
