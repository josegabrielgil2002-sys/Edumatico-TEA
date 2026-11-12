/**
 * Servidor Principal del Backend - Sistema EDUMÁTICO TEA (UNERG)
 * Configuración de Express, Middlewares, Conexión a Base de Datos y Rutas API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 1. Inicialización de la Base de Datos SQLite y sus 13 tablas relacionales
require('./src/config/db'); 

// 2. Importación de Módulos de Enrutamiento (API Routes)
const authRoutes = require('./src/routes/authRoutes');
const contenidoRoutes = require('./src/routes/contenidoRoutes');
const actividadRoutes = require('./src/routes/actividadRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');

// Inicialización de la aplicación Express y definición del puerto
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CONFIGURACIÓN DE MIDDLEWARES
// ==========================================
app.use(cors()); // Habilita peticiones cruzadas (CORS) para conectar el Frontend
app.use(express.json()); // Permite procesar cuerpos de solicitudes en formato JSON

// ==========================================
// SERVIR ARCHIVOS ESTÁTICOS Y RUTA RAÍZ
// ==========================================
// Servir la carpeta 'public' forzando el tipo MIME para hojas de estilo CSS
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// REGISTRO DE ENDPOINTS DE LA API REST
// ==========================================
app.use('/api/auth', authRoutes);       // Módulo de Autenticación y Control de Roles (RBAC)
app.use('/api', contenidoRoutes);       // Módulo de Asignaturas, Contenidos, Archivos y IA
app.use('/api', actividadRoutes);       // Módulo de Actividades y Preguntas Adaptadas
app.use('/api', reporteRoutes);         // Módulo de Seguimiento Académico y Estadísticas

// Ruta raíz de verificación de la API
app.get('/api', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API EDUMÁTICO TEA UNERG activa con SQLite y Agente de IA.' 
    });
});

// ==========================================
// INICIO DEL SERVIDOR HTTP
// ==========================================
app.listen(PORT, () => {
    console.log('=======================================================');
    console.log(` 🚀 Servidor backend activo en: http://localhost:${PORT}`);
    console.log('=======================================================');
});