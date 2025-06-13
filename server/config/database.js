import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'network_monitor',
  password: process.env.DB_PASSWORD || 'secure_password_2024',
  database: process.env.DB_NAME || 'network_monitor_db',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Pool de conexiones
let pool;

export function createPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    });
  }
  return pool;
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

// Función para ejecutar consultas
export async function executeQuery(query, params = []) {
  const connection = getPool();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    throw error;
  }
}

// Función para ejecutar transacciones
export async function executeTransaction(queries) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
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
    // Crear conexión inicial sin especificar base de datos
    const initialConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      charset: 'utf8mb4'
    });

    // Crear base de datos si no existe
    await initialConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await initialConnection.end();

    // Crear pool de conexiones
    createPool();

    // Ejecutar migraciones
    await runMigrations();
    
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
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

    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, '../migrations');
    
    try {
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        // Verificar si la migración ya fue ejecutada
        const [existing] = await executeQuery(
          'SELECT id FROM migrations WHERE filename = ?',
          [file]
        );

        if (existing.length === 0) {
          console.log(`📄 Ejecutando migración: ${file}`);
          
          // Leer y ejecutar migración
          const migrationPath = path.join(migrationsDir, file);
          const migrationSQL = await fs.readFile(migrationPath, 'utf8');
          
          // Dividir por declaraciones SQL (separadas por ;)
          const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

          // Ejecutar cada declaración
          for (const statement of statements) {
            if (statement.trim()) {
              await executeQuery(statement);
            }
          }

          // Marcar migración como ejecutada
          await executeQuery(
            'INSERT INTO migrations (filename) VALUES (?)',
            [file]
          );

          console.log(`✅ Migración ${file} ejecutada correctamente`);
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📁 Directorio de migraciones no encontrado, creando...');
        await fs.mkdir(migrationsDir, { recursive: true });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  }
}

// Función para cerrar conexiones
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}