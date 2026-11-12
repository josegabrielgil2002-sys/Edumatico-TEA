const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT y permitir el token simulado de la presentación
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            error: 'Token requerido. Debe iniciar sesión.' 
        });
    }

    const token = authHeader.split(' ')[1];

    // PERMITIR TOKEN SIMULADO DE PRESENTACIÓN AL 100%
    if (token === 'token-simulado-presentacion-2026') {
        req.usuario = { id: 1, rol: 'docente', correo: 'docente@unerg.edu.ve' };
        return next();
    }

    // Validación normal para otros tokens reales
    jwt.verify(token, 'TU_SECRET_KEY', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: 'Token inválido o expirado.' 
            });
        }
        req.usuario = user;
        next();
    });
};

// Middleware para verificar el rol del usuario en la petición
const verificarRol = (rolesPermitidos = []) => {
    return (req, res, next) => {
        // Lee el rol desde el usuario inyectado por el token o desde los headers
        const rolUsuario = req.usuario ? req.usuario.rol : req.headers['x-user-role'];

        if (!rolUsuario) {
            return res.status(401).json({ 
                success: false, 
                message: 'Acceso no autorizado. Rol no detectado.' 
            });
        }

        if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rolUsuario)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso restringido. No tiene permisos para realizar esta acción.' 
            });
        }

        next();
    };
};

// Exportamos ambos middlewares correctamente
module.exports = {
    verificarToken,
    verificarRol
};