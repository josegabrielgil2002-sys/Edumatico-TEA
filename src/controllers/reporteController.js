/**
 * Controlador de Seguimiento Académico y Reportes (RF-10, RF-11)
 * Desarrollado para el sistema EDUMÁTICO TEA - UNERG
 */

const db = require('../config/db');

// Obtener el progreso académico general de los estudiantes (RF-10)
exports.obtenerProgresoEstudiantes = function(req, res) {
    const query = `
        SELECT 
            u.id AS estudiante_id,
            u.nombre AS estudiante_nombre,
            u.email AS estudiante_email,
            COUNT(r.id) AS total_intentos,
            SUM(CASE WHEN r.es_correcta = 1 THEN 1 ELSE 0 END) AS respuestas_correctas,
            ROUND(AVG(r.tiempo_segundos), 2) AS tiempo_promedio_seg,
            MAX(r.fecha_registro) AS ultima_actividad
        FROM usuarios u
        LEFT JOIN respuestas r ON u.id = r.estudiante_id
        WHERE u.rol = 'estudiante'
        GROUP BY u.id
        ORDER BY u.nombre ASC
    `;

    db.all(query, [], function(err, rows) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al consultar el progreso académico.',
                error: err.message
            });
        }
        res.json({ success: true, progreso: rows });
    });
};

// Generar reporte estadístico resumido para la coordinación/docente (RF-11)
exports.generarReporteEstadistico = function(req, res) {
    const queryResumen = `
        SELECT 
            (SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante') AS total_estudiantes,
            (SELECT COUNT(*) FROM contenidos) AS total_contenidos,
            (SELECT COUNT(*) FROM actividades) AS total_actividades,
            (SELECT COUNT(*) FROM respuestas) AS total_respuestas,
            (SELECT COUNT(*) FROM respuestas WHERE es_correcta = 1) AS respuestas_correctas
        `;

    db.get(queryResumen, [], function(err, row) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al generar estadísticas generales.',
                error: err.message
            });
        }

        const totalRespuestas = row.total_respuestas || 0;
        const correctas = row.respuestas_correctas || 0;
        const tasaAcierto = totalRespuestas > 0 ? ((correctas / totalRespuestas) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            reporte: {
                total_estudiantes: row.total_estudiantes,
                total_contenidos: row.total_contenidos,
                total_actividades: row.total_actividades,
                total_respuestas: totalRespuestas,
                tasa_acierto_porcentaje: parseFloat(tasaAcierto)
            }
        });
    });
};