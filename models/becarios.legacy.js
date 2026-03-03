const { pool } = require('../config/database');

class Becarios {
  // Crear un nuevo becario
  static async create(becarioData) {
    const query = `
      INSERT INTO becarios (
        id_usuario, nombres_apellidos, cedula, fecha_nacimiento, genero,
        nacionalidad, correo, telefono_principal, telefono_alternativo,
        comuna, direccion, institucion, programa_estudio, anio_ingreso,
        semestre_actual, turno_estudio, modalidad_estudio, programa_beca,
        estado_beca, tipo_tarea, dependencia, anexo_cedula, anexo_constancia,
        anexo_residencia, anexo_foto, codigo_estado, codigo_municipio,
        codigo_parroquia, latitud, longitud,constancia_semestre,
        codigoestado2,nivel_academico
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,$31,$32,$33)
      RETURNING *
    `;

    const values = [
      becarioData.id_usuario || '',
      becarioData.nombres_apellidos || '',
      becarioData.cedula || '',
      becarioData.fecha_nacimiento || null,
      becarioData.genero || '',
      becarioData.nacionalidad || '',
      becarioData.correo || '',
      becarioData.telefono_principal || '',
      becarioData.telefono_alternativo || '',
      becarioData.comuna || '',
      becarioData.direccion || '',
      becarioData.institucion || '',
      becarioData.programa_estudio || '',
      becarioData.anio_ingreso || null,
      becarioData.semestre_actual || null,
      becarioData.turno_estudio || '',
      becarioData.modalidad_estudio || '',
      becarioData.programa_beca || '',
      becarioData.estado_beca || '',
      becarioData.tipo_tarea || '',
      becarioData.dependencia || '',
      becarioData.anexo_cedula || null,
      becarioData.anexo_constancia || null,
      becarioData.anexo_residencia || null,
      becarioData.anexo_foto || null,
      becarioData.codigo_estado || '',
      becarioData.codigo_municipio || '',
      becarioData.codigo_parroquia || '',
      becarioData.latitud || '',
      becarioData.longitud || '',
      becarioData.constancia_semestre || null,
      becarioData.codigoestado2 || null,
      becarioData.nivel_academico
             
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }


static async create_egresado(becarioData) {
  const query = `
    INSERT INTO datos_egresados (
      id_usuario,
      nombre_completo,
      cedula,
      correo,
      telefono_celular,
      fecha_nacimiento,
      tipo_beca,
      carrera_cursada,
      fecha_ingreso,
      fecha_egreso,
      titularidad,
      idiomas,
      cod_estado,
      ocupacion_actual,
      universidad,
      codigoestado,
      codigomunicipio,
      codigoparroquia,
      latitud,
      longitud,
      direccion,
      becario_tipo,
      codigoestado2,
      es_militar,
      descripcion_becario,
      trabajando,
      latitud_pais,
      longitud_pais
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
      $21, $22, $23, $24, $25, $26, $27, $28
    )
    RETURNING *
  `;

  // AsegÃºrate de que fecha_nacimiento tenga un valor vÃ¡lido
  if (!becarioData.fecha_nacimiento) {
    throw new Error('La fecha de nacimiento es obligatoria');
  }

  const values = [
    becarioData.id_usuario || null,
    becarioData.nombre_completo || '',
    becarioData.cedula || '',
    becarioData.correo || '',
    becarioData.telefono_celular || '',
    becarioData.fecha_nacimiento, // Este campo NO puede ser null
    becarioData.tipo_beca || '',
    becarioData.carrera_cursada || '',
    becarioData.fecha_ingreso || null,
    becarioData.fecha_egreso || null,
    becarioData.titularidad || '',
    becarioData.idiomas || null,
    becarioData.cod_estado || '',
    becarioData.ocupacion_actual || null,
    becarioData.universidad || '',
    becarioData.codigoestado || null,
    becarioData.codigomunicipio || null,
    becarioData.codigoparroquia || null,
    becarioData.latitud || null,
    becarioData.longitud || null,
    becarioData.direccion || null,
    becarioData.becario_tipo || null,
    becarioData.codigoestado2 || null,
    becarioData.es_militar || null,
    becarioData.descripcion_becario || null,
    becarioData.trabajando || null,
    becarioData.latitud_pais || null,
    becarioData.longitud_pais || null
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
}


static async create_becario_esteriol(becarioData) {
  const query = `
    INSERT INTO tbl_becario_exterior (
      id_usuario,
      nombres_apellidos,
      cedula,
      pasaporte,
      fecha_nacimiento,
      genero,
      nacionalidad,
      correo,
      telefono_principal,
      telefono_alternativo,
      nombre_representante,
      parentesco,
      institucion,
      tipo_becario,
      pais_procedencia,
      carrera,
      titularidad,
      anio_ingreso,
      semestre_actual,
      institucion_academica,
      tipo_tarea,
      dependencia,
      anexo_cedula,
      anexo_constancia,
      anexo_residencia,
      anexo_foto,
      Contrato_convenio,
      codigoestado,
      codigomunicipio,
      codigoparroquia,
      latitud,
      longitud,
      latitud_pais,
      longitud_pais,
      nivel_academico
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
      $31, $32, $33, $34, $35
    )
    RETURNING *
  `;
  // AsegÃºrate de que fecha_nacimiento tenga un valor vÃ¡lido
  if (!becarioData.fecha_nacimiento) {
    throw new Error('La fecha de nacimiento es obligatoria');
  }
  const values = [
    becarioData.id_usuario || null,
    becarioData.nombres_apellidos || '',
    becarioData.cedula || '',
    becarioData.pasaporte || '',
    becarioData.fecha_nacimiento || null,
    becarioData.genero || '',
    becarioData.nacionalidad || '',
    becarioData.correo || '',
    becarioData.telefono_principal || '',
    becarioData.telefono_alternativo || '',
    becarioData.nombre_representante || '',
    becarioData.parentesco || '',
    becarioData.institucion || '',
    becarioData.tipo_becario || '',
    becarioData.pais_procedencia || '',
    becarioData.carrera || '',
    becarioData.titularidad || '',
    becarioData.anio_ingreso || null,
    becarioData.semestre_actual || null,
    becarioData.institucion_academica || '',
    becarioData.tipo_tarea || '',
    becarioData.dependencia || '',
    becarioData.anexo_cedula || null,
    becarioData.anexo_constancia || null,
    becarioData.anexo_residencia || null,
    becarioData.anexo_foto || null,
    becarioData.Contrato_convenio || null,
    becarioData.codigoestado || '',
    becarioData.codigomunicipio || '',
    becarioData.codigoparroquia || '',
    becarioData.latitud || '',
    becarioData.longitud || '',
    becarioData.latitud_pais || '',
    becarioData.longitud_pais || '',
    becarioData.nivel_academico || ''
  ];



  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

static async update_esteriol(id_usuario, becarioData) {
  const query = `
    UPDATE tbl_becario_exterior
    SET 
    nombres_apellidos = $2,
    cedula = $3,
    pasaporte = $4,
    fecha_nacimiento = $5,
    genero = $6,
    nacionalidad = $7,
    correo = $8,
    telefono_principal = $9,
    telefono_alternativo = $10,
    nombre_representante = $11,
    parentesco = $12,
    institucion = $13,
    tipo_becario = $14,
    pais_procedencia = $15,
    institucion_academica = $16,
    carrera = $17,
    titularidad = $18,
    anio_ingreso = $19,
    semestre_actual = $20,
    tipo_tarea = $21,
    dependencia = $22,
    anexo_constancia = $23,
    anexo_residencia = $24,
    anexo_foto = $25,
    Contrato_convenio = $26,
    codigoestado = $27,
    codigomunicipio = $28,
    codigoparroquia = $29,
    latitud = $30,
    longitud = $31,
    latitud_pais = $32,
    longitud_pais = $33,
    nivel_academico = $34
    WHERE id_usuario = $1
  `;

  const values = [
    id_usuario,
    becarioData.nombres_apellidos,
    becarioData.cedula,
    becarioData.pasaporte,
    becarioData.fecha_nacimiento,
    becarioData.genero,
    becarioData.nacionalidad,
    becarioData.correo,
    becarioData.telefono_principal,
    becarioData.telefono_alternativo,
    becarioData.nombre_representante,
    becarioData.parentesco,
    becarioData.institucion,
    becarioData.tipo_becario,
    becarioData.pais_procedencia,
    becarioData.institucion_academica,
    becarioData.carrera,
    becarioData.titularidad,
    becarioData.anio_ingreso,
    becarioData.semestre_actual,
    becarioData.tipo_tarea,
    becarioData.dependencia,
    becarioData.anexo_constancia,
    becarioData.anexo_residencia,
    becarioData.anexo_foto,
    becarioData.Contrato_convenio,
    becarioData.codigoestado,
    becarioData.codigomunicipio,
    becarioData.codigoparroquia,
    becarioData.latitud,
    becarioData.longitud,
    becarioData.latitud_pais,
    becarioData.longitud_pais,
    becarioData.nivel_academico
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
}



  // Buscar por cÃ©dula o correo
  static async findByCedulaOrEmail(cedula, correo) {
    const query = `
      SELECT * FROM becarios 
      WHERE cedula = $1 OR correo = $2
    `;
    
    try {
      const result = await pool.query(query, [cedula, correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByCedulaOrEmail_esteriol(cedula, correo) {
    const query = `
      SELECT * FROM tbl_becario_exterior 
      WHERE cedula = $1 OR correo = $2
    `;
    
    try {
      const result = await pool.query(query, [cedula, correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async egresadoCedulaOrEmail(cedula, correo) {
    const query = `
      SELECT * FROM datos_egresados 
      WHERE cedula = $1 OR correo = $2
    `;
    try {
      const result = await pool.query(query, [cedula, correo]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar por ID
  static async findById(id) {
    const query = 'SELECT * FROM becarios WHERE id_becario = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Actualizar becario
  static async update(id_usuario, becarioData) {
    // First update the record
    const updateQuery = `
     UPDATE becarios SET
     nombres_apellidos = $2,
     fecha_nacimiento = $3,
     genero = $4,
     nacionalidad = $5,
     telefono_principal = $6,
     telefono_alternativo = $7,
     comuna = $8,
     direccion = $9,
     institucion = $10,
     programa_estudio = $11,
     anio_ingreso = $12,
     semestre_actual = $13,
     turno_estudio = $14,
     modalidad_estudio = $15,
     programa_beca = $16,
     estado_beca = $17,
     tipo_tarea = $18,
     dependencia = $19,
     anexo_cedula = $20,
     anexo_constancia = $21,
     anexo_residencia = $22,
     anexo_foto = $23,
     codigo_estado = $24,
     codigo_municipio = $25,
     codigo_parroquia = $26,
     latitud = $27,
     longitud = $28,
     constancia_semestre = $29,
     codigoestado2 = $30,
     nivel_academico = $31
    WHERE id_usuario = $1
    RETURNING *`;

    const values = [
      id_usuario ,
      becarioData.nombres_apellidos || '',
      becarioData.fecha_nacimiento || null,
      becarioData.genero || '',
      becarioData.nacionalidad || '',
      becarioData.telefono_principal || '',
      becarioData.telefono_alternativo || '',
      becarioData.comuna || '',
      becarioData.direccion || '',
      becarioData.institucion || '',
      becarioData.programa_estudio || '',
      becarioData.anio_ingreso || null,
      becarioData.semestre_actual || null,
      becarioData.turno_estudio || '',
      becarioData.modalidad_estudio || '',
      becarioData.programa_beca || '',
      becarioData.estado_beca || '',
      becarioData.tipo_tarea || '',
      becarioData.dependencia || '',
      becarioData.anexo_cedula || null,
      becarioData.anexo_constancia || null,
      becarioData.anexo_residencia || null,
      becarioData.anexo_foto || null,
      becarioData.codigo_estado || '',
      becarioData.codigo_municipio || '',
      becarioData.codigo_parroquia || '',
      becarioData.latitud || '',
      becarioData.longitud || '',
      becarioData.constancia_semestre || null,
      becarioData.codigoestado2 || null,
      becarioData.nivel_academico || null
    ];

    try {
      // First update the record
      await pool.query(updateQuery, values);
      
      // Then fetch the full updated record
      const selectQuery = 'SELECT * FROM becarios WHERE id_usuario = $1';
      const result = await pool.query(selectQuery, [id_usuario]);
      
      if (result.rows.length === 0) {
        throw new Error('No se pudo encontrar el becario despuÃ©s de la actualizaciÃ³n');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error en el modelo Becarios.update:', error);
      throw error;
    }
  }

  // Eliminar becario
  static async delete(id) {
    // Implementar segÃºn necesidad
  }


  static async egresadoXid(id) {
    const query = `
     SELECT 
      b.*,
      e.nombre as estado_nombre,
      m.nombre as municipio_nombre,
      p.nombre as parroquia_nombre
        FROM datos_egresados b
        INNER JOIN tbl_estado e ON e.codigoestado = b.codigoestado
        INNER JOIN tbl_municipio m ON m.codigomunicipio = b.codigomunicipio
        INNER JOIN tbl_parroquia p ON p.codigoparroquia = b.codigoparroquia
        WHERE b.cedula = $1
    `;
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

   static async becarioXid(id) {
  const query = `
    SELECT 
      b.*,
      e.nombre as estado,
      m.nombre as municipio,
      p.nombre as parroquia,
      u.nombre_uner as uner
    FROM becarios b
    INNER JOIN tbl_estado e ON e.codigoestado = b.codigo_estado
    INNER JOIN tbl_municipio m ON m.codigomunicipio = b.codigo_municipio
    INNER JOIN tbl_parroquia p ON p.codigoparroquia = b.codigo_parroquia
    INNER JOIN tbl_uner u ON u.codigo = b.institucion
    WHERE b.id_usuario = $1
  `;
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al obtener becario por ID:', error);
    throw new Error(`No se pudo obtener el becario: ${error.message}`);
  }
}


static async becarioXid_esteriol(id) {
  const query = `
    SELECT 
      b.*,
      e.nombre as estado,
      m.nombre as municipio,
      p.nombre as parroquia
    FROM tbl_becario_exterior b
    INNER JOIN tbl_estado e ON e.codigoestado = b.codigoestado
    INNER JOIN tbl_municipio m ON m.codigomunicipio = b.codigomunicipio
    INNER JOIN tbl_parroquia p ON p.codigoparroquia = b.codigoparroquia
    WHERE b.id_usuario = $1
  `;
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al obtener becario por ID:', error);
    throw new Error(`No se pudo obtener el becario: ${error.message}`);
  }
}

static async get_becariosx(codigo_estado = '', codigo_municipio = '', codigo_parroquia = '') {
  try {
    const tableName = 'becarios';
    
    let query = `SELECT b.*, 
      codigo_estado as codigoestado,
      codigo_municipio as codigomunicipio,
      codigo_parroquia as codigoparroquia,
      e.nombre as estado,
      m.nombre as municipio,
      p.nombre as parroquia
      FROM ${tableName} b
      INNER JOIN tbl_estado e ON e.codigoestado = b.codigo_estado
      INNER JOIN tbl_municipio m ON m.codigomunicipio = b.codigo_municipio
      INNER JOIN tbl_parroquia p ON p.codigoparroquia = b.codigo_parroquia
      WHERE 1=1`;
    
    const params = [];
    let paramCount = 0;
    
    if (codigo_estado) {
      paramCount++;
      query += ` AND b.codigo_estado = $${paramCount}`;
      params.push(codigo_estado);
    }
    
    if (codigo_municipio) {
      paramCount++;
      query += ` AND b.codigo_municipio = $${paramCount}`;
      params.push(codigo_municipio);
    }
    
    if (codigo_parroquia) {
      paramCount++;
      query += ` AND b.codigo_parroquia = $${paramCount}`;
      params.push(codigo_parroquia);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
    
  } catch (error) {
    console.error('Error en get_becariosx:', error);
    throw error;
  }
}


static async get_egresados(codigo_estado = '', codigo_municipio = '', codigo_parroquia = '') {
  try {
    const tableName = 'datos_egresados';
    
    let query = `SELECT b.*, 
      b.codigoestado,
      b.codigomunicipio,
      b.codigoparroquia,
      e.nombre as estado,
      m.nombre as municipio,
      p.nombre as parroquia
      FROM ${tableName} b
      INNER JOIN tbl_estado e ON e.codigoestado = b.codigoestado
      INNER JOIN tbl_municipio m ON m.codigomunicipio = b.codigomunicipio
      INNER JOIN tbl_parroquia p ON p.codigoparroquia = b.codigoparroquia
      WHERE 1=1`;
    
    const params = [];
    let paramCount = 0;
    
    if (codigo_estado) {
      paramCount++;
      query += ` AND b.codigoestado = $${paramCount}`;
      params.push(codigo_estado);
    }
    
    if (codigo_municipio) {
      paramCount++;
      query += ` AND b.codigomunicipio = $${paramCount}`;
      params.push(codigo_municipio);
    }
    
    if (codigo_parroquia) {
      paramCount++;
      query += ` AND b.codigoparroquia = $${paramCount}`;
      params.push(codigo_parroquia);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
    
  } catch (error) {
    console.error('Error en get_egresados:', error);
    throw error;
  }
}

static async get_becariosEsterior(codigoestado = '', codigomunicipio = '', codigoparroquia = '') {
   try {
    const tableName = 'tbl_becario_exterior';
    
    let query = `SELECT b.*, 
      e.nombre as estado,
      m.nombre as municipio,
      p.nombre as parroquia
      FROM ${tableName} b
      INNER JOIN tbl_estado e ON e.codigoestado = b.codigoestado
      INNER JOIN tbl_municipio m ON m.codigomunicipio = b.codigomunicipio
      INNER JOIN tbl_parroquia p ON p.codigoparroquia = b.codigoparroquia
      WHERE 1=1`;
    
    const params = [];
    let paramCount = 0;
    
    if (codigoestado) {
      paramCount++;
      query += ` AND b.codigoestado = $${paramCount}`;
      params.push(codigoestado);
    }
    
    if (codigomunicipio) {
      paramCount++;
      query += ` AND b.codigomunicipio = $${paramCount}`;
      params.push(codigomunicipio);
    }
    
    if (codigoparroquia) {
      paramCount++;
      query += ` AND b.codigoparroquia = $${paramCount}`;
      params.push(codigoparroquia);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
    
  } catch (error) {
    console.error('Error en   la culsulta :', error);
    throw error;
  }



}
static async get_uner(codigo_estado = '') {
  try {
    if (!codigo_estado) {
      return [];
    }
    const query = `
      SELECT u.*
      FROM tbl_uner u
      WHERE u.codigoestado = $1
    `;
    const result = await pool.query(query, [codigo_estado]);
    return result.rows;
    
  } catch (error) {
    console.error('Error en get_uner:', error);
    throw error;
  }
}


static async get_tbl_pais() {
  try {
    const query = `
      SELECT u.*
      FROM tbl_pais u
    `;
    const result = await pool.query(query);
    return result.rows;
    
  } catch (error) {
    console.error('Error en get_tbl_pais:', error);
    throw error;
  }
}

static async get_carrera(codigo) {
  try {
    if (!codigo) {
      return [];
    }
    const query = `
      SELECT u.*
      FROM tbl_carreras u
      WHERE u.codigo = $1
    `;
    const result = await pool.query(query, [codigo]);
    return result.rows;
    
  } catch (error) {
    console.error('Error en get_carreras:', error);
    throw error;
  }
}

static async delete_becario_exterior(id) {
  try {
    const query = `
      DELETE FROM tbl_becario_exterior
      WHERE id_usuario = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  } catch (error) {
    console.error('Error al eliminar becario:', error);
    throw error;
  }
}

static async findByCedulaOrEmail_esterior(id) {
  try {
    const query = `
      SELECT *
      FROM tbl_becario_exterior
      WHERE id_usuario = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  } catch (error) {
    console.error('Error al buscar becario:', error);
    throw error;
  }
}

}






module.exports = Becarios;
