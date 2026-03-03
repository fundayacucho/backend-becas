const Becarios = require('../models/becarios.legacy');
const path = require('path');
const {
  ensureDirectories,
  getManagedDirs,
  moveFileToFolder,
  cleanupUploadedTempFiles,
  publicPathToDiskPath
} = require('../utils/fileManager');
const { formatBecarioLegacy } = require('./formatters/becarioFormatter');
const becariosService = require('../services/becariosService');
const catalogosService = require('../services/catalogosService');

const DIRS = getManagedDirs();
const ANEXOS_DIR = DIRS.anexos;
const FOTOS_DIR = DIRS.fotos;
const CONTANCIA_DIR = DIRS.constancias;

const createDirectories = () => {
  ensureDirectories();
};

const prepareBecarioResponse = (becario) => formatBecarioLegacy(becario);

// Control principal de registro de becarios
const registroBecarios = async (req, res) => {
  createDirectories();
  try {
    const {
      id_usuario,
      nombresApellidos,
      cedula,
      fechaNacimiento,
      genero,
      nacionalidad,
      correo,
      telefonoPrincipal,
      telefonoAlternativo,
      comuna,
      direccion,
      institucion,
      programaEstudio,
      anioIngreso,
      semestreActual,
      turnoEstudio,
      modalidadEstudio,
      programaBeca,
      estadoBeca,
      tipoTarea,
      dependencia,
      codigoestado,
      codigomunicipio,
      codigoparroquia,
      latitud,
      longitud,
      codigoestado2,
      nivel_academico
    } = req.body;

    // Verificar si el becario ya existe
    const becarioExistente = await Becarios.findByCedulaOrEmail(cedula, correo);

    // Si el becario ya existe, actualizar los datos
    if (becarioExistente) {
      const becarioData = {
        id_usuario: id_usuario || becarioExistente.id_usuario,
        nombres_apellidos: nombresApellidos || becarioExistente.nombres_apellidos,
        cedula: cedula || becarioExistente.cedula,
        fecha_nacimiento: fechaNacimiento || becarioExistente.fecha_nacimiento,
        genero: genero || becarioExistente.genero,
        nacionalidad: nacionalidad || becarioExistente.nacionalidad,
        correo: correo || becarioExistente.correo,
        telefono_principal: telefonoPrincipal || becarioExistente.telefono_principal,
        telefono_alternativo: telefonoAlternativo || becarioExistente.telefono_alternativo,
        comuna: comuna || becarioExistente.comuna,
        direccion: direccion || becarioExistente.direccion,
        institucion: institucion || becarioExistente.institucion,
        programa_estudio: programaEstudio || becarioExistente.programa_estudio,
        anio_ingreso: anioIngreso || becarioExistente.anio_ingreso,
        semestre_actual: semestreActual || becarioExistente.semestre_actual,
        turno_estudio: turnoEstudio || becarioExistente.turno_estudio,
        modalidad_estudio: modalidadEstudio || becarioExistente.modalidad_estudio,
        programa_beca: programaBeca || becarioExistente.programa_beca,
        estado_beca: estadoBeca || becarioExistente.estado_beca,
        tipo_tarea: tipoTarea || becarioExistente.tipo_tarea,
        dependencia: dependencia || becarioExistente.dependencia,
        anexo_cedula: becarioExistente.anexo_cedula,
        anexo_constancia: becarioExistente.anexo_constancia,
        anexo_residencia: becarioExistente.anexo_residencia,
        anexo_foto: becarioExistente.anexo_foto,
        constancia_semestre: becarioExistente.constancia_semestre,
        codigo_estado: codigoestado || becarioExistente.codigo_estado,
        codigo_municipio: codigomunicipio || becarioExistente.codigo_municipio,
        codigo_parroquia: codigoparroquia || becarioExistente.codigo_parroquia,
        latitud: latitud || becarioExistente.latitud,
        longitud: longitud || becarioExistente.longitud,
        codigoestado2: codigoestado2 || becarioExistente.codigoestado2,
        nivel_academico: nivel_academico || becarioExistente.nivel_academico
      };

 

      const updatedBecario = await Becarios.update(becarioExistente.id_usuario, becarioData);
      
      // Debug: Log the updatedBecario object
      console.log('DEBUG - updatedBecario:', JSON.stringify(updatedBecario, null, 2));
      
      if (!updatedBecario) {
        throw new Error('No se pudo actualizar el becario: el objeto devuelto es undefined');
      }
      
      const responseBecario = prepareBecarioResponse(updatedBecario);
      
      return res.status(200).json({
        message: 'Becario actualizado exitosamente',
        becario: responseBecario
      });
    }

    // Si es un nuevo becario
    let anexoCedulaPath = null;
    let anexoConstanciaPath = null;
    let anexoResidenciaPath = null;
    let anexoFotoPath = null;
    let constancia_semestrePath = null;

    // Mover archivos a sus carpetas correspondientes
    if (req.files) {
      if (req.files.anexoCedula && req.files.anexoCedula[0]) {
        anexoCedulaPath = moveFileToFolder(
          req.files.anexoCedula[0], 
          ANEXOS_DIR, 
          cedula, 
          'cedula'
        );
      }

      if (req.files.anexoConstancia && req.files.anexoConstancia[0]) {
        anexoConstanciaPath = moveFileToFolder(
          req.files.anexoConstancia[0], 
          ANEXOS_DIR, 
          cedula, 
          'constancia'
        );
      }

      if (req.files.anexoResidencia && req.files.anexoResidencia[0]) {
        anexoResidenciaPath = moveFileToFolder(
          req.files.anexoResidencia[0], 
          ANEXOS_DIR, 
          cedula, 
          'residencia'
        );
      }

      if (req.files.anexoFoto && req.files.anexoFoto[0]) {
        anexoFotoPath = moveFileToFolder(
          req.files.anexoFoto[0], 
          FOTOS_DIR, 
          cedula, 
          'foto'
        );
      }

      if (req.files.constancia_semestre && req.files.constancia_semestre[0]) {
        constancia_semestrePath = moveFileToFolder(
          req.files.constancia_semestre[0], 
          CONTANCIA_DIR, 
          cedula, 
          'constancia_semestre'
        );
      }
    }

    const becarioData = {
      id_usuario: id_usuario || '',
      nombres_apellidos: nombresApellidos || '',
      cedula: cedula || '',
      fecha_nacimiento: fechaNacimiento || null,
      genero: genero || '',
      nacionalidad: nacionalidad || '',
      correo: correo || '',
      telefono_principal: telefonoPrincipal || '',
      telefono_alternativo: telefonoAlternativo || '',
      comuna: comuna || '',
      direccion: direccion || '',
      institucion: institucion || '',
      programa_estudio: programaEstudio || '',
      anio_ingreso: anioIngreso || null,
      semestre_actual: semestreActual || null,
      turno_estudio: turnoEstudio || '',
      modalidad_estudio: modalidadEstudio || '',
      programa_beca: programaBeca || '',
      estado_beca: estadoBeca || '',
      tipo_tarea: tipoTarea || '',
      dependencia: dependencia || '',
      anexo_cedula: anexoCedulaPath,
      anexo_constancia: anexoConstanciaPath,
      anexo_residencia: anexoResidenciaPath,
      anexo_foto: anexoFotoPath,
      constancia_semestre: constancia_semestrePath,
      codigo_estado: codigoestado || '',
      codigo_municipio: codigomunicipio || '',
      codigo_parroquia: codigoparroquia || '',
      latitud: latitud || '',
      longitud: longitud || '',
      codigoestado2: codigoestado2,
      nivel_academico: nivel_academico
    };

    const newBecario = await Becarios.create(becarioData);
    const responseBecario = prepareBecarioResponse(newBecario);
    
    res.status(201).json({
      message: 'Becario registrado exitosamente',
      becario: responseBecario
    });
  } catch (error) {
    // Eliminar archivos subidos si hay error
    cleanupUploadedTempFiles(req.files);
    
    console.error('Error en registro de becario:', error);
    res.status(500).json({ 
      message: 'Error del servidor', 
      error: error.message 
    });
  }
};

const saveBecarioEsteriol = async (req, res) => {
   // Crear directorios al inicio
   createDirectories();
   try {
     const {
       id_usuario,
       nombresApellidos,
       cedula,
       pasaporte,
       fechaNacimiento,
       genero,
       nacionalidad,
       correo,
       telefonoPrincipal,
       telefonoAlternativo,
       nombre_representante,
       parentesco,
       institucion,
       tipo_becario,
       pais_procedencia,
       institucion_academica,
       carrera,
       titularidad,
       anioIngreso,
       semestreActual,
       modalidadEstudio,
    
       tipoTarea,
       dependencia,
       codigoestado,
       codigomunicipio,
       codigoparroquia,
       latitud,
       longitud,
       latitud_pais,
       longitud_pais,
       nivel_academico
       
     } = req.body;
 
     // Verificar si el becario ya existe
     const becarioExistente = await Becarios.findByCedulaOrEmail_esteriol(cedula, correo);

     // sie el becario ya existe altualizarlo lo datos 
 
     if ( becarioExistente ) {
       const becarioData = {
         id_usuario: id_usuario || becarioExistente.id_usuario,
         nombres_apellidos: nombresApellidos || becarioExistente.nombres_apellidos,
         cedula: cedula || becarioExistente.cedula,
         pasaporte: pasaporte || becarioExistente.pasaporte,
         fecha_nacimiento: fechaNacimiento || becarioExistente.fecha_nacimiento,
         genero: genero || becarioExistente.genero,
         nacionalidad: nacionalidad || becarioExistente.nacionalidad,
         correo: correo || becarioExistente.correo,
         telefono_principal: telefonoPrincipal || becarioExistente.telefono_principal,
         telefono_alternativo: telefonoAlternativo || becarioExistente.telefono_alternativo,
         nombre_representante: nombre_representante || becarioExistente.nombre_representante,
         parentesco: parentesco || becarioExistente.parentesco,
         institucion: institucion || becarioExistente.institucion,
         tipo_becario: tipo_becario || becarioExistente.tipo_becario,
         pais_procedencia: pais_procedencia || becarioExistente.pais_procedencia,
         institucion_academica: institucion_academica || becarioExistente.institucion_academica,
         carrera: carrera || becarioExistente.carrera,
         titularidad: titularidad || becarioExistente.titularidad,
         anio_ingreso: anioIngreso || becarioExistente.anio_ingreso,
         semestre_actual: semestreActual || becarioExistente.semestre_actual,
         tipo_tarea: tipoTarea || becarioExistente.tipo_tarea,
         dependencia: dependencia || becarioExistente.dependencia,
         anexo_cedula: becarioExistente.anexo_cedula,
         anexo_constancia: becarioExistente.anexo_constancia,
         anexo_residencia: becarioExistente.anexo_residencia,
         anexo_foto: becarioExistente.anexo_foto,
         Contrato_convenio: becarioExistente.Contrato_convenio,
         codigoestado: codigoestado || becarioExistente.codigoestado,
         codigomunicipio: codigomunicipio || becarioExistente.codigomunicipio,
         codigoparroquia: codigoparroquia || becarioExistente.codigoparroquia,
         latitud: latitud || becarioExistente.latitud,
         longitud: longitud || becarioExistente.longitud,
         latitud_pais: latitud_pais || becarioExistente.latitud_pais,
         longitud_pais: longitud_pais || becarioExistente.longitud_pais,
         nivel_academico: nivel_academico || becarioExistente.nivel_academico
        
       };
 
       // Manejar archivos si se proporcionan nuevos
       if (req.files) {
         if (req.files.anexoCedula && req.files.anexoCedula[0]) {
           becarioData.anexo_cedula = moveFileToFolder(
             req.files.anexoCedula[0], 
             ANEXOS_DIR, 
             cedula, 
             'cedula'
           );
         }
 
         if (req.files.anexoConstancia && req.files.anexoConstancia[0]) {
           becarioData.anexo_constancia = moveFileToFolder(
             req.files.anexoConstancia[0], 
             ANEXOS_DIR, 
             cedula, 
             'constancia'
           );
         }
         if (req.files.Contrato_convenio && req.files.Contrato_convenio[0]) {
          becarioData.Contrato_convenio = moveFileToFolder(
            req.files.Contrato_convenio[0], 
            CONTRATO_DIR, 
            cedula, 
            'contrato'
          );
         }
 
        //  if (req.files.anexoResidencia && req.files.anexoResidencia[0]) {
        //    becarioData.anexo_residencia = moveFileToFolder(
        //      req.files.anexoResidencia[0], 
        //      ANEXOS_DIR, 
        //      cedula, 
        //      'residencia'
        //    );
        //  }
 
         if (req.files.anexoFoto && req.files.anexoFoto[0]) {
           becarioData.anexo_foto = moveFileToFolder(
             req.files.anexoFoto[0], 
             FOTOS_DIR, 
             cedula, 
             'foto'
           );
         }
         
       }
 
       const updatedBecario = await Becarios.update_esteriol(becarioExistente.id_usuario, becarioData);
       
       const responseBecario = prepareBecarioResponse(updatedBecario);
    
          res.status(201).json({
            message: 'Becario registrado exitosamente',
            becario: responseBecario
          });
 
     }
 
     let anexoCedulaPath = null;
     let anexoConstanciaPath = null;
     let anexoResidenciaPath = null;
     let anexoFotoPath = null;
     let Contrato_convenioPath = null;
     // Mover archivos a sus carpetas correspondientes
     if (req.files) {
       if (req.files.anexoCedula && req.files.anexoCedula[0]) {
         anexoCedulaPath = moveFileToFolder(
           req.files.anexoCedula[0], 
           ANEXOS_DIR, 
           cedula, 
           'cedula'
         );
       }

       if (req.files.Contrato_convenio && req.files.Contrato_convenio[0]) {
        Contrato_convenioPath = moveFileToFolder(
          req.files.Contrato_convenio[0], 
          CONTRATO_DIR, 
          cedula, 
          'contrato'
        );
       }
 
       if (req.files.anexoConstancia && req.files.anexoConstancia[0]) {
         anexoConstanciaPath = moveFileToFolder(
           req.files.anexoConstancia[0], 
           ANEXOS_DIR, 
           cedula, 
           'constancia'
         );
       }
 
       if (req.files.anexoResidencia && req.files.anexoResidencia[0]) {
         anexoResidenciaPath = moveFileToFolder(
           req.files.anexoResidencia[0], 
           ANEXOS_DIR, 
           cedula, 
           'residencia'
         );
       }
 
       if (req.files.anexoFoto && req.files.anexoFoto[0]) {
         anexoFotoPath = moveFileToFolder(
           req.files.anexoFoto[0], 
           FOTOS_DIR, 
           cedula, 
           'foto'
         );
       }

     }
 
     const becarioData = {
       id_usuario: id_usuario || '',
       nombres_apellidos: nombresApellidos || '',
       cedula: cedula || '',
       pasaporte: pasaporte || '',
       fecha_nacimiento: fechaNacimiento || null,
       genero: genero || '',
       nacionalidad: nacionalidad || '',
       correo: correo || '',
       telefono_principal: telefonoPrincipal || '',
       telefono_alternativo: telefonoAlternativo || '',
       nombre_representante: nombre_representante || '',
       parentesco: parentesco || '',
       institucion: institucion || '',
       tipo_becario: tipo_becario || '',
       pais_procedencia: pais_procedencia || '',
       institucion_academica: institucion_academica || '',
       carrera: carrera || '',
       titularidad: titularidad || '',
       anio_ingreso: anioIngreso || null,
       semestre_actual: semestreActual || null,
       tipo_tarea: tipoTarea || '',
       dependencia: dependencia || '',
       anexo_cedula: anexoCedulaPath,
       anexo_constancia: anexoConstanciaPath,
       anexo_residencia: anexoResidenciaPath,
       anexo_foto: anexoFotoPath,
       Contrato_convenio: Contrato_convenioPath,
       codigoestado: codigoestado || '',
       codigomunicipio: codigomunicipio || '',
       codigoparroquia: codigoparroquia || '',
       latitud: latitud || '',
       longitud: longitud || '',
       latitud_pais: latitud_pais || '',
       longitud_pais: longitud_pais || '',
       nivel_academico: nivel_academico || '',
      
      
     };
 
     const newBecario = await Becarios.create_becario_esteriol(becarioData);

     const responseBecario = prepareBecarioResponse(newBecario);
    
    res.status(201).json({
      message: 'Becario registrado exitosamente',
      becario: responseBecario
    });
     
   } catch (error) {
     // Eliminar archivos subidos si hay error
     cleanupUploadedTempFiles(req.files);
     
     console.error('Error en registro de becario:', error);
     res.status(500).json({ 
       message: 'Error del servidor', 
       error: error.message 
     });
   }
  
};

// FunciÃ³n para servir archivos (opcional)
const servirArchivo = (req, res) => {
  const { tipo, archivo } = req.params;
  let filePath;
  
  if (tipo === 'foto') {
    filePath = path.join(FOTOS_DIR, archivo);
  } else if (tipo === 'anexo') {
    filePath = path.join(ANEXOS_DIR, archivo);
  } else {
    return res.status(400).json({ message: 'Tipo de archivo no vÃ¡lido' });
  }
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Archivo no encontrado' });
  }


};


const register_egresado = async (req, res) => {



  try {
    const {
      id_usuario,
      nombre_completo,
      cedula,
      correo,
      telefono_celular,
      fecha_nacimiento,
      tipo_beca,
      cod_estado,
      carrera_cursada,
      fecha_ingreso,
      fecha_egreso,
      titularidad,
      idiomas,
      ocupacion_actual,
      universidad,
      becario_tipo,
      descripcion_becario,
      codigoestado,
      codigomunicipio,
      codigoparroquia,
      latitud,
      longitud,
      latitud_pais,
      longitud_pais,
      direccion,
      codigoestado2,
      es_militar,
      trabajando,
  
    } = req.body;



    // Verificar si el becario ya existe
    const becarioExistente = await Becarios.egresadoCedulaOrEmail(cedula, correo);

    if (becarioExistente) {
      // Eliminar archivos subidos si el registro falla
      cleanupUploadedTempFiles(req.files);
      
      return res.status(400).json({
        message: 'El becario ya estÃ¡ registrado con esta cÃ©dula o correo'
      });
    }

    // Validar campos obligatorios
    if (!fecha_nacimiento) {
      return res.status(400).json({
        message: 'La fecha de nacimiento es obligatoria'
      });
    }

    // Usar los datos recibidos del req.body en lugar de valores vacÃ­os
    const becarioData = {
      id_usuario: id_usuario || "",
      nombre_completo: nombre_completo || "",
      cedula: cedula || "",
      correo: correo || "",
      telefono_celular: telefono_celular || "",
      fecha_nacimiento: fecha_nacimiento, // Este es obligatorio
      tipo_beca: tipo_beca || "",
      cod_estado: cod_estado || "",
      carrera_cursada: carrera_cursada || "",
      fecha_ingreso: fecha_ingreso || null,
      fecha_egreso: fecha_egreso || null,
      titularidad: titularidad || "",
      idiomas: idiomas || null,
      ocupacion_actual: ocupacion_actual || null,
      universidad: universidad || "",
      becario_tipo: becario_tipo || null,
      descripcion_becario: descripcion_becario || null,
      codigoestado: codigoestado || null,
      codigomunicipio: codigomunicipio || null,
      codigoparroquia: codigoparroquia || null,
      latitud: latitud || null,
      longitud: longitud || null,
      latitud_pais: latitud_pais || null,
      longitud_pais: longitud_pais || null,
      direccion: direccion || null,
      codigoestado2: codigoestado2 || null,
      es_militar: es_militar || null,
      trabajando: trabajando || null,

    };

    console.log('Datos a insertar:', becarioData);

    const newBecario = await Becarios.create_egresado(becarioData);
    
    res.status(201).json({
      message: 'Becario registrado exitosamente',
      becario: newBecario
    });
  } catch (error) {
    // Eliminar archivos subidos si hay error
    cleanupUploadedTempFiles(req.files);
    
    console.error('Error en registro de becario:', error);
    res.status(500).json({ 
      message: 'Error del servidor', 
      error: error.message 
    });
  }
};


const data_egresado = async (req, res) =>{

     try {
    const queryString = req._parsedUrl.query;
    if (!queryString) {
      return res.status(400).json({ message: 'id requerido' });
    }

    const params = new URLSearchParams(queryString);
    const id = params.get('id');
    if (!id) {
      return res.status(400).json({ message: 'id requerido' });
    }

    const data = await Becarios.egresadoXid(id);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'id no encontrado' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }

}

const get_egresado =  async (req, res) =>{
   try {
    const queryString = req._parsedUrl?.query || '';
    const params = new URLSearchParams(queryString);
  
    const estado = params.get('estado') || '';
    const municipio = params.get('municipio') || '';
    const parroquia = params.get('parroquia') || '';
    
    const data = await Becarios.get_egresados(estado, municipio, parroquia);

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron becarios con los criterios especificados' 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }


}

const data_becario = async (req, res) =>{

     try {
    const queryString = req._parsedUrl.query;
    if (!queryString) {
      return res.status(400).json({ message: 'id requerido' });
    }

    const params = new URLSearchParams(queryString);
    const id = params.get('id');
    if (!id) {
      return res.status(400).json({ message: 'id requerido' });
    }

    const data = await Becarios.becarioXid(id);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'id no encontrado' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }

}

const get_becario_esteriol = async (req, res) =>{

     try {
    const queryString = req._parsedUrl.query;
    if (!queryString) {
      return res.status(400).json({ message: 'id requerido' });
    }

    const params = new URLSearchParams(queryString);
    const id = params.get('id');
    if (!id) {
      return res.status(400).json({ message: 'id requerido' });
    }

    const data = await Becarios.becarioXid_esteriol(id);

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'id no encontrado' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }

}


const becarios = async (req, res) => {
  try {
    const queryString = req._parsedUrl?.query || '';
    const params = new URLSearchParams(queryString);
  
    const estado = params.get('estado') || '';
    const municipio = params.get('municipio') || '';
    const parroquia = params.get('parroquia') || '';
    
    const data = await Becarios.get_becariosx(estado, municipio, parroquia);

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron becarios con los criterios especificados' 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

  const get_becarioesterior = async (req, res) => {
    try {
      const queryString = req._parsedUrl?.query || '';
      const params = new URLSearchParams(queryString);
      const estado = params.get('estado') || '';
        const municipio = params.get('municipio') || '';
       const parroquia = params.get('parroquia') || '';

      const data = await Becarios.get_becariosEsterior(estado , municipio, parroquia);
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          message: 'No se encontraron becarios del exterior'
        });
      }
      res.json(data);
    } catch (error) {
      console.error('Error en getdata:', error);
      res.status(500).json({ 
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  };
const uner = async (req, res) => {

  try {
    const queryString = req._parsedUrl?.query || '';
    const params = new URLSearchParams(queryString);
     const estado = params.get('estado') || '';
    const data = await Becarios.get_uner(estado);
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron datos de UNER' 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }



};

const tbl_pais = async (req, res) => {
  try {
    //const queryString = req._parsedUrl?.query || '';
    //const params = new URLSearchParams(queryString);
    const data = await Becarios.get_tbl_pais();
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron datos de PAIS' 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getdata:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }



};




  const get_carreras  = async (req, res) => {
    try {
      const queryString = req._parsedUrl?.query || '';
      const params = new URLSearchParams(queryString);
      const codigo = params.get('codigo') || '';
      if (!codigo) {
        return res.status(400).json({ message: 'CÃ³digo es requerido' });
      }

      const data = await Becarios.get_carrera(codigo);
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          message: 'No se encontraron carreras con el cÃ³digo especificado' 
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Error en get_carreras:', error);
      res.status(500).json({ 
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  const anexo_cedulas = async (req, res) => {
    const url = req.query.url;
    try {
      const filePath = path.join(__dirname, `../${url}`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Archivo no encontrado' });
      } 
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error al servir archivo:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }

  
  const anexo_constancia = async (req, res) => {
      const url = req.query.url;

    try {
     const filePath = path.join(__dirname, `../${url}`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Archivo no encontrado' });
      } 
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error al servir archivo:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }

  const delete_becario_exterior = async (req, res) => {
    try {
       const { id } = req.body;
      const data = await Becarios.delete_becario_exterior(id);
      if (!data) {
        return res.status(404).json({ message: 'Becario no encontrado' });
      }
      res.json(data);
    } catch (error) {
      console.error('Error al eliminar becario:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }





module.exports = {
  registroBecarios,
  servirArchivo,
  register_egresado,
  data_egresado,
  data_becario,
  becarios,
  get_becarioesterior,
  uner,
  tbl_pais,
  get_carreras,
  anexo_cedulas,
  anexo_constancia,
  saveBecarioEsteriol,
  get_becario_esteriol,
  delete_becario_exterior,
  get_egresado
};


