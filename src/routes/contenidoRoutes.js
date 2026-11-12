/**
 * Rutas de Asignaturas, Contenidos con Subida de Archivos (Multer) y Recursos Visuales
 * Desarrollado para el sistema EDUMÁTICO TEA - UNERG
 */

const express = require('express');
const router = express.Router();
const contenidoController = require('../controllers/contenidoController');
const { verificarRol } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Importamos Multer para manejar PDFs y documentos

// ==========================================
// RUTAS DE ASIGNATURAS (/api/asignaturas)
// ==========================================

// Obtener todas las asignaturas registradas
router.get('/asignaturas', contenidoController.obtenerAsignaturas);

// Registrar una nueva asignatura (Solo administradores y coordinación)
router.post('/asignaturas', verificarRol(['administrador', 'coordinacion']), contenidoController.crearAsignatura);


// ==========================================
// RUTAS DE CONTENIDOS Y ADAPTACIÓN CON IA (/api/contenidos)
// ==========================================

// Obtener la lista de contenidos (con opción de filtrar por asignatura)
router.get('/contenidos', contenidoController.obtenerContenidos);

/**
 * Crear un contenido académico analizado por el Agente de IA y recibir archivo PDF adjunto.
 * - 'upload.single('archivo')' intercepta el archivo enviado desde el formulario frontend.
 * - 'verificarRol' restringe el acceso únicamente a docentes y administradores.
 */
router.post(
    '/contenidos', 
    verificarRol(['docente', 'administrador']), 
    upload.single('archivo'), 
    contenidoController.crearContenidoConIA
);


// ==========================================
// RUTAS DE RECURSOS VISUALES ADAPTADOS (/api/recursos-visuales)
// ==========================================

// Registrar un recurso visual (mapa conceptual, pictograma, resumen) asociado a un contenido
router.post('/recursos-visuales', verificarRol(['docente', 'administrador']), contenidoController.crearRecursoVisual);

// Consultar todos los recursos visuales pertenecientes a un contenido específico
router.get('/recursos-visuales/contenido/:contenido_id', contenidoController.obtenerRecursosPorContenido);

module.exports = router;