const db = require('../config/db');

// --- ACTIVIDADES (CU-05, RF-05) ---

// Obtener todas las actividades o filtrarlas por asignatura
exports.obtenerActividades = (req, res) => {
    const { asignatura_id } = req.query;
    let query = `
        SELECT a.*, asig.nombre AS asignatura_nombre, u.nombre AS docente_nombre 
        FROM actividades a
        JOIN asignaturas asig ON a.asignatura_id = asig.id
        JOIN usuarios u ON a.docente_id = u.id
    `;
    let params = [];

    if (asignatura_id) {
        query += ` WHERE a.asignatura_id = ?`;
        params.push(asignatura_id);
    }

    query += ` ORDER BY a.fecha_creacion DESC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al consultar actividades.', error: err.message });
        res.json({ success: true, actividades: rows });
    });
};

// Crear una actividad interactiva
exports.crearActividad = (req, res) => {
    const { titulo, instrucciones, tipo, asignatura_id, docente_id } = req.body;

    if (!titulo || !instrucciones || !tipo || !asignatura_id || !docente_id) {
        return res.status(400).json({ success: false, message: 'Todos los campos de la actividad son obligatorios.' });
    }

    const query = `
        INSERT INTO actividades (titulo, instrucciones, tipo, asignatura_id, docente_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [titulo, instrucciones, tipo, asignatura_id, docente_id], function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Error al crear la actividad.', error: err.message });
        res.status(201).json({ success: true, actividad_id: this.lastID, message: 'Actividad creada exitosamente.' });
    });
};

// --- PREGUNTAS ASOCIADAS A LA ACTIVIDAD (RF-05, RF-08) ---

// Agregar preguntas a una actividad
exports.crearPregunta = (req, res) => {
    const { enunciado, opciones, respuesta_correcta, puntaje, actividad_id } = req.body;

    if (!enunciado || !respuesta_correcta || !actividad_id) {
        return res.status(400).json({ success: false, message: 'Enunciado, respuesta correcta y actividad ID son requeridos.' });
    }

    // Convertir opciones a string JSON si se envían como array
    const opcionesStr = Array.isArray(opciones) ? JSON.stringify(opciones) : opciones;

    const query = `
        INSERT INTO preguntas (enunciado, opciones, respuesta_correcta, puntaje, actividad_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [enunciado, opcionesStr, respuesta_correcta, puntaje || 1.0, actividad_id], function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Error al registrar la pregunta.', error: err.message });
        res.status(201).json({ success: true, pregunta_id: this.lastID, message: 'Pregunta agregada exitosamente.' });
    });
};

// Obtener preguntas de una actividad específica
exports.obtenerPreguntasPorActividad = (req, res) => {
    const { actividad_id } = req.params;

    db.all('SELECT * FROM preguntas WHERE actividad_id = ?', [actividad_id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al consultar preguntas.', error: err.message });
        
        // Formatear opciones de nuevo a objeto/array si es posible
        const preguntasFormateadas = rows.map(p => ({
            ...p,
            opciones: p.opciones ? JSON.parse(p.opciones) : []
        }));

        res.json({ success: true, preguntas: preguntasFormateadas });
    });
};

// --- RESPUESTAS DE LOS ESTUDIANTES (CU-06, RF-06, RF-07, RF-09) ---

// Registrar la respuesta o intento del estudiante (con retroalimentación inmediata)
exports.registrarRespuesta = (req, res) => {
    const { estudiante_id, actividad_id, respuesta_dada, es_correcta, tiempo_segundos, intentos } = req.body;

    if (!estudiante_id || !actividad_id || respuesta_dada === undefined || es_correcta === undefined) {
        return res.status(400).json({ success: false, message: 'Datos incompletos para registrar la respuesta.' });
    }

    const query = `
        INSERT INTO respuestas (estudiante_id, actividad_id, respuesta_dada, es_correcta, tiempo_segundos, intentos)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [estudiante_id, actividad_id, respuesta_dada, es_correcta, tiempo_segundos || 0, intentos || 1], function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Error al registrar la respuesta.', error: err.message });
        
        // Retroalimentación inmediata basada en el resultado (RF-09)
        const retroalimentacion = es_correcta === 1 
            ? '¡Excelente trabajo! Has respondido correctamente.' 
            : '¡Buen intento! Puedes repasar el material de apoyo visual e intentarlo nuevamente.';

        res.status(201).json({
            success: true,
            respuesta_id: this.lastID,
            es_correcta: es_correcta === 1,
            retroalimentacion,
            message: 'Respuesta registrada correctamente.'
        });
    });
};