import mysql from 'mysql2/promise';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos MariaDB/MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'network_monitor',
  password: process.env.DB_PASSWORD || 'secure_password_2024',
  database: process.env.DB_NAME || 'network_monitor_db',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

let pool;

// Función para crear el pool de conexiones
export function createDatabase() {
  return new Promise((resolve, reject) => {
    try {
      pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });

      console.log('✅ Pool de conexiones MariaDB creado');
      resolve(pool);
    } catch (error) {
      console.error('❌ Error creando pool de conexiones MariaDB:', error);
      reject(error);
    }
  });
}

export function getDatabase() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createDatabase() first.');
  }
  return pool;
}

// Función para ejecutar consultas
export async function executeQuery(query, params = []) {
  try {
    const database = getDatabase();
    const [rows] = await database.execute(query, params);
    
    // Para consultas INSERT, UPDATE, DELETE, devolver información de cambios
    if (query.trim().toUpperCase().startsWith('INSERT') || 
        query.trim().toUpperCase().startsWith('UPDATE') || 
        query.trim().toUpperCase().startsWith('DELETE')) {
      return {
        insertId: rows.insertId || null,
        affectedRows: rows.affectedRows || 0,
        changes: rows.affectedRows || 0
      };
    }
    
    return rows;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Función para ejecutar transacciones
export async function executeTransaction(queries) {
  const database = getDatabase();
  const connection = await database.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const queryObj of queries) {
      const { query, params } = queryObj;
      const [rows] = await connection.execute(query, params);
      
      if (query.trim().toUpperCase().startsWith('INSERT') || 
          query.trim().toUpperCase().startsWith('UPDATE') || 
          query.trim().toUpperCase().startsWith('DELETE')) {
        results.push({
          insertId: rows.insertId || null,
          affectedRows: rows.affectedRows || 0,
          changes: rows.affectedRows || 0
        });
      } else {
        results.push(rows);
      }
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    // Crear pool de conexiones
    await createDatabase();
    
    // Probar conexión
    await testConnection();
    
    // Ejecutar migraciones
    await runMigrations();
    
    console.log('✅ Base de datos MariaDB inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos MariaDB:', error);
    throw error;
  }
}

// Función para probar la conexión
async function testConnection() {
  try {
    const database = getDatabase();
    const [rows] = await database.execute('SELECT 1 as test');
    console.log('✅ Conexión a MariaDB establecida correctamente');
  } catch (error) {
    console.error('❌ Error conectando a MariaDB:', error);
    throw error;
  }
}

// Función para ejecutar migraciones
async function runMigrations() {
  try {
    // Crear tabla de migraciones si no existe
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear las tablas principales si no existen
    await createTables();
    
    console.log('✅ Migraciones ejecutadas correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  }
}

// Función para crear las tablas principales
async function createTables() {
  try {
    // Crear tabla de dispositivos
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(36) PRIMARY KEY,
        ip VARCHAR(45) NOT NULL UNIQUE,
        alias VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        latest_ping DECIMAL(10,3) NULL,
        avg_latency DECIMAL(10,3) DEFAULT 0,
        min_latency DECIMAL(10,3) DEFAULT 0,
        max_latency DECIMAL(10,3) DEFAULT 0,
        availability DECIMAL(5,2) DEFAULT 100.00,
        total_downs INT DEFAULT 0,
        failed_pings INT DEFAULT 0,
        total_pings INT DEFAULT 0,
        last_status_change DATETIME NULL,
        downtime INT DEFAULT 0,
        uptime INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_ip (ip),
        INDEX idx_alias (alias),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de historial de pings
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ping_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(36) NOT NULL,
        timestamp DATETIME NOT NULL,
        latency DECIMAL(10,3) NULL,
        success BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
        INDEX idx_device_timestamp (device_id, timestamp),
        INDEX idx_timestamp (timestamp),
        INDEX idx_success (success)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de configuraciones
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_key_name (key_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de alertas
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS alerts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(36) NOT NULL,
        type ENUM('down', 'recovery') NOT NULL,
        message TEXT,
        acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
        INDEX idx_device_id (device_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at),
        INDEX idx_acknowledged (acknowledged)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insertar configuraciones por defecto
    const defaultSettings = [
      ['app_name', 'Monitor de Red'],
      ['company_name', 'Mi Empresa'],
      ['dashboard_subtitle', 'Monitoree sus dispositivos de red en tiempo real'],
      ['logo_url', ''],
      ['ping_interval', '5'],
      ['theme', 'dark'],
      ['primary_color', '#3B82F6'],
      ['alerts_visual_enabled', 'true'],
      ['alerts_visual_duration', '5'],
      ['alerts_visual_style', 'fade'],
      ['alerts_audio_enabled', 'true'],
      ['alerts_audio_start_time', '08:30'],
      ['alerts_audio_end_time', '17:30'],
      ['alerts_audio_days', 'Monday,Tuesday,Wednesday,Thursday,Friday'],
      ['alerts_email_enabled', 'false'],
      ['alerts_email_recipients', ''],
      ['alerts_telegram_enabled', 'false'],
      ['alerts_telegram_recipients', '']
    ];

    for (const [key, value] of defaultSettings) {
      try {
        await executeQuery(
          'INSERT IGNORE INTO settings (key_name, value) VALUES (?, ?)',
          [key, value]
        );
      } catch (error) {
        // Ignorar errores de duplicados
        if (!error.message.includes('Duplicate entry')) {
          throw error;
        }
      }
    }

    console.log('✅ Tablas creadas correctamente en MariaDB');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}

// Función para cerrar conexiones
export async function closeDatabase() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('✅ Pool de conexiones MariaDB cerrado correctamente');
    }
  } catch (error) {
    console.error('Error cerrando pool de conexiones:', error);
  }
}