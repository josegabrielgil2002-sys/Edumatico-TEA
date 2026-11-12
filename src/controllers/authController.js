const db = require('../config/db');
const bcrypt = require('bcryptjs');

// CU-01 & RF-01 / RF-02: Iniciar sesión
exports.login = (req, res) => {
    const correo = req.body.correo || req.body.email;
    const contrasena = req.body.contrasena || req.body.password;

    if (!correo || !contrasena) {
        return res.status(400).json({ 
            success: false, 
            message: 'El correo electrónico y la contraseña son obligatorios.' 
        });
    }

    const query = `
        SELECT u.id, u.nombre, u.correo, u.contrasena, u.estado, r.nombre AS rol 
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.correo = ?
    `;

    db.get(query, [correo], async (err, usuario) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error en la base de datos al validar credenciales.', 
                error: err.message 
            });
        }

        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                message: 'El correo electrónico ingresado no está registrado.' 
            });
        }

        if (usuario.estado !== 'activo') {
            return res.status(403).json({ 
                success: false, 
                message: 'El usuario se encuentra inactivo. Contacte a Coordinación.' 
            });
        }

        // Verificar contraseña (soporta hash cifrado con bcrypt o texto plano directo)
        let coincide = false;
        if (usuario.contrasena.startsWith('$2a$') || usuario.contrasena.startsWith('$2b$')) {
            coincide = await bcrypt.compare(contrasena, usuario.contrasena);
        } else {
            coincide = (contrasena === usuario.contrasena);
        }

        if (!coincide) {
            return res.status(401).json({ 
                success: false, 
                message: 'Contraseña incorrecta. Por favor, intente de nuevo.' 
            });
        }

        // Respuesta exitosa (se elimina la contraseña por seguridad)
        delete usuario.contrasena;
        res.json({
            success: true,
            message: '¡Inicio de sesión exitoso! Bienvenido.',
            token: 'token-simulado-edumatico-' + usuario.id,
            usuario
        });
    });
};

// CU-02 & RF-01: Registrar un nuevo usuario
exports.registrarUsuario = async (req, res) => {
    const { nombre } = req.body;
    const correo = req.body.correo || req.body.email;
    const contrasena = req.body.contrasena || req.body.password;
    
    // Soporta recibir rol_nombre ('docente', 'estudiante') o rol_id (2, 3)
    let rol_nombre = req.body.rol_nombre;
    const rol_id = req.body.rol_id;

    if (!rol_nombre && rol_id) {
        const rolesMap = { 1: 'administrador', 2: 'docente', 3: 'estudiante', 4: 'coordinacion' };
        rol_nombre = rolesMap[rol_id] || 'estudiante';
    } else if (!rol_nombre) {
        rol_nombre = 'estudiante';
    }

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nombre, correo y contraseña son campos obligatorios.' 
        });
    }

    // Buscar ID del rol especificado
    db.get('SELECT id FROM roles WHERE nombre = ?', [rol_nombre.toLowerCase()], async (err, rol) => {
        if (err || !rol) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rol de usuario no válido.' 
            });
        }

        // Cifrar contraseña (RNF-03)
        const salt = await bcrypt.genSalt(10);
        const contrasenaCifrada = await bcrypt.hash(contrasena, salt);

        const insertQuery = `
            INSERT INTO usuarios (nombre, correo, contrasena, rol_id, estado)
            VALUES (?, ?, ?, ?, 'activo')
        `;

        db.run(insertQuery, [nombre, correo, contrasenaCifrada, rol.id], function (err) {
            if (err) {
                if (err.message && err.message.includes('UNIQUE')) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'El correo electrónico ya se encuentra registrado.' 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al registrar el usuario en el sistema.', 
                    error: err.message 
                });
            }

            res.status(201).json({
                success: true,
                message: '¡Cuenta creada exitosamente! Ya puede iniciar sesión.',
                usuarioId: this.lastID
            });
        });
    });
};

// CU-02 & RF-01: Listar todos los usuarios
exports.listarUsuarios = (req, res) => {
    const query = `
        SELECT u.id, u.nombre, u.correo, u.estado, u.fecha_registro, r.nombre AS rol 
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al consultar usuarios.', error: err.message });
        }
        res.json({ success: true, usuarios: rows });
    });
};

// CU-02 & RF-01: Actualizar usuario
exports.actualizarUsuario = (req, res) => {
    const { id } = req.params;
    const { nombre, correo, estado, rol_nombre } = req.body;

    db.get('SELECT id FROM roles WHERE nombre = ?', [rol_nombre.toLowerCase()], (err, rol) => {
        if (err || !rol) {
            return res.status(400).json({ success: false, message: 'Rol especificado inválido.' });
        }

        const query = `
            UPDATE usuarios 
            SET nombre = ?, correo = ?, estado = ?, rol_id = ?
            WHERE id = ?
        `;

        db.run(query, [nombre, correo, estado, rol.id, id], function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error al actualizar el usuario.', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }
            res.json({ success: true, message: 'Usuario actualizado exitosamente.' });
        });
    });
};

// CU-02 & RF-01: Eliminar usuario
exports.eliminarUsuario = (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM usuarios WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al eliminar usuario.', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
        res.json({ success: true, message: 'Usuario eliminado correctamente.' });
    });
}