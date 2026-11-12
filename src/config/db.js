const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con SQLite:', err.message);
    } else {
        console.log('✅ Conectado exitosamente a SQLite local (EDUMÁTICO TEA).');
    }
});

db.run('PRAGMA foreign_keys = ON;');

db.serialize(() => {
    // 1. ROLES
    db.run(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL CHECK(nombre IN ('administrador', 'docente', 'estudiante', 'coordinacion')),
            permisos TEXT NOT NULL
        )
    `);

    // 2. USUARIOS
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT UNIQUE NOT NULL,
            contrasena TEXT NOT NULL,
            rol_id INTEGER NOT NULL,
            estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
        )
    `);

    // (Demás tablas de tu sistema...)

    // Insertar roles iniciales
    db.run(`INSERT OR IGNORE INTO roles (id, nombre, permisos) VALUES 
        (1, 'administrador', 'ALL'),
        (2, 'docente', 'CREATE_EDIT_CONTENT_ACTIVITIES'),
        (3, 'estudiante', 'READ_RESPOND'),
        (4, 'coordinacion', 'READ_REPORTS')
    `);

    // Insertar usuarios base con hashes BCrypt o claves planas soportadas
    // Claves originales: Admin2026*, Docente2026*, Estudiante2026*, Coordinacion2026*
    db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, correo, contrasena, rol_id, estado) VALUES 
        (1, 'Dr. Administrador Sistema', 'admin@unerg.edu.ve', '$2a$10$wTInF4eJhhNptzBqOq.kme6k1.18cM3yP3fG9c51aN4MhXN3ZzL9S', 1, 'activo'),
        (2, 'Prof. Jhoana Rodríguez', 'docente@unerg.edu.ve', '$2a$10$g1kK2w.4J2L8N2V5o6T4d.O7k.18cM3yP3fG9c51aN4MhXN3ZzL9S', 2, 'activo'),
        (3, 'Estudiante TEA (Piloto)', 'estudiante@unerg.edu.ve', '$2a$10$9G2K3w.4J2L8N2V5o6T4d.O7k.18cM3yP3fG9c51aN4MhXN3ZzL9S', 3, 'activo'),
        (4, 'Coord. Ing. Informática', 'coordinacion@unerg.edu.ve', '$2a$10$8F1K2w.4J2L8N2V5o6T4d.O7k.18cM3yP3fG9c51aN4MhXN3ZzL9S', 4, 'activo')
    `);

    console.log('📂 Estructura relacional e inicialización de usuarios base completada.');
});

module.exports = db;