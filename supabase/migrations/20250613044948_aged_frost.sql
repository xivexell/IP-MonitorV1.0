/*
  # Migración Inicial - Esquema Base de Datos

  1. Nuevas Tablas
    - `devices` - Dispositivos monitoreados
      - `id` (varchar, primary key)
      - `ip` (varchar, dirección IP)
      - `alias` (varchar, nombre del dispositivo)
      - `is_active` (boolean, estado actual)
      - `latest_ping` (decimal, última latencia)
      - `avg_latency` (decimal, latencia promedio)
      - `min_latency` (decimal, latencia mínima)
      - `max_latency` (decimal, latencia máxima)
      - `availability` (decimal, porcentaje de disponibilidad)
      - `total_downs` (int, total de caídas)
      - `failed_pings` (int, pings fallidos)
      - `total_pings` (int, total de pings)
      - `last_status_change` (datetime, último cambio de estado)
      - `downtime` (int, tiempo inactivo en segundos)
      - `uptime` (int, tiempo activo en segundos)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ping_history` - Historial de pings
      - `id` (bigint, primary key)
      - `device_id` (varchar, foreign key)
      - `timestamp` (datetime, momento del ping)
      - `latency` (decimal, latencia en ms)
      - `success` (boolean, éxito del ping)
      - `created_at` (timestamp)

    - `settings` - Configuraciones de la aplicación
      - `id` (int, primary key)
      - `key_name` (varchar, nombre de la configuración)
      - `value` (text, valor de la configuración)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `alerts` - Historial de alertas
      - `id` (bigint, primary key)
      - `device_id` (varchar, foreign key)
      - `type` (enum, tipo de alerta)
      - `message` (text, mensaje de la alerta)
      - `acknowledged` (boolean, si fue reconocida)
      - `created_at` (timestamp)

  2. Índices
    - Índices optimizados para consultas frecuentes
    - Índices compuestos para reportes

  3. Configuraciones
    - Charset UTF8MB4 para soporte completo de Unicode
    - Engine InnoDB para transacciones ACID
*/

-- Tabla de dispositivos
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(36) PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de pings
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuraciones
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de alertas
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto
INSERT IGNORE INTO settings (key_name, value) VALUES
('app_name', 'Monitor de Red'),
('company_name', 'Mi Empresa'),
('dashboard_subtitle', 'Monitoree sus dispositivos de red en tiempo real'),
('logo_url', ''),
('ping_interval', '5'),
('theme', 'dark'),
('primary_color', '#3B82F6'),
('alerts_visual_enabled', 'true'),
('alerts_visual_duration', '5'),
('alerts_visual_style', 'fade'),
('alerts_audio_enabled', 'true'),
('alerts_audio_start_time', '08:30'),
('alerts_audio_end_time', '17:30'),
('alerts_audio_days', 'Monday,Tuesday,Wednesday,Thursday,Friday'),
('alerts_email_enabled', 'false'),
('alerts_email_recipients', ''),
('alerts_telegram_enabled', 'false'),
('alerts_telegram_recipients', '');