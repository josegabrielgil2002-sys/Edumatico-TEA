const express = require('express');
const router = express.Router();
const actividadController = require('../controllers/actividadController');
const { verificarRol } = require('../middlewares/authMiddleware');

// Actividades (/api/actividades)
router.get('/actividades', actividadController.obtenerActividades);
router.post('/actividades', verificarRol(['docente', 'administrador']), actividadController.crearActividad);

// Preguntas de Actividades (/api/preguntas)
router.post('/preguntas', verificarRol(['docente', 'administrador']), actividadController.crearPregunta);
router.get('/preguntas/actividad/:actividad_id', actividadController.obtenerPreguntasPorActividad);

// Registro de Respuestas de Estudiantes (/api/respuestas)
router.post('/respuestas', verificarRol(['estudiante', 'docente', 'administrador']), actividadController.registrarRespuesta);

module.exports = router;