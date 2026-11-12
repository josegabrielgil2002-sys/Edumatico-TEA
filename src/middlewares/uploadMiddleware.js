/**
 * Middleware para la gestión de subida de archivos (PDFs y documentos)
 * Desarrollado para el sistema EDUMÁTICO TEA - UNERG
 */

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento local de los archivos subidos por el docente
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Carpeta donde se guardarán físicamente los PDFs y documentos
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        // Renombramos el archivo con un sufijo de tiempo para evitar que se repitan o choquen los nombres
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro estricto para aceptar solo documentos académicos y PDFs (RF-03)
const fileFilter = (req, file, cb) => {
    const tiposPermitidos = /pdf|doc|docx|txt|ppt|pptx/;
    const extname = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    const mimetype = tiposPermitidos.test(file.mimetype) || file.mimetype === 'application/pdf';

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Solo se permiten archivos de tipo documento (PDF, Word, TXT, PPT).'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de tamaño: 10 MB
    fileFilter: fileFilter
});

module.exports = upload;