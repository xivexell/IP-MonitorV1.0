import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos SQLite
const dbPath = path.join(process.cwd(), 'data', 'network_monitor.db');

let db;

// Función para crear la conexión SQLite
export function createDatabase() {
  return new Promise((resolve, reject) => {
    // Crear directorio data si no existe
    const dataDir = path.dirname(dbPath);
    fs.mkdir(dataDir, { recursive: true }).then(() => {
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Error conectando a SQLite:', err);
          reject(err);
        } else {
          console.log('✅ Conectado a SQLite database');
          // Habilitar foreign keys
          db.run('PRAGMA foreign_keys = ON');
          resolve(db);
        }
      });
    }).catch(reject);
  });
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabase() first.');
  }
  return db;
}

// Función para ejecutar consultas
export async function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      database.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error ejecutando consulta SELECT:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } else {
      database.run(query, params, function(err) {
        if (err) {
          console.error('Error ejecutando consulta:', err);
          reject(err);
        } else {
          resolve({
            insertId: this.lastID,
            changes: this.changes
          });
        }
      });
    }
  });
}

// Función para ejecutar transacciones
export async function executeTransaction(queries) {
  const database = getDatabase();
  
  return new Promise((resolve, reject) => {
    database.serialize(() => {
      database.run('BEGIN TRANSACTION');
      
      const results = [];
      let completed = 0;
      let hasError = false;
      
      const processQuery = (queryObj, index) => {
        const { query, params } = queryObj;
        
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          database.all(query, params, (err, rows) => {
            if (err && !hasError) {
              hasError = true;
              database.run('ROLLBACK');
              reject(err);
            } else if (!hasError) {
              results[index] = rows;
              completed++;
              if (completed === queries.length) {
                database.run('COMMIT', (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(results);
                  }
                });
              }
            }
          });
        } else {
          database.run(query, params, function(err) {
            if (err && !hasError) {
              hasError = true;
              database.run('ROLLBACK');
              reject(err);
            } else if (!hasError) {
              results[index] = {
                insertId: this.lastID,
                changes: this.changes
              };
              completed++;
              if (completed === queries.length) {
                database.run('COMMIT', (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(results);
                  }
                });
              }
            }
          });
        }
      };
      
      queries.forEach(processQuery);
    });
  });
}

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    // Crear conexión SQLite
    await createDatabase();
    
    // Ejecutar migraciones
    await runMigrations();
    
    console.log('✅ Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos SQLite:', error);
    throw error;
  }
}

// Función para ejecutar migraciones
async function runMigrations() {
  try {
    // Crear tabla de migraciones si no existe
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
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
        id TEXT PRIMARY KEY,
        ip TEXT NOT NULL UNIQUE,
        alias TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        latest_ping REAL NULL,
        avg_latency REAL DEFAULT 0,
        min_latency REAL DEFAULT 0,
        max_latency REAL DEFAULT 0,
        availability REAL DEFAULT 100.00,
        total_downs INTEGER DEFAULT 0,
        failed_pings INTEGER DEFAULT 0,
        total_pings INTEGER DEFAULT 0,
        last_status_change DATETIME NULL,
        downtime INTEGER DEFAULT 0,
        uptime INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de historial de pings
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ping_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        latency REAL NULL,
        success INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);

    // Crear tabla de configuraciones
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_name TEXT NOT NULL UNIQUE,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de alertas
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('down', 'recovery')),
        message TEXT,
        acknowledged INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);

    // Crear índices
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_devices_ip ON devices(ip)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_devices_alias ON devices(alias)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_ping_history_device_timestamp ON ping_history(device_id, timestamp)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_ping_history_timestamp ON ping_history(timestamp)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type)');
    await executeQuery('CREATE INDEX IF NOT EXISTS idx_settings_key_name ON settings(key_name)');

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
          'INSERT OR IGNORE INTO settings (key_name, value) VALUES (?, ?)',
          [key, value]
        );
      } catch (error) {
        // Ignorar errores de duplicados
        if (!error.message.includes('UNIQUE constraint failed')) {
          throw error;
        }
      }
    }

    console.log('✅ Tablas creadas correctamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}

// Función para cerrar conexiones
export async function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error cerrando base de datos:', err);
        } else {
          console.log('✅ Base de datos cerrada correctamente');
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}