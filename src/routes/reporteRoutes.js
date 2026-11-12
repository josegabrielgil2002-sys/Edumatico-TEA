/**
 * Rutas del Módulo de Seguimiento Académico y Reportes
 * Sistema EDUMÁTICO - UNERG
 */

const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verificarRol } = require('../middlewares/authMiddleware');

// Progreso individual/grupal (docente, administración, coordinación)
router.get('/reportes/progreso', verificarRol(['docente', 'coordinacion', 'administrador']), reporteController.obtenerProgresoEstudiantes);

// Reportes estadísticos globales
router.get('/reportes/estadisticas', verificarRol(['docente', 'coordinacion', 'administrador']), reporteController.generarReporteEstadistico);

module.exports = router;