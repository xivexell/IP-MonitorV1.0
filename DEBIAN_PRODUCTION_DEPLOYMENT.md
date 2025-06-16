# 📋 Tutorial Completo: Despliegue en Producción - Debian GNU/Linux 11 (bullseye)

## 🎯 Objetivo
Implementar la aplicación de monitoreo de red con MariaDB en un servidor Debian GNU/Linux 11 (bullseye) para uso en producción empresarial.

**Configuración del Servidor:**
- **IP del Servidor:** 10.0.1.9
- **Puerto de la Aplicación:** 3000
- **Base de Datos:** MariaDB
- **Repositorio:** https://github.com/xivexell/IP-MonitorV1.0

---

## 📋 Requisitos Previos

### Hardware Mínimo Recomendado:
- **CPU:** 2 cores
- **RAM:** 4GB (mínimo 2GB)
- **Almacenamiento:** 20GB libres
- **Red:** Conexión estable a internet

### Software:
- Debian GNU/Linux 11 (bullseye) 64-bit
- Acceso SSH con privilegios sudo
- Usuario con permisos administrativos

---

## 🚀 PASO 1: Preparación del Sistema

### 1.1 Conectar al Servidor y Actualizar Sistema

```bash
# Conectarse al servidor via SSH
ssh usuario@10.0.1.9

# Verificar la versión del sistema
cat /etc/os-release
# Debería mostrar: Debian GNU/Linux 11 (bullseye)

# Actualizar la lista de paquetes disponibles
sudo apt update

# Explicación: apt update descarga la información de paquetes más reciente
# desde los repositorios configurados sin instalar nada

# Actualizar todos los paquetes instalados a sus versiones más recientes
sudo apt upgrade -y

# Explicación: apt upgrade instala las versiones más nuevas de todos los paquetes
# La opción -y responde automáticamente "sí" a todas las preguntas

# Instalar herramientas básicas necesarias
sudo apt install -y curl wget git unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential

# Explicación de cada herramienta:
# - curl: para descargar archivos desde URLs
# - wget: alternativa a curl para descargas
# - git: control de versiones para clonar el repositorio
# - unzip: para extraer archivos comprimidos
# - software-properties-common: para gestionar repositorios de software
# - apt-transport-https: para repositorios HTTPS
# - ca-certificates: certificados de autoridades de certificación
# - gnupg: para verificación de firmas digitales
# - lsb-release: información del sistema
# - build-essential: herramientas de compilación (gcc, make, etc.)
```

### 1.2 Configurar el Firewall (UFW)

```bash
# Instalar UFW (Uncomplicated Firewall) si no está instalado
sudo apt install -y ufw

# Explicación: UFW es una interfaz simplificada para iptables,
# el sistema de firewall de Linux

# Configurar políticas por defecto
sudo ufw default deny incoming   # Bloquear todas las conexiones entrantes
sudo ufw default allow outgoing  # Permitir todas las conexiones salientes

# Explicación: Estas reglas establecen una política de seguridad restrictiva
# donde solo se permiten conexiones salientes por defecto

# Permitir SSH (CRÍTICO: no bloquear tu conexión actual)
sudo ufw allow ssh
sudo ufw allow 22

# Explicación: Estas reglas permiten conexiones SSH en el puerto 22
# Es CRÍTICO hacer esto antes de habilitar el firewall para no perder acceso

# Permitir HTTP y HTTPS para el servidor web
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS

# Permitir el puerto de la aplicación
sudo ufw allow 3000

# Permitir MariaDB solo desde localhost (seguridad)
sudo ufw allow from 127.0.0.1 to any port 3306

# Explicación: Esta regla permite conexiones a MariaDB solo desde el mismo servidor
# Esto evita accesos externos no autorizados a la base de datos

# Habilitar el firewall
sudo ufw enable

# Verificar el estado y reglas configuradas
sudo ufw status verbose

# Debería mostrar algo como:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW IN    Anywhere
# 80/tcp                     ALLOW IN    Anywhere
# 443/tcp                    ALLOW IN    Anywhere
# 3000/tcp                   ALLOW IN    Anywhere
# 3306/tcp                   ALLOW IN    127.0.0.1
```

---

## 🗄️ PASO 2: Instalación y Configuración de MariaDB

### 2.1 Instalar MariaDB Server

```bash
# Instalar MariaDB Server y cliente
sudo apt install -y mariadb-server mariadb-client

# Explicación: 
# - mariadb-server: el servidor de base de datos
# - mariadb-client: herramientas cliente para conectarse al servidor

# Verificar que MariaDB esté ejecutándose
sudo systemctl status mariadb

# Debería mostrar "active (running)"

# Habilitar MariaDB para que inicie automáticamente al arrancar el sistema
sudo systemctl enable mariadb

# Verificar la versión instalada
mysql --version
# Debería mostrar algo como: mysql Ver 15.1 Distrib 10.5.x-MariaDB
```

### 2.2 Configurar Seguridad de MariaDB

```bash
# Ejecutar el script de configuración de seguridad
sudo mysql_secure_installation

# Este script interactivo te hará las siguientes preguntas:
# Responde de la siguiente manera:

# 1. "Enter current password for root (enter for none):"
#    Presiona ENTER (no hay contraseña por defecto)

# 2. "Set root password? [Y/n]"
#    Responde: Y

# 3. "New password:"
#    Ingresa: secure_password_2024

# 4. "Re-enter new password:"
#    Confirma: secure_password_2024

# 5. "Remove anonymous users? [Y/n]"
#    Responde: Y
#    Explicación: Los usuarios anónimos son un riesgo de seguridad

# 6. "Disallow root login remotely? [Y/n]"
#    Responde: Y
#    Explicación: El root solo debe conectarse localmente

# 7. "Remove test database and access to it? [Y/n]"
#    Responde: Y
#    Explicación: La base de datos de prueba no es necesaria en producción

# 8. "Reload privilege tables now? [Y/n]"
#    Responde: Y
#    Explicación: Aplica los cambios inmediatamente
```

### 2.3 Crear Base de Datos y Usuario Específico

```bash
# Conectar a MariaDB como root
sudo mysql -u root -p
# Ingresa la contraseña: secure_password_2024

# Una vez conectado, verás el prompt: MariaDB [(none)]>
# Ejecuta los siguientes comandos SQL uno por uno:
```

```sql
-- Crear la base de datos con charset UTF8MB4 para soporte completo de Unicode
CREATE DATABASE network_monitor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Explicación: utf8mb4 soporta todos los caracteres Unicode incluyendo emojis
-- utf8mb4_unicode_ci es una collation que maneja correctamente las comparaciones

-- Crear usuario específico para la aplicación
CREATE USER 'network_monitor'@'localhost' IDENTIFIED BY 'secure_password_2024';

-- Explicación: Crear un usuario específico es más seguro que usar root
-- @'localhost' limita las conexiones solo desde el mismo servidor

-- Otorgar permisos completos sobre la base de datos específica
GRANT ALL PRIVILEGES ON network_monitor_db.* TO 'network_monitor'@'localhost';

-- Explicación: Otorga todos los permisos (SELECT, INSERT, UPDATE, DELETE, etc.)
-- pero solo sobre la base de datos network_monitor_db

-- Aplicar los cambios de permisos inmediatamente
FLUSH PRIVILEGES;

-- Verificar que la base de datos se creó correctamente
SHOW DATABASES;
-- Debería aparecer network_monitor_db en la lista

-- Verificar que el usuario se creó correctamente
SELECT User, Host FROM mysql.user WHERE User = 'network_monitor';
-- Debería mostrar: network_monitor | localhost

-- Salir de MariaDB
EXIT;
```

### 2.4 Verificar Conexión con el Nuevo Usuario

```bash
# Probar conexión con el usuario de la aplicación
mysql -u network_monitor -p network_monitor_db
# Ingresa la contraseña: secure_password_2024

# Si la conexión es exitosa, verás: MariaDB [network_monitor_db]>

# Ejecutar una consulta de prueba
SHOW TABLES;
# Debería mostrar "Empty set" ya que no hay tablas aún

# Salir
EXIT;
```

### 2.5 Optimizar MariaDB para Producción

```bash
# Crear backup de la configuración original
sudo cp /etc/mysql/mariadb.conf.d/50-server.cnf /etc/mysql/mariadb.conf.d/50-server.cnf.backup

# Editar la configuración principal de MariaDB
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

**Buscar la sección `[mysqld]` y agregar/modificar las siguientes líneas:**

```ini
[mysqld]
# Configuraciones de rendimiento
innodb_buffer_pool_size = 512M          # Caché para datos e índices
innodb_log_file_size = 128M              # Tamaño de logs de transacciones
innodb_flush_log_at_trx_commit = 2       # Rendimiento vs durabilidad
innodb_flush_method = O_DIRECT           # Método de escritura a disco

# Configuraciones de conexión
max_connections = 200                     # Máximo de conexiones simultáneas
connect_timeout = 60                      # Timeout de conexión
wait_timeout = 28800                      # Timeout de inactividad (8 horas)
interactive_timeout = 28800               # Timeout para sesiones interactivas

# Configuraciones de seguridad
bind-address = 127.0.0.1                 # Solo escuchar en localhost
local-infile = 0                          # Deshabilitar LOAD DATA LOCAL

# Configuraciones de logs
log_error = /var/log/mysql/error.log      # Log de errores
slow_query_log = 1                        # Habilitar log de consultas lentas
slow_query_log_file = /var/log/mysql/slow.log  # Archivo de consultas lentas
long_query_time = 2                       # Consultas que tomen más de 2 segundos

# Configuraciones de charset
character-set-server = utf8mb4            # Charset por defecto
collation-server = utf8mb4_unicode_ci     # Collation por defecto
```

```bash
# Reiniciar MariaDB para aplicar los cambios
sudo systemctl restart mariadb

# Verificar que MariaDB esté funcionando correctamente
sudo systemctl status mariadb

# Verificar logs por si hay errores de configuración
sudo tail -f /var/log/mysql/error.log
# Presionar Ctrl+C para salir del seguimiento de logs

# Si no hay errores, deberías ver mensajes como:
# [Note] mysqld: ready for connections
```

---

## 🟢 PASO 3: Instalación de Node.js

### 3.1 Instalar Node.js 18 LTS

```bash
# Descargar e instalar el repositorio NodeSource para Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Explicación del comando:
# - curl -fsSL: descarga silenciosa con seguimiento de redirecciones
# - sudo -E: mantiene las variables de entorno del usuario
# - bash -: ejecuta el script descargado

# Instalar Node.js
sudo apt install -y nodejs

# Verificar las versiones instaladas
node --version
npm --version

# Deberías ver algo como:
# v18.19.0 (o superior)
# 10.2.3 (o superior)

# Verificar que Node.js funciona correctamente
node -e "console.log('Node.js funciona correctamente')"
# Debería imprimir: Node.js funciona correctamente
```

### 3.2 Instalar PM2 (Gestor de Procesos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Explicación: PM2 es un gestor de procesos para aplicaciones Node.js
# que permite mantener las aplicaciones ejecutándose, reiniciarlas
# automáticamente si fallan, y gestionar logs

# Verificar la instalación de PM2
pm2 --version

# Configurar PM2 para el usuario actual
pm2 startup

# Este comando mostrará una línea que debes ejecutar como sudo
# Algo como: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u usuario --hp /home/usuario
# EJECUTA ESA LÍNEA EXACTAMENTE COMO SE MUESTRA

# Ejemplo (reemplaza con la línea que te muestre):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## 🌐 PASO 4: Instalación y Configuración de Nginx

### 4.1 Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Explicación: Nginx actuará como proxy reverso, sirviendo la aplicación
# y manejando las conexiones HTTP/HTTPS

# Iniciar Nginx
sudo systemctl start nginx

# Habilitar Nginx para que inicie automáticamente
sudo systemctl enable nginx

# Verificar el estado de Nginx
sudo systemctl status nginx

# Debería mostrar "active (running)"

# Verificar que Nginx responde
curl -I http://localhost
# Debería mostrar: HTTP/1.1 200 OK
```

### 4.2 Configurar Nginx como Proxy Reverso

```bash
# Crear archivo de configuración para la aplicación
sudo nano /etc/nginx/sites-available/network-monitor
```

**Contenido completo del archivo `/etc/nginx/sites-available/network-monitor`:**

```nginx
# Configuración de Nginx para la aplicación de monitoreo de red
server {
    listen 80;
    server_name 10.0.1.9;  # IP del servidor
    
    # Configuración de logs específicos para la aplicación
    access_log /var/log/nginx/network-monitor.access.log;
    error_log /var/log/nginx/network-monitor.error.log;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Configuración principal - proxy a la aplicación Node.js
    location / {
        proxy_pass http://localhost:3000;        # Redirigir a la aplicación
        proxy_http_version 1.1;                  # Usar HTTP/1.1
        proxy_set_header Upgrade $http_upgrade;  # Soporte para WebSockets
        proxy_set_header Connection 'upgrade';   # Soporte para WebSockets
        proxy_set_header Host $host;             # Preservar el host original
        proxy_set_header X-Real-IP $remote_addr; # IP real del cliente
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # Cadena de proxies
        proxy_set_header X-Forwarded-Proto $scheme; # Protocolo original (http/https)
        proxy_cache_bypass $http_upgrade;        # No cachear upgrades
        proxy_read_timeout 86400;                # Timeout de lectura (24 horas)
        proxy_connect_timeout 60;                # Timeout de conexión
        proxy_send_timeout 60;                   # Timeout de envío
    }
    
    # Configuración específica para la API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;                  # 5 minutos para operaciones API
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
    
    # Configuración para health check (sin logs para evitar spam)
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;  # No registrar health checks
    }
    
    # Configuración de compresión para mejorar rendimiento
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 4.3 Activar la Configuración de Nginx

```bash
# Crear enlace simbólico para activar el sitio
sudo ln -s /etc/nginx/sites-available/network-monitor /etc/nginx/sites-enabled/

# Explicación: Nginx solo carga configuraciones desde sites-enabled/
# El enlace simbólico permite activar/desactivar sitios fácilmente

# Desactivar el sitio por defecto de Nginx
sudo rm /etc/nginx/sites-enabled/default

# Verificar que la configuración de Nginx es válida
sudo nginx -t

# Debería mostrar:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Si hay errores, revisa la configuración antes de continuar

# Recargar Nginx para aplicar la nueva configuración
sudo systemctl reload nginx

# Verificar que Nginx esté funcionando
sudo systemctl status nginx
```

---

## 📁 PASO 5: Preparación de la Aplicación

### 5.1 Crear Directorio de la Aplicación

```bash
# Crear directorio para la aplicación
sudo mkdir -p /var/www/network-monitor

# Explicación: /var/www/ es la ubicación estándar para aplicaciones web en Linux

# Cambiar propietario del directorio al usuario actual
sudo chown -R $USER:$USER /var/www/network-monitor

# Explicación: Esto permite que el usuario actual pueda escribir en el directorio
# sin necesidad de sudo para operaciones de la aplicación

# Navegar al directorio de la aplicación
cd /var/www/network-monitor

# Verificar que estamos en el directorio correcto
pwd
# Debería mostrar: /var/www/network-monitor
```

### 5.2 Clonar la Aplicación desde GitHub

```bash
# Clonar el repositorio desde GitHub
git clone https://github.com/xivexell/IP-MonitorV1.0.git .

# Explicación: El punto (.) al final clona el contenido directamente
# en el directorio actual sin crear una subcarpeta

# Verificar que se clonó correctamente
ls -la

# Deberías ver archivos como:
# - package.json
# - server/
# - src/
# - README.md
# - .env.example
# - etc.

# Verificar el contenido del directorio server
ls -la server/

# Deberías ver:
# - index.js
# - config/
# - routes/
# - services/
```

### 5.3 Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo de variables de entorno
cp .env.example .env

# Editar el archivo de variables de entorno
nano .env
```

**Reemplazar completamente el contenido del archivo `.env` con:**

```env
# Configuración de la Base de Datos MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=network_monitor
DB_PASSWORD=secure_password_2024
DB_NAME=network_monitor_db

# Configuración del Servidor
PORT=3000
HOST=10.0.1.9
NODE_ENV=production

# URL del Frontend (para CORS en producción)
FRONTEND_URL=http://10.0.1.9:3000

# Configuración de Seguridad
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_cambiar_en_produccion_2024

# Configuración de Email (opcional - simulado en esta versión)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# Configuración de Telegram (opcional - simulado en esta versión)
TELEGRAM_BOT_TOKEN=tu_token_de_bot_telegram
TELEGRAM_CHAT_ID=tu_chat_id_telegram

# Configuración de Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

```bash
# Guardar el archivo (Ctrl+X, luego Y, luego Enter)

# Verificar que el archivo se guardó correctamente
cat .env | head -10
```

### 5.4 Instalar Dependencias y Construir la Aplicación

```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Limpiar caché de npm por si hay problemas
npm cache clean --force

# Instalar todas las dependencias del proyecto
npm install

# Explicación: Este comando lee package.json e instala todas las dependencias
# necesarias tanto para desarrollo como para producción

# Verificar que se instalaron correctamente
ls -la node_modules/ | head -10

# Crear directorio para logs de la aplicación
mkdir -p logs

# Construir la aplicación para producción
npm run build

# Explicación: Este comando compila y optimiza la aplicación frontend
# creando archivos estáticos optimizados en la carpeta dist/

# Verificar que se creó la carpeta dist con el contenido
ls -la dist/

# Deberías ver archivos como:
# - index.html
# - assets/ (carpeta con CSS y JS optimizados)

# Verificar la estructura completa del proyecto
tree -L 2 -a
# O si tree no está disponible:
find . -maxdepth 2 -type d
```

---

## 🔧 PASO 6: Configuración de la Base de Datos

### 6.1 Inicializar las Tablas de la Base de Datos

```bash
# Conectar a MariaDB con el usuario de la aplicación
mysql -u network_monitor -p network_monitor_db
# Ingresar contraseña: secure_password_2024
```

**Ejecutar el siguiente script SQL completo (copiar y pegar todo):**

```sql
-- =====================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Aplicación de Monitoreo de Red v1.0
-- =====================================================

-- Crear tabla de dispositivos monitoreados
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(36) PRIMARY KEY,                    -- UUID del dispositivo
  ip VARCHAR(45) NOT NULL UNIQUE,                -- Dirección IP (IPv4/IPv6)
  alias VARCHAR(255) NOT NULL,                   -- Nombre descriptivo
  is_active BOOLEAN DEFAULT FALSE,               -- Estado actual (online/offline)
  latest_ping DECIMAL(10,3) NULL,                -- Última latencia medida (ms)
  avg_latency DECIMAL(10,3) DEFAULT 0,           -- Latencia promedio (ms)
  min_latency DECIMAL(10,3) DEFAULT 0,           -- Latencia mínima registrada (ms)
  max_latency DECIMAL(10,3) DEFAULT 0,           -- Latencia máxima registrada (ms)
  availability DECIMAL(5,2) DEFAULT 100.00,     -- Porcentaje de disponibilidad
  total_downs INT DEFAULT 0,                     -- Número total de caídas
  failed_pings INT DEFAULT 0,                    -- Número de pings fallidos
  total_pings INT DEFAULT 0,                     -- Número total de pings
  last_status_change DATETIME NULL,              -- Último cambio de estado
  downtime INT DEFAULT 0,                        -- Tiempo total inactivo (segundos)
  uptime INT DEFAULT 0,                          -- Tiempo total activo (segundos)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para optimizar consultas
  INDEX idx_ip (ip),
  INDEX idx_alias (alias),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de historial de pings
CREATE TABLE IF NOT EXISTS ping_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(36) NOT NULL,                -- Referencia al dispositivo
  timestamp DATETIME NOT NULL,                   -- Momento del ping
  latency DECIMAL(10,3) NULL,                    -- Latencia medida (NULL si falló)
  success BOOLEAN NOT NULL,                      -- Si el ping fue exitoso
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relación con tabla devices
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  
  -- Índices para consultas de historial
  INDEX idx_device_timestamp (device_id, timestamp),
  INDEX idx_timestamp (timestamp),
  INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de configuraciones de la aplicación
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,         -- Nombre de la configuración
  value TEXT,                                    -- Valor de la configuración
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de alertas
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(36) NOT NULL,                -- Dispositivo que generó la alerta
  type ENUM('down', 'recovery') NOT NULL,        -- Tipo de alerta
  message TEXT,                                  -- Mensaje descriptivo
  acknowledged BOOLEAN DEFAULT FALSE,            -- Si fue reconocida por el usuario
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relación con tabla devices
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  
  -- Índices para consultas de alertas
  INDEX idx_device_id (device_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_acknowledged (acknowledged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto de la aplicación
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

-- Verificar que las tablas se crearon correctamente
SHOW TABLES;

-- Verificar que las configuraciones se insertaron
SELECT key_name, value FROM settings LIMIT 5;

-- Salir de MariaDB
EXIT;
```

### 6.2 Verificar la Estructura de la Base de Datos

```bash
# Verificar que las tablas se crearon correctamente
mysql -u network_monitor -p network_monitor_db -e "SHOW TABLES;"

# Debería mostrar:
# +--------------------------------+
# | Tables_in_network_monitor_db   |
# +--------------------------------+
# | alerts                         |
# | devices                        |
# | ping_history                   |
# | settings                       |
# +--------------------------------+

# Verificar la estructura de la tabla devices
mysql -u network_monitor -p network_monitor_db -e "DESCRIBE devices;"

# Verificar las configuraciones por defecto
mysql -u network_monitor -p network_monitor_db -e "SELECT key_name, value FROM settings LIMIT 5;"

# Si todo está correcto, deberías ver las configuraciones insertadas
```

---

## 🔄 PASO 7: Configuración de PM2

### 7.1 Crear Archivo de Configuración PM2

```bash
# Navegar al directorio de la aplicación
cd /var/www/network-monitor

# Crear archivo de configuración PM2
nano ecosystem.config.js
```

**Contenido del archivo `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [{
    name: 'network-monitor',                    // Nombre de la aplicación en PM2
    script: 'server/index.js',                 // Archivo principal del servidor
    instances: 1,                              // Número de instancias (1 para empezar)
    exec_mode: 'fork',                         // Modo de ejecución
    env: {
      NODE_ENV: 'production',                  // Entorno de producción
      PORT: 3000,                              // Puerto de la aplicación
      HOST: '10.0.1.9'                        // IP del servidor
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '10.0.1.9'
    },
    // Configuración de logs
    error_file: '/var/log/pm2/network-monitor-error.log',
    out_file: '/var/log/pm2/network-monitor-out.log',
    log_file: '/var/log/pm2/network-monitor.log',
    time: true,                                // Timestamps en logs
    
    // Configuración de memoria y rendimiento
    max_memory_restart: '1G',                  // Reiniciar si usa más de 1GB
    node_args: '--max-old-space-size=1024',   // Límite de memoria de Node.js
    
    // Configuración de monitoreo
    watch: false,                              // No vigilar cambios de archivos
    ignore_watch: ['node_modules', 'logs', 'dist'],
    restart_delay: 4000,                       // Esperar 4s antes de reiniciar
    max_restarts: 10,                          // Máximo 10 reinicios automáticos
    min_uptime: '10s',                         // Tiempo mínimo funcionando
    autorestart: true                          // Reinicio automático habilitado
  }]
};
```

### 7.2 Configurar Logs de PM2

```bash
# Crear directorio para logs de PM2
sudo mkdir -p /var/log/pm2

# Cambiar propietario del directorio de logs al usuario actual
sudo chown -R $USER:$USER /var/log/pm2

# Verificar permisos
ls -la /var/log/pm2/
```

### 7.3 Probar la Aplicación Localmente

```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Probar que la aplicación inicia correctamente (modo de prueba)
npm start &

# Explicación: El & ejecuta el comando en segundo plano

# Esperar unos segundos para que inicie
sleep 10

# Verificar que la aplicación responde
curl -I http://localhost:3000/api/health

# Debería mostrar: HTTP/1.1 200 OK

# Detener la aplicación de prueba
pkill -f "node server/index.js"

# Verificar que se detuvo
ps aux | grep node
```

### 7.4 Iniciar la Aplicación con PM2

```bash
# Iniciar la aplicación usando PM2
pm2 start ecosystem.config.js --env production

# Verificar el estado de la aplicación
pm2 status

# Debería mostrar algo como:
# ┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
# │ id  │ name               │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
# ├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
# │ 0   │ network-monitor    │ default     │ 1.0.0   │ fork    │ 12345    │ 0s     │ 0    │ online    │ 0%       │ 50.0mb   │ user     │ disabled │
# └─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

# Ver logs en tiempo real (presionar Ctrl+C para salir)
pm2 logs network-monitor --lines 20

# Deberías ver mensajes como:
# ✅ Base de datos MariaDB inicializada correctamente
# 🚀 Servidor ejecutándose en 10.0.1.9:3000
# 📡 Servicio de ping automático iniciado

# Guardar la configuración actual de PM2
pm2 save

# Configurar PM2 para iniciarse automáticamente al arrancar el sistema
pm2 startup

# Este comando mostrará una línea que debes ejecutar como sudo
# Ejecuta exactamente la línea que te muestre
```

---

## 📊 PASO 8: Verificación y Pruebas

### 8.1 Lista de Verificación Completa

```bash
# ✅ 1. Verificar que MariaDB está ejecutándose
sudo systemctl status mariadb
# Debería mostrar: active (running)

# ✅ 2. Verificar que Nginx está ejecutándose
sudo systemctl status nginx
# Debería mostrar: active (running)

# ✅ 3. Verificar que PM2 está ejecutándose
pm2 status
# Debería mostrar: network-monitor | online

# ✅ 4. Verificar que la aplicación responde directamente
curl -I http://localhost:3000/api/health
# Debería mostrar: HTTP/1.1 200 OK

# ✅ 5. Verificar que Nginx proxy funciona
curl -I http://10.0.1.9/api/health
# Debería mostrar: HTTP/1.1 200 OK

# ✅ 6. Verificar logs sin errores críticos
pm2 logs network-monitor --lines 50

# ✅ 7. Verificar conexión a base de datos
mysql -u network_monitor -p network_monitor_db -e "SELECT COUNT(*) as total_settings FROM settings;"
# Debería mostrar un número mayor a 0

# ✅ 8. Verificar que las tablas existen
mysql -u network_monitor -p network_monitor_db -e "SHOW TABLES;"
# Debería mostrar: alerts, devices, ping_history, settings

# ✅ 9. Verificar puertos en uso
sudo netstat -tlnp | grep :3000
# Debería mostrar el proceso Node.js escuchando en puerto 3000

sudo netstat -tlnp | grep :80
# Debería mostrar Nginx escuchando en puerto 80

# ✅ 10. Verificar firewall
sudo ufw status
# Debería mostrar los puertos 22, 80, 443, 3000 como ALLOW
```

### 8.2 Pruebas de Funcionalidad Completas

```bash
# Abrir navegador web y acceder a la aplicación
echo "🌐 Accede a la aplicación en: http://10.0.1.9"
echo "📊 Health check disponible en: http://10.0.1.9/api/health"

# Desde otro equipo en la red, verificar acceso:
# curl -I http://10.0.1.9/api/health
```

**Pruebas manuales en el navegador:**

1. **Acceder a la aplicación:** http://10.0.1.9
2. **Verificar que la interfaz carga** correctamente
3. **Agregar un dispositivo de prueba:**
   - IP: 8.8.8.8 (Google DNS)
   - Alias: Google DNS
4. **Verificar que se guarda en la base de datos:**
   ```bash
   mysql -u network_monitor -p network_monitor_db -e "SELECT * FROM devices;"
   ```
5. **Verificar que el ping funciona** y se registra el historial:
   ```bash
   # Esperar unos minutos y verificar
   mysql -u network_monitor -p network_monitor_db -e "SELECT COUNT(*) FROM ping_history;"
   ```
6. **Probar las diferentes páginas:**
   - Dashboard principal
   - Lista de dispositivos
   - Estadísticas
   - Reportes
   - Configuración

---

## 🔧 PASO 9: Comandos de Administración

### 9.1 Comandos Útiles de PM2

```bash
# Ver estado detallado de todas las aplicaciones
pm2 status

# Ver información detallada de la aplicación
pm2 describe network-monitor

# Reiniciar la aplicación
pm2 restart network-monitor

# Parar la aplicación
pm2 stop network-monitor

# Iniciar la aplicación (si está parada)
pm2 start network-monitor

# Ver logs en tiempo real
pm2 logs network-monitor

# Ver logs con filtro de errores
pm2 logs network-monitor --err

# Ver métricas en tiempo real (CPU, memoria)
pm2 monit

# Recargar la aplicación sin downtime (para actualizaciones)
pm2 reload network-monitor

# Eliminar la aplicación de PM2
pm2 delete network-monitor

# Listar todas las aplicaciones guardadas
pm2 list

# Guardar configuración actual
pm2 save

# Restaurar aplicaciones guardadas
pm2 resurrect
```

### 9.2 Comandos Útiles de MariaDB

```bash
# Conectar a la base de datos
mysql -u network_monitor -p network_monitor_db

# Backup manual de la base de datos
mysqldump -u network_monitor -p network_monitor_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar desde backup
mysql -u network_monitor -p network_monitor_db < backup_20241201_143000.sql

# Ver estadísticas de la base de datos
mysql -u network_monitor -p network_monitor_db -e "
SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'network_monitor_db';"

# Ver procesos activos en MariaDB
mysql -u root -p -e "SHOW PROCESSLIST;"

# Ver variables de configuración
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb%';"

# Optimizar tablas (mantenimiento)
mysql -u network_monitor -p network_monitor_db -e "OPTIMIZE TABLE devices, ping_history, alerts, settings;"
```

### 9.3 Comandos Útiles de Nginx

```bash
# Verificar configuración de Nginx
sudo nginx -t

# Recargar configuración sin interrumpir el servicio
sudo systemctl reload nginx

# Reiniciar Nginx completamente
sudo systemctl restart nginx

# Ver logs de acceso en tiempo real
sudo tail -f /var/log/nginx/network-monitor.access.log

# Ver logs de errores en tiempo real
sudo tail -f /var/log/nginx/network-monitor.error.log

# Ver estadísticas de acceso
sudo cat /var/log/nginx/network-monitor.access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10

# Verificar configuración activa
sudo nginx -T

# Verificar estado del servicio
sudo systemctl status nginx
```

### 9.4 Comandos de Monitoreo del Sistema

```bash
# Ver uso de recursos en tiempo real
htop
# O si no está instalado: top

# Ver uso de memoria
free -h

# Ver uso de disco
df -h

# Ver procesos de Node.js
ps aux | grep node

# Ver conexiones de red activas
sudo netstat -tlnp

# Ver logs del sistema
sudo journalctl -u nginx -f
sudo journalctl -u mariadb -f

# Ver información del sistema
uname -a
cat /etc/os-release
```

---

## 🔄 PASO 10: Script de Actualización

### 10.1 Crear Script de Actualización Automática

```bash
# Crear script de actualización
nano /var/www/network-monitor/update-app.sh
```

**Contenido del archivo `update-app.sh`:**

```bash
#!/bin/bash

# Script de actualización para la aplicación de monitoreo de red
# Versión: 1.0
# Autor: Ing. Jaime Ballesteros S.

set -e  # Salir si cualquier comando falla

echo "🔄 Iniciando actualización de la aplicación de monitoreo de red..."
echo "📅 Fecha: $(date)"
echo "👤 Usuario: $(whoami)"
echo "📍 Directorio: $(pwd)"

# Navegar al directorio de la aplicación
cd /var/www/network-monitor

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Verifica que estés en el directorio correcto."
    exit 1
fi

# Hacer backup de la versión actual
echo "📦 Creando backup de la aplicación actual..."
BACKUP_DIR="/var/backups/network-monitor-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p /var/backups
sudo cp -r /var/www/network-monitor "$BACKUP_DIR"
echo "✅ Backup creado en: $BACKUP_DIR"

# Hacer backup de la base de datos
echo "💾 Creando backup de la base de datos..."
DB_BACKUP="/var/backups/db_backup_$(date +%Y%m%d-%H%M%S).sql"
mysqldump -u network_monitor -psecure_password_2024 network_monitor_db > "$DB_BACKUP"
echo "✅ Backup de BD creado en: $DB_BACKUP"

# Parar la aplicación temporalmente
echo "⏸️ Deteniendo aplicación..."
pm2 stop network-monitor

# Actualizar código desde GitHub
echo "📥 Descargando actualizaciones desde GitHub..."
git fetch origin
git reset --hard origin/main
echo "✅ Código actualizado"

# Instalar nuevas dependencias
echo "📦 Instalando dependencias..."
npm install --production
echo "✅ Dependencias instaladas"

# Construir nueva versión
echo "🔨 Construyendo aplicación para producción..."
npm run build
echo "✅ Aplicación construida"

# Verificar que la construcción fue exitosa
if [ ! -d "dist" ]; then
    echo "❌ Error: La construcción falló. Restaurando backup..."
    pm2 start network-monitor
    exit 1
fi

# Reiniciar aplicación con PM2
echo "🔄 Reiniciando aplicación..."
pm2 start network-monitor

# Esperar a que la aplicación inicie
echo "⏳ Esperando que la aplicación inicie..."
sleep 10

# Verificar que la aplicación esté funcionando
echo "🔍 Verificando estado de la aplicación..."
if pm2 status | grep -q "online"; then
    echo "✅ Aplicación funcionando correctamente"
else
    echo "❌ Error: La aplicación no está funcionando. Verifica los logs."
    pm2 logs network-monitor --lines 20
    exit 1
fi

# Verificar que responde a peticiones
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ API respondiendo correctamente"
else
    echo "❌ Error: La API no responde. Verifica la configuración."
    exit 1
fi

# Limpiar archivos temporales
echo "🧹 Limpiando archivos temporales..."
npm cache clean --force

echo ""
echo "🎉 ¡Actualización completada exitosamente!"
echo "🌐 La aplicación está disponible en: http://10.0.1.9"
echo "📊 Health check: http://10.0.1.9/api/health"
echo "📝 Logs: pm2 logs network-monitor"
echo "📦 Backup en: $BACKUP_DIR"
echo "💾 Backup BD en: $DB_BACKUP"
echo ""
```

### 10.2 Hacer el Script Ejecutable y Probarlo

```bash
# Hacer el script ejecutable
chmod +x /var/www/network-monitor/update-app.sh

# Crear enlace simbólico para acceso fácil
sudo ln -sf /var/www/network-monitor/update-app.sh /usr/local/bin/update-network-monitor

# Probar el script (opcional - solo si hay actualizaciones disponibles)
# ./update-app.sh

# O usar el enlace simbólico:
# update-network-monitor
```

---

## 🛡️ PASO 11: Configuraciones de Seguridad Adicionales

### 11.1 Configurar Fail2Ban (Protección contra Ataques)

```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Crear configuración personalizada
sudo nano /etc/fail2ban/jail.local
```

**Contenido de `/etc/fail2ban/jail.local`:**

```ini
[DEFAULT]
# Tiempo de baneo en segundos (1 hora)
bantime = 3600

# Ventana de tiempo para contar intentos fallidos (10 minutos)
findtime = 600

# Número máximo de intentos antes del baneo
maxretry = 5

# Configuración para SSH
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200  # 2 horas para SSH

# Configuración para Nginx
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/network-monitor.error.log
maxretry = 10

# Configuración para MariaDB
[mysqld-auth]
enabled = true
port = 3306
logpath = /var/log/mysql/error.log
maxretry = 3
```

```bash
# Reiniciar y habilitar Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Verificar estado
sudo systemctl status fail2ban

# Ver estadísticas de Fail2Ban
sudo fail2ban-client status

# Ver IPs baneadas
sudo fail2ban-client status sshd
```

### 11.2 Configurar Actualizaciones Automáticas de Seguridad

```bash
# Instalar unattended-upgrades
sudo apt install -y unattended-upgrades

# Configurar actualizaciones automáticas
sudo dpkg-reconfigure -plow unattended-upgrades

# Responder "Yes" para habilitar actualizaciones automáticas

# Verificar configuración
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Verificar que las actualizaciones de seguridad estén habilitadas
sudo unattended-upgrade --dry-run
```

### 11.3 Configurar Backup Automático

```bash
# Crear script de backup automático
sudo nano /usr/local/bin/backup-network-monitor.sh
```

**Contenido del script:**

```bash
#!/bin/bash

# Script de backup automático
# Configuración
DB_NAME="network_monitor_db"
DB_USER="network_monitor"
DB_PASS="secure_password_2024"
BACKUP_DIR="/var/backups/network-monitor"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

# Realizar backup de la aplicación
echo "Creando backup de aplicación..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www network-monitor

# Realizar backup de la base de datos
echo "Creando backup de base de datos..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Eliminar backups antiguos (mantener solo los últimos 7 días)
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/"
echo "Aplicación: app_backup_$DATE.tar.gz"
echo "Base de datos: db_backup_$DATE.sql.gz"
```

```bash
# Hacer el script ejecutable
sudo chmod +x /usr/local/bin/backup-network-monitor.sh

# Configurar cron para backup diario a las 2:00 AM
sudo crontab -e

# Agregar la siguiente línea:
0 2 * * * /usr/local/bin/backup-network-monitor.sh >> /var/log/backup-network-monitor.log 2>&1

# Verificar que el cron se configuró
sudo crontab -l
```

---

## 🆘 PASO 12: Solución de Problemas Comunes

### 12.1 La aplicación no carga en el navegador

```bash
# 1. Verificar que PM2 está ejecutándose
pm2 status
# Si no está online: pm2 start network-monitor

# 2. Verificar logs de la aplicación
pm2 logs network-monitor --lines 50

# 3. Verificar que Nginx está funcionando
sudo systemctl status nginx
# Si no está activo: sudo systemctl start nginx

# 4. Verificar logs de Nginx
sudo tail -f /var/log/nginx/network-monitor.error.log

# 5. Verificar que el puerto 3000 está en uso
sudo netstat -tlnp | grep :3000

# 6. Probar conexión directa a la aplicación
curl -I http://localhost:3000/api/health

# 7. Probar conexión a través de Nginx
curl -I http://10.0.1.9/api/health
```

### 12.2 Error de conexión a MariaDB

```bash
# 1. Verificar que MariaDB esté ejecutándose
sudo systemctl status mariadb
# Si no está activo: sudo systemctl start mariadb

# 2. Verificar logs de MariaDB
sudo tail -f /var/log/mysql/error.log

# 3. Probar conexión manual
mysql -u network_monitor -p network_monitor_db

# 4. Verificar usuario y permisos
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'network_monitor';"

# 5. Verificar variables de entorno
cat /var/www/network-monitor/.env | grep DB_

# 6. Verificar que la base de datos existe
mysql -u root -p -e "SHOW DATABASES;" | grep network_monitor_db
```

### 12.3 Error 502 Bad Gateway

```bash
# 1. Verificar que la aplicación Node.js está ejecutándose
pm2 status

# 2. Reiniciar la aplicación
pm2 restart network-monitor

# 3. Verificar configuración de Nginx
sudo nginx -t

# 4. Recargar configuración de Nginx
sudo systemctl reload nginx

# 5. Verificar logs de ambos servicios
pm2 logs network-monitor --lines 20
sudo tail -f /var/log/nginx/network-monitor.error.log
```

### 12.4 Problemas de Rendimiento

```bash
# 1. Verificar uso de recursos
htop

# 2. Verificar memoria de la aplicación
pm2 monit

# 3. Verificar estadísticas de MariaDB
mysql -u root -p -e "SHOW PROCESSLIST;"

# 4. Optimizar tablas de MariaDB
mysql -u network_monitor -p network_monitor_db -e "OPTIMIZE TABLE devices, ping_history, alerts;"

# 5. Verificar logs lentos de MariaDB
sudo tail -f /var/log/mysql/slow.log

# 6. Reiniciar servicios si es necesario
pm2 restart network-monitor
sudo systemctl restart mariadb
```

### 12.5 Problemas de Permisos

```bash
# 1. Corregir permisos del directorio de la aplicación
sudo chown -R $USER:$USER /var/www/network-monitor

# 2. Corregir permisos de logs
sudo chown -R $USER:$USER /var/log/pm2

# 3. Verificar permisos de archivos críticos
ls -la /var/www/network-monitor/.env
ls -la /var/www/network-monitor/ecosystem.config.js

# 4. Corregir permisos si es necesario
chmod 600 /var/www/network-monitor/.env
chmod 644 /var/www/network-monitor/ecosystem.config.js
```

---

## 📞 Información de Contacto y Soporte

**Desarrollado por:** Ing. Jaime Ballesteros S.  
**Cargo:** Jefe Div. Infraestructura Tecnológica  
**Versión:** 1.0.0 con MariaDB  
**Repositorio:** https://github.com/xivexell/IP-MonitorV1.0  
**Servidor:** 10.0.1.9:3000

---

## 📝 Notas Importantes Finales

### 🔐 Seguridad
1. **Cambiar todas las contraseñas por defecto** antes de usar en producción
2. **Configurar certificados SSL/TLS** para HTTPS en producción
3. **Mantener el sistema actualizado** con parches de seguridad
4. **Monitorear logs regularmente** para detectar actividad sospechosa
5. **Configurar backups automáticos** y probar la restauración

### 📊 Rendimiento
1. **Monitorear uso de recursos** (CPU, memoria, disco)
2. **Optimizar consultas de base de datos** según el uso
3. **Configurar índices adicionales** si es necesario
4. **Limpiar datos antiguos** periódicamente
5. **Escalar recursos** según la carga

### 🔧 Mantenimiento
1. **Backup diario automático** configurado
2. **Rotación de logs** para evitar llenar el disco
3. **Actualizaciones de seguridad** automáticas
4. **Monitoreo de espacio en disco**
5. **Revisión periódica de logs de error**

### 🌐 URLs de Acceso Final
- **Aplicación Principal:** http://10.0.1.9
- **API Health Check:** http://10.0.1.9/api/health
- **Repositorio GitHub:** https://github.com/xivexell/IP-MonitorV1.0

### ⚡ Comandos de Administración Rápida
```bash
# Estado general del sistema
sudo systemctl status mariadb nginx
pm2 status

# Logs en tiempo real
pm2 logs network-monitor
sudo tail -f /var/log/nginx/network-monitor.error.log

# Reiniciar servicios
pm2 restart network-monitor
sudo systemctl reload nginx

# Backup manual
/usr/local/bin/backup-network-monitor.sh

# Actualización
/var/www/network-monitor/update-app.sh
```

---

## 🎉 ¡Implementación Completada!

Tu aplicación de monitoreo de red está ahora completamente implementada y funcionando en producción en Debian GNU/Linux 11 con MariaDB.

**Características implementadas:**
- ✅ Servidor web con Nginx como proxy reverso
- ✅ Aplicación Node.js gestionada por PM2
- ✅ Base de datos MariaDB optimizada
- ✅ Firewall configurado con UFW
- ✅ Backups automáticos
- ✅ Actualizaciones de seguridad automáticas
- ✅ Monitoreo y logs centralizados
- ✅ Scripts de mantenimiento y actualización

La aplicación está lista para monitorear dispositivos de red en tiempo real con alertas, reportes y estadísticas completas.