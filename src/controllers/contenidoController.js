/**
 * Controlador de Asignaturas, Contenidos, Archivos y Adaptación Inteligente (TEA)
 * Desarrollado para el sistema EDUMÁTICO TEA - UNERG
 */

const db = require('../config/db');
const { procesarAdaptacionIA } = require('../services/iaAdapterService');

// ==========================================
// MÓDULO DE ASIGNATURAS
// ==========================================

/**
 * Obtiene el listado completo de asignaturas ordenadas alfabéticamente
 */
exports.obtenerAsignaturas = function(req, res) {
    const query = 'SELECT * FROM asignaturas ORDER BY nombre ASC';
    
    db.all(query, [], function(err, rows) {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al obtener las asignaturas.', 
                error: err.message 
            });
        }
        res.json({ success: true, asignaturas: rows });
    });
};

/**
 * Crea una nueva asignatura académica en el sistema
 */
exports.crearAsignatura = function(req, res) {
    const { nombre, codigo, descripcion, periodo } = req.body;

    if (!nombre || !codigo || !periodo) {
        return res.status(400).json({ 
            success: false, 
            message: 'El nombre, código y período académico son obligatorios.' 
        });
    }

    const query = 'INSERT INTO asignaturas (nombre, codigo, descripcion, periodo) VALUES (?, ?, ?, ?)';
    
    db.run(query, [nombre, codigo, descripcion, periodo], function(err) {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al registrar la asignatura.', 
                error: err.message 
            });
        }
        res.status(201).json({ 
            success: true, 
            id: this.lastID, 
            message: 'Asignatura registrada exitosamente.' 
        });
    });
};

// ==========================================
// MÓDULO DE CONTENIDOS CON ARCHIVOS E IA (CU-03, RF-03, RF-04)
// ==========================================

/**
 * Obtiene los contenidos cargados por los docentes, opcionalmente filtrados por asignatura
 */
exports.obtenerContenidos = function(req, res) {
    const { asignatura_id } = req.query;
    let query = `
        SELECT c.*, a.nombre AS asignatura_nombre, u.nombre AS docente_nombre 
        FROM contenidos c
        JOIN asignaturas a ON c.asignatura_id = a.id
        JOIN usuarios u ON c.docente_id = u.id
    `;
    let params = [];

    if (asignatura_id) {
        query += ' WHERE c.asignatura_id = ?';
        params.push(asignatura_id);
    }

    query += ' ORDER BY c.fecha_creacion DESC';

    db.all(query, params, function(err, rows) {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al consultar contenidos académicos.', 
                error: err.message 
            });
        }
        res.json({ success: true, contenidos: rows });
    });
};

/**
 * Registra un contenido académico, recibe archivos PDF/Documentos subidos mediante Multer
 * y procesa automáticamente la adaptación psicopedagógica y semáforo mediante el Agente de IA
 */
exports.crearContenidoConIA = async function(req, res) {
    try {
        const { titulo, descripcion, asignatura_id, docente_id, nivel_complejidad, perfil_estudiante } = req.body;
        
        // Obtener la ruta del archivo subido de forma limpia
        let archivoUrl = null;
        if (req.file && req.file.filename) {
            archivoUrl = '/uploads/' + req.file.filename;
        }

        if (!titulo || !asignatura_id || !docente_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'El título, la asignatura y el docente son campos obligatorios.' 
            });
        }

        // Parsear perfil de estudiante si viene como cadena JSON
        let perfilParsed = null;
        if (perfil_estudiante) {
            try {
                perfilParsed = typeof perfil_estudiante === 'string' ? JSON.parse(perfil_estudiante) : perfil_estudiante;
            } catch (e) {
                console.log('Aviso: Perfil no válido en formato JSON, usando perfil por defecto.');
            }
        }

        // Invocar al Agente de IA potente para evaluar el contenido y determinar el semáforo adaptativo
        const textoAAnalizar = (titulo + ' ' + (descripcion || '')).trim();
        const resultadoIA = await procesarAdaptacionIA(textoAAnalizar, perfilParsed);
        const estadoSemaforo = resultadoIA.semaforo || 'amarillo';

        // Insertar el registro del contenido adaptado en la base de datos SQLite
        const query = `
            INSERT INTO contenidos (titulo, descripcion, nivel_complejidad, estado_semaforo, asignatura_id, docente_id, archivo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            titulo, 
            descripcion || '', 
            nivel_complejidad || 'medio', 
            estadoSemaforo, 
            asignatura_id, 
            docente_id, 
            archivoUrl
        ], function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al guardar el contenido en la base de datos.', 
                    error: err.message 
                });
            }
            
            res.status(201).json({
                success: true,
                contenido_id: this.lastID,
                message: 'Contenido creado y analizado exitosamente por el Agente de IA.',
                estado_semaforo: estadoSemaforo,
                adaptacion_ia: resultadoIA.analisis_ia,
                archivo_cargado: archivoUrl
            });
        });

    } catch (error) {
        console.error('Error general en crearContenidoConIA:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al procesar y adaptar el contenido.', 
            error: error.message 
        });
    }
};

// ==========================================
// MÓDULO DE RECURSOS VISUALES (CU-04, RF-04)
// ==========================================

/**
 * Asocia un recurso visual (esquema, mapa conceptual, pictograma, resumen) a un contenido
 */
exports.crearRecursoVisual = function(req, res) {
    const { tipo, descripcion, contenido_id, archivo_url } = req.body;

    if (!tipo || !contenido_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'El tipo de recurso y el contenido asociado son requeridos.' 
        });
    }

    const query = `
        INSERT INTO recursos_visuales (tipo, descripcion, contenido_id, archivo_url)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [tipo, descripcion, contenido_id, archivo_url], function(err) {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al registrar el recurso visual.', 
                error: err.message 
            });
        }
        res.status(201).json({ 
            success: true, 
            id: this.lastID, 
            message: 'Recurso visual registrado exitosamente.' 
        });
    });
};

/**
 * Consulta todos los recursos visuales adaptados pertenecientes a un contenido específico
 */
exports.obtenerRecursosPorContenido = function(req, res) {
    const { contenido_id } = req.params;
    const query = 'SELECT * FROM recursos_visuales WHERE contenido_id = ?';

    db.all(query, [contenido_id], function(err, rows) {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al consultar recursos visuales.', 
                error: err.message 
            });
        }
        res.json({ success: true, recursos: rows });
    });
};