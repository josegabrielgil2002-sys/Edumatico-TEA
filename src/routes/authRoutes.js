/**
 * Rutas de Autenticación - Sistema EDUMÁTICO TEA (UNERG)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarRol } = require('../middlewares/authMiddleware');
const db = require('../config/db'); // Conexión a SQLite

// ==========================================
// RUTAS PÚBLICAS
// ==========================================
router.post('/login', authController.login);
router.post('/registro', authController.registrarUsuario);

// Endpoint de Registro Directo (Compatible con el formulario frontend)
router.post('/register', (req, res) => {
    const { nombre, correo, contrasena, rol_id } = req.body;
    
    // Si no se envía rol_id, asignamos estudiante (rol_id = 3) por defecto
    const rolAsignado = rol_id || 3; 
    const estadoInicial = 'activo';

    const query = 'INSERT INTO usuarios (nombre, correo, contrasena, rol_id, estado) VALUES (?, ?, ?, ?, ?)';
    
    db.run(query, [nombre, correo, contrasena, rolAsignado, estadoInicial], function(err) {
        if (err) {
            return res.status(400).json({ 
                success: false, 
                message: 'El correo electrónico ya está registrado o los datos son inválidos.' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Cuenta creada exitosamente. Ya puede iniciar sesión.' 
        });
    });
});

// ==========================================
// RUTAS PROTEGIDAS (Gestión por Administrador / Coordinación)
// ==========================================
router.get('/usuarios', verificarRol(['administrador', 'coordinacion']), authController.listarUsuarios);
router.put('/usuarios/:id', verificarRol(['administrador']), authController.actualizarUsuario);
router.delete('/usuarios/:id', verificarRol(['administrador']), authController.eliminarUsuario);

module.exports = router;