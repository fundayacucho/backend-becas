# Estructura de la Base de Datos: becario_newBecarios

Este documento detalla las tablas y columnas de la base de datos `becario_newBecarios`.

## Resumen de Tablas
- `becarios`: Información principal de los becarios.
- `datos_egresados`: Información detallada de egresados.
- `tbl_becario_exterior`: Becarios localizados en el exterior.
- `tbl_carreras`: Catálogo de carreras.
- `tbl_egresado`: Datos básicos de egresados.
- `tbl_estado`: Catálogo de estados de Venezuela.
- `tbl_municipio`: Catálogo de municipios.
- `tbl_parroquia`: Catálogo de parroquias.
- `tbl_pais`: Catálogo de países.
- `tbl_uner`: Información de instituciones (U.N.E.R).
- `usuarios`: Gestión de acceso y roles.

---

## Detalle de Tablas

### `becarios`
| Columna | Tipo de Dato | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id_becario` | integer | NO | nextval('becarios_id_becario_seq') |
| `id_usuario` | varchar(100) | SÍ | '' |
| `nombres_apellidos` | varchar(200) | NO | |
| `cedula` | varchar(20) | NO | |
| `fecha_nacimiento` | date | SÍ | |
| `genero` | varchar(20) | SÍ | '' |
| `nacionalidad` | varchar(100) | SÍ | '' |
| `correo` | varchar(150) | NO | |
| `telefono_principal` | varchar(20) | SÍ | '' |
| `telefono_alternativo` | varchar(20) | SÍ | '' |
| `comuna` | varchar(100) | SÍ | '' |
| `direccion` | text | SÍ | '' |
| `institucion` | integer | SÍ | |
| `programa_estudio` | varchar(200) | SÍ | '' |
| `anio_ingreso` | date | SÍ | |
| `semestre_actual` | varchar(2) | SÍ | |
| `turno_estudio` | varchar(50) | SÍ | '' |
| `modalidad_estudio` | varchar(50) | SÍ | '' |
| `programa_beca` | varchar(100) | SÍ | '' |
| `estado_beca` | varchar(50) | SÍ | '' |
| `tipo_tarea` | varchar(100) | SÍ | '' |
| `dependencia` | varchar(200) | SÍ | '' |
| `anexo_cedula` | varchar(500) | SÍ | |
| `anexo_constancia` | varchar(500) | SÍ | |
| `anexo_residencia` | varchar(500) | SÍ | |
| `anexo_foto` | varchar(500) | SÍ | |
| `codigo_estado` | varchar(10) | SÍ | '' |
| `codigo_municipio` | varchar(10) | SÍ | '' |
| `codigo_parroquia` | varchar(10) | SÍ | '' |
| `latitud` | varchar(50) | SÍ | '' |
| `longitud` | varchar(50) | SÍ | '' |
| `fecha_registro` | timestamp | SÍ | CURRENT_TIMESTAMP |
| `fecha_actualizacion` | timestamp | SÍ | CURRENT_TIMESTAMP |
| `contrato_convenio` | text | SÍ | |
| `constancia_semestre` | text | SÍ | |
| `codigoestado2` | varchar(2) | SÍ | |
| `nivel_academico` | text | SÍ | |

### `usuarios`
| Columna | Tipo de Dato | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | integer | NO | nextval('usuarios_id_seq') |
| `id_rol` | integer | SÍ | |
| `cedula` | integer | SÍ | |
| `nacionalidad` | varchar(1) | SÍ | |
| `email` | varchar(100) | NO | |
| `tipo_usuario` | varchar(1) | SÍ | |
| `password` | varchar(255) | NO | |
| `created_at` | timestamp | SÍ | CURRENT_TIMESTAMP |

### `tbl_egresado`
| Columna | Tipo de Dato | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | integer | NO | nextval('tbl_egresado_id_seq') |
| `nombre_completo` | varchar(100) | SÍ | |
| `cedula` | varchar(15) | SÍ | |
| `correo` | varchar(100) | SÍ | |
| `telefono_celular` | varchar(20) | SÍ | |
| `telefono_alternativo` | varchar(20) | SÍ | |
| `fecha_nacimiento` | date | SÍ | |
| `estado` | varchar(50) | SÍ | |
| `municipio` | varchar(50) | SÍ | |
| `parroquia` | varchar(50) | SÍ | |
| `tipo_beca` | varchar(30) | SÍ | |
| `carrera_cursada` | varchar(100) | SÍ | |
| `fecha_ingreso` | date | SÍ | |
| `fecha_egreso` | date | SÍ | |
| `titularidad` | varchar(30) | SÍ | |
| `idiomas` | text | SÍ | |
| `cod_estado` | varchar(5) | SÍ | |
| `ocupacion_actual` | varchar(100) | SÍ | |
| `becario_internacional_venezuela` | boolean | SÍ | false |
| `becario_venezolano_venezuela` | boolean | SÍ | false |
| `becario_venezolano_exterior` | boolean | SÍ | false |
| `universidad` | varchar(150) | SÍ | |
| `fecha_registro` | date | SÍ | |
| `codigoestado` | char(2) | SÍ | |
| `codigomunicipio` | varchar(4) | SÍ | |
| `codigoparroquia` | varchar(6) | SÍ | |
| `latitud` | text | SÍ | |
| `longitud` | text | SÍ | |
| `direccion` | text | SÍ | |
| `becario_tipo` | text | SÍ | |
| `codigoestado2` | char(2) | SÍ | |
| `es_militar` | varchar(2) | SÍ | |
| `descripcion_becario` | text | SÍ | |
| `trabajando` | varchar(2) | SÍ | |
| `latitud_pais` | text | SÍ | |
| `longitud_pais` | text | SÍ | |

### `tbl_becario_exterior`
| Columna | Tipo de Dato | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id_usuario` | varchar(50) | NO | |
| `nombres_apellidos` | varchar(255) | NO | |
| `cedula` | varchar(20) | NO | |
| `pasaporte` | varchar(20) | NO | |
| `fecha_nacimiento` | date | SÍ | |
| `genero` | varchar(20) | SÍ | |
| `nacionalidad` | varchar(100) | SÍ | |
| `correo` | varchar(255) | SÍ | |
| `telefono_principal` | varchar(20) | SÍ | |
| `telefono_alternativo` | varchar(20) | SÍ | |
| `nombre_representante` | varchar(255) | SÍ | |
| `parentesco` | varchar(50) | SÍ | |
| `institucion` | varchar(255) | SÍ | |
| `tipo_becario` | varchar(100) | SÍ | |
| `pais_procedencia` | varchar(100) | SÍ | |
| `carrera` | varchar(255) | SÍ | |
| `titularidad` | varchar(100) | SÍ | |
| `anio_ingreso` | date | SÍ | |
| `institucion_academica` | varchar(100) | SÍ | |
| `tipo_tarea` | varchar(100) | SÍ | |
| `dependencia` | varchar(255) | SÍ | |
| `anexo_cedula` | varchar(500) | SÍ | |
| `anexo_constancia` | varchar(500) | SÍ | |
| `anexo_residencia` | varchar(500) | SÍ | |
| `anexo_foto` | varchar(500) | SÍ | |
| `contrato_convenio` | varchar(500) | SÍ | |
| `codigoestado` | varchar(2) | SÍ | |
| `codigomunicipio` | varchar(4) | SÍ | |
| `codigoparroquia` | varchar(6) | SÍ | |
| `latitud` | varchar(50) | SÍ | |
| `longitud` | varchar(50) | SÍ | |
| `latitud_pais` | varchar(50) | SÍ | |
| `longitud_pais` | varchar(50) | SÍ | |
| `fecha_creacion` | timestamp | SÍ | CURRENT_TIMESTAMP |
| `nivel_academico` | text | SÍ | |
| `semestre_actual` | integer | SÍ | |

### `tbl_estado`
| Columna | Tipo de Dato | Nullable |
| :--- | :--- | :--- |
| `codigoestado` | char(2) | NO |
| `nombre` | varchar(50) | NO |
| `activo` | integer | SÍ |
| `longitud` | text | SÍ |
| `latitud` | text | SÍ |

### `tbl_municipio`
| Columna | Tipo de Dato | Nullable |
| :--- | :--- | :--- |
| `codigoestado` | char(2) | NO |
| `codigomunicipio` | varchar(4) | NO |
| `nombre` | varchar(50) | NO |
| `longitud` | text | SÍ |
| `latitud` | text | SÍ |

### `tbl_parroquia`
| Columna | Tipo de Dato | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `codigoestado` | char(4) | NO | |
| `codigomunicipio` | varchar(4) | NO | |
| `codigoparroquia` | varchar(6) | NO | |
| `nombre` | varchar(50) | NO | |
| `prioridad` | integer | SÍ | 0 |
| `longitud` | text | SÍ | |
| `latitud` | text | SÍ | |

### `tbl_pais`
| Columna | Tipo de Dato | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | integer | NO | nextval('tbl_pais_id_seq') |
| `nombre_pais` | char(200) | SÍ | |
| `continente` | char(200) | SÍ | |
| `capital` | char(200) | SÍ | |
| `latitud` | varchar(50) | SÍ | |
| `longitud` | varchar(50) | SÍ | |
| `fecha_creacion` | timestamp | SÍ | CURRENT_TIMESTAMP |
| `activo` | boolean | SÍ | true |

### `tbl_uner`
| Columna | Tipo de Dato | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `nombre_uner` | varchar(250) | SÍ |
| `codigo` | integer | SÍ |
| `codigoestado` | varchar(2) | SÍ |
| `codigomunicipio` | varchar(4) | SÍ |
| `codigoparraquia` | varchar(6) | SÍ |

### `tbl_carreras`
| Columna | Tipo de Dato | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `cod_nuc_unv` | integer | SÍ |
| `codigo` | integer | SÍ |
| `carreras` | varchar(250) | SÍ |
