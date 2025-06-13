# 📋 Manual Completo: Despliegue con MariaDB - Aplicación de Monitoreo de Red

## 🎯 Objetivo
Desplegar la aplicación de monitoreo de red con base de datos MariaDB en un servidor Debian GNU/Linux 11 (bullseye) para uso en producción empresarial.

**Datos del Servidor:**
- IP del Servidor: `10.0.1.9`
- Repositorio GitHub: `https://github.com/xivexell/IP-MonitorV1.0`
- Base de Datos: MariaDB

## 📋 Requisitos Previos
- Servidor Debian 11 con acceso SSH
- Usuario con privilegios sudo
- Conexión a internet estable
- Mínimo 2GB RAM y 20GB espacio en disco

---

## 🚀 PASO 1: Preparación del Servidor

### 1.1 Conectar al Servidor y Actualizar Sistema
```bash
# Conectarse al servidor via SSH
ssh usuario@10.0.1.9

# Actualizar la lista de paquetes
sudo apt update

# Actualizar todos los paquetes instalados
sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential
```

### 1.2 Configurar el Firewall (UFW)
```bash
# Instalar UFW si no está instalado
sudo apt install -y ufw

# Configurar reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (IMPORTANTE: no bloquear tu conexión actual)
sudo ufw allow ssh
sudo ufw allow 22

# Permitir HTTP y HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Permitir MariaDB (solo desde localhost por seguridad)
sudo ufw allow from 127.0.0.1 to any port 3306

# Habilitar el firewall
sudo ufw enable

# Verificar el estado
sudo ufw status
```

---

## 🗄️ PASO 2: Instalación y Configuración de MariaDB

### 2.1 Instalar MariaDB Server
```bash
# Instalar MariaDB Server
sudo apt install -y mariadb-server mariadb-client

# Verificar que MariaDB esté ejecutándose
sudo systemctl status mariadb

# Habilitar MariaDB para que inicie automáticamente
sudo systemctl enable mariadb

# Verificar la versión instalada
mysql --version
```

### 2.2 Configurar Seguridad de MariaDB
```bash
# Ejecutar script de seguridad
sudo mysql_secure_installation

# Responder las preguntas de la siguiente manera:
# - Enter current password for root: [Presionar ENTER - no hay contraseña]
# - Set root password? [Y/n]: Y
# - New password: secure_password_2024
# - Re-enter new password: secure_password_2024
# - Remove anonymous users? [Y/n]: Y
# - Disallow root login remotely? [Y/n]: Y
# - Remove test database and access to it? [Y/n]: Y
# - Reload privilege tables now? [Y/n]: Y
```

### 2.3 Crear Base de Datos y Usuario Específico
```bash
# Conectar a MariaDB como root
sudo mysql -u root -p
# Ingresar la contraseña: secure_password_2024
```

**Ejecutar los siguientes comandos SQL uno por uno:**
```sql
-- Crear base de datos
CREATE DATABASE network_monitor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación
CREATE USER 'network_monitor'@'localhost' IDENTIFIED BY 'secure_password_2024';

-- Otorgar permisos completos sobre la base de datos
GRANT ALL PRIVILEGES ON network_monitor_db.* TO 'network_monitor'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar la creación de la base de datos
SHOW DATABASES;

-- Verificar la creación del usuario
SELECT User, Host FROM mysql.user WHERE User = 'network_monitor';

-- Salir de MariaDB
EXIT;
```

### 2.4 Verificar Conexión con el Nuevo Usuario
```bash
# Probar conexión con el nuevo usuario
mysql -u network_monitor -p network_monitor_db
# Ingresar la contraseña: secure_password_2024

# Si la conexión es exitosa, verás el prompt de MySQL
# Ejecutar una consulta de prueba:
SHOW TABLES;
# Debería mostrar "Empty set" ya que no hay tablas aún

# Salir
EXIT;
```

### 2.5 Configurar MariaDB para Producción
```bash
# Crear backup de la configuración original
sudo cp /etc/mysql/mariadb.conf.d/50-server.cnf /etc/mysql/mariadb.conf.d/50-server.cnf.backup

# Editar configuración de MariaDB
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

**Buscar la sección `[mysqld]` y agregar/modificar las siguientes líneas:**
```ini
[mysqld]
# Configuraciones de rendimiento
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Configuraciones de conexión
max_connections = 200
connect_timeout = 60
wait_timeout = 28800
interactive_timeout = 28800

# Configuraciones de seguridad
bind-address = 127.0.0.1
local-infile = 0

# Configuraciones de logs
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Configuraciones de charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

```bash
# Reiniciar MariaDB para aplicar cambios
sudo systemctl restart mariadb

# Verificar que MariaDB esté funcionando
sudo systemctl status mariadb

# Verificar logs por si hay errores
sudo tail -f /var/log/mysql/error.log
# Presionar Ctrl+C para salir del log
```

---

## 🟢 PASO 3: Instalación de Node.js

### 3.1 Instalar Node.js 18 LTS
```bash
# Descargar e instalar NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar la instalación
node --version
npm --version

# Debería mostrar algo como:
# v18.x.x
# 9.x.x
```

### 3.2 Instalar PM2 (Gestor de Procesos)
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar la instalación
pm2 --version

# Configurar PM2 para el usuario actual
pm2 startup
# Ejecutar el comando que PM2 te proporcione
```

---

## 🌐 PASO 4: Instalación y Configuración de Nginx

### 4.1 Instalar Nginx
```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar el estado
sudo systemctl status nginx

# Verificar que Nginx responde
curl -I http://localhost
```

### 4.2 Configurar Nginx para la Aplicación
```bash
# Crear archivo de configuración para la aplicación
sudo nano /etc/nginx/sites-available/network-monitor
```

**Contenido completo del archivo `/etc/nginx/sites-available/network-monitor`:**
```nginx
# Configuración para aplicación de monitoreo de red
server {
    listen 80;
    server_name 10.0.1.9;  # IP del servidor
    
    # Configuración de logs
    access_log /var/log/nginx/network-monitor.access.log;
    error_log /var/log/nginx/network-monitor.error.log;
    
    # Configuración de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Configuración principal - proxy a la aplicación Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
    
    # Configuración para la API
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
        proxy_read_timeout 300;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
    
    # Configuración para health check
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # Configuración de compresión
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

### 4.3 Activar la Configuración
```bash
# Crear enlace simbólico para activar el sitio
sudo ln -s /etc/nginx/sites-available/network-monitor /etc/nginx/sites-enabled/

# Desactivar el sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar la configuración de Nginx
sudo nginx -t

# Si todo está correcto, recargar Nginx
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

# Cambiar propietario del directorio
sudo chown -R $USER:$USER /var/www/network-monitor

# Navegar al directorio
cd /var/www/network-monitor

# Verificar que estamos en el directorio correcto
pwd
# Debería mostrar: /var/www/network-monitor
```

### 5.2 Clonar la Aplicación desde GitHub
```bash
# Clonar el repositorio desde GitHub
git clone https://github.com/xivexell/IP-MonitorV1.0.git .

# Verificar que se clonó correctamente
ls -la

# Debería mostrar los archivos del proyecto:
# - package.json
# - server/
# - src/
# - README.md
# - .env.example
# - etc.
```

### 5.3 Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo de variables de entorno
nano .env
```

**Contenido del archivo `.env` (reemplazar completamente):**
```env
# Configuración de la Base de Datos MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=network_monitor
DB_PASSWORD=secure_password_2024
DB_NAME=network_monitor_db

# Configuración del Servidor
PORT=3000
NODE_ENV=production

# URL del Frontend (para CORS en producción)
FRONTEND_URL=http://10.0.1.9

# Configuración de Seguridad
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_cambiar_en_produccion_2024

# Configuración de Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# Configuración de Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu_token_de_bot_telegram
TELEGRAM_CHAT_ID=tu_chat_id_telegram

# Configuración de Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 5.4 Instalar Dependencias
```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Limpiar caché de npm
npm cache clean --force

# Instalar dependencias
npm install

# Verificar que se instalaron correctamente
ls -la node_modules/

# Crear directorio para logs
mkdir -p logs

# Verificar estructura del proyecto
ls -la
```

---

## 🔧 PASO 6: Configuración de la Base de Datos

### 6.1 Crear las Tablas de la Base de Datos
```bash
# Conectar a MariaDB con el usuario de la aplicación
mysql -u network_monitor -p network_monitor_db
# Ingresar contraseña: secure_password_2024
```

**Ejecutar el siguiente script SQL completo (copiar y pegar todo):**
```sql
-- Crear tabla de dispositivos
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de historial de pings
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

-- Crear tabla de configuraciones
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de alertas
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

-- Verificar que las tablas se crearon correctamente
SHOW TABLES;

-- Verificar que las configuraciones se insertaron
SELECT * FROM settings;

-- Salir de MariaDB
EXIT;
```

### 6.2 Verificar la Estructura de la Base de Datos
```bash
# Verificar que las tablas se crearon correctamente
mysql -u network_monitor -p network_monitor_db -e "SHOW TABLES;"

# Verificar la estructura de la tabla devices
mysql -u network_monitor -p network_monitor_db -e "DESCRIBE devices;"

# Verificar las configuraciones
mysql -u network_monitor -p network_monitor_db -e "SELECT key_name, value FROM settings LIMIT 5;"

# Si todo está correcto, deberías ver las 4 tablas y las configuraciones
```

---

## 🔄 PASO 7: Construcción y Configuración de la Aplicación

### 7.1 Construir la Aplicación
```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Construir la aplicación para producción
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/

# Debería mostrar archivos como index.html, assets/, etc.
```

### 7.2 Probar la Aplicación Localmente
```bash
# Probar que la aplicación inicie correctamente
npm start &

# Esperar unos segundos y verificar que esté funcionando
sleep 5

# Probar la conexión
curl -I http://localhost:3000/api/health

# Debería mostrar HTTP/200 OK

# Detener la aplicación de prueba
pkill -f "node server/index.js"
```

---

## 🔄 PASO 8: Configuración de PM2

### 8.1 Crear Archivo de Configuración PM2
```bash
# Crear archivo de configuración PM2
nano ecosystem.config.js
```

**Contenido del archivo `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'network-monitor',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/network-monitor-error.log',
    out_file: '/var/log/pm2/network-monitor-out.log',
    log_file: '/var/log/pm2/network-monitor.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true
  }]
};
```

### 8.2 Configurar Logs de PM2
```bash
# Crear directorio para logs de PM2
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### 8.3 Iniciar la Aplicación con PM2
```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Iniciar la aplicación
pm2 start ecosystem.config.js --env production

# Verificar el estado
pm2 status

# Ver logs en tiempo real (presionar Ctrl+C para salir)
pm2 logs network-monitor --lines 20

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciarse automáticamente
pm2 startup
# Ejecutar el comando que PM2 te proporcione
```

---

## 📊 PASO 9: Verificación Final

### 9.1 Lista de Verificación Completa
```bash
# ✅ Verificar que MariaDB está ejecutándose
sudo systemctl status mariadb

# ✅ Verificar que Nginx está ejecutándose
sudo systemctl status nginx

# ✅ Verificar que PM2 está ejecutándose
pm2 status

# ✅ Verificar que la aplicación responde
curl -I http://localhost:3000/api/health

# ✅ Verificar que Nginx proxy funciona
curl -I http://10.0.1.9/api/health

# ✅ Verificar logs sin errores
pm2 logs network-monitor --lines 50

# ✅ Verificar conexión a base de datos
mysql -u network_monitor -p network_monitor_db -e "SELECT COUNT(*) as total_settings FROM settings;"

# ✅ Verificar que las tablas existen
mysql -u network_monitor -p network_monitor_db -e "SHOW TABLES;"
```

### 9.2 Pruebas de Funcionalidad
1. **Abrir navegador** y acceder a `http://10.0.1.9`
2. **Verificar que la aplicación carga** correctamente
3. **Agregar un dispositivo** de prueba (ej: 8.8.8.8 - Google DNS)
4. **Verificar que se guarda en la base de datos:**
   ```bash
   mysql -u network_monitor -p network_monitor_db -e "SELECT * FROM devices;"
   ```
5. **Verificar que el ping funciona** y se registra el historial:
   ```bash
   mysql -u network_monitor -p network_monitor_db -e "SELECT COUNT(*) FROM ping_history;"
   ```

---

## 🔧 PASO 10: Comandos de Administración

### 10.1 Comandos Útiles de PM2
```bash
# Ver estado de todas las aplicaciones
pm2 status

# Reiniciar la aplicación
pm2 restart network-monitor

# Parar la aplicación
pm2 stop network-monitor

# Ver logs
pm2 logs network-monitor

# Ver métricas en tiempo real
pm2 monit

# Recargar la aplicación sin downtime
pm2 reload network-monitor

# Ver información detallada
pm2 describe network-monitor
```

### 10.2 Comandos Útiles de MariaDB
```bash
# Conectar a la base de datos
mysql -u network_monitor -p network_monitor_db

# Backup manual
mysqldump -u network_monitor -p network_monitor_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u network_monitor -p network_monitor_db < backup_20241201.sql

# Ver estadísticas de la base de datos
mysql -u network_monitor -p network_monitor_db -e "
SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'network_monitor_db';"
```

### 10.3 Comandos Útiles de Nginx
```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de acceso
sudo tail -f /var/log/nginx/network-monitor.access.log

# Ver logs de errores
sudo tail -f /var/log/nginx/network-monitor.error.log
```

---

## 🔄 PASO 11: Script de Actualización

### 11.1 Crear Script de Actualización
```bash
# Crear script de actualización
nano /var/www/network-monitor/update-app.sh
```

**Contenido del archivo `update-app.sh`:**
```bash
#!/bin/bash

echo "🔄 Iniciando actualización de la aplicación..."

# Navegar al directorio de la aplicación
cd /var/www/network-monitor

# Hacer backup de la versión actual
echo "📦 Creando backup..."
sudo cp -r /var/www/network-monitor /var/backups/network-monitor-$(date +%Y%m%d-%H%M%S)

# Hacer backup de la base de datos
echo "💾 Creando backup de base de datos..."
mysqldump -u network_monitor -psecure_password_2024 network_monitor_db > /var/backups/db_backup_$(date +%Y%m%d-%H%M%S).sql

# Actualizar código desde GitHub
echo "📥 Descargando actualizaciones desde GitHub..."
git pull origin main

# Instalar nuevas dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir nueva versión
echo "🔨 Construyendo aplicación..."
npm run build

# Reiniciar aplicación con PM2
echo "🔄 Reiniciando aplicación..."
pm2 reload network-monitor

# Verificar que la aplicación esté funcionando
echo "🔍 Verificando estado..."
sleep 5
pm2 status

echo "✅ Actualización completada!"
echo "🌐 La aplicación está disponible en: http://10.0.1.9"
echo "📊 Health check: http://10.0.1.9/api/health"
```

### 11.2 Hacer el Script Ejecutable
```bash
# Hacer ejecutable
chmod +x /var/www/network-monitor/update-app.sh

# Probar el script (opcional)
# ./update-app.sh
```

---

## 🆘 PASO 12: Solución de Problemas Comunes

### 12.1 La aplicación no carga
```bash
# Verificar logs de PM2
pm2 logs network-monitor

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/network-monitor.error.log

# Verificar que el puerto 3000 está en uso
sudo netstat -tlnp | grep :3000

# Verificar conexión a MariaDB
mysql -u network_monitor -p network_monitor_db -e "SELECT 1;"
```

### 12.2 Error de conexión a MariaDB
```bash
# Verificar que MariaDB esté ejecutándose
sudo systemctl status mariadb

# Verificar logs de MariaDB
sudo tail -f /var/log/mysql/error.log

# Verificar usuario y permisos
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'network_monitor';"

# Verificar variables de entorno
cat /var/www/network-monitor/.env | grep DB_
```

### 12.3 Error 502 Bad Gateway
```bash
# Verificar que PM2 está ejecutándose
pm2 status

# Reiniciar la aplicación
pm2 restart network-monitor

# Verificar configuración de Nginx
sudo nginx -t

# Verificar logs de la aplicación
pm2 logs network-monitor --lines 100
```

### 12.4 Problemas de Permisos
```bash
# Corregir permisos del directorio
sudo chown -R $USER:$USER /var/www/network-monitor

# Corregir permisos de logs
sudo chown -R $USER:$USER /var/log/pm2
```

---

## 📞 Información de Contacto y Soporte

**Desarrollado por:** Ing. Jaime Ballesteros S.  
**Cargo:** Jefe Div. Infraestructura Tecnológica  
**Versión:** 1.0.0 con MariaDB  
**Repositorio:** https://github.com/xivexell/IP-MonitorV1.0  
**Servidor:** 10.0.1.9

---

## 📝 Notas Importantes

### 🔐 Seguridad
1. **Cambiar contraseñas por defecto** en `.env` y MariaDB
2. **Configurar firewall** correctamente
3. **Mantener MariaDB actualizado**
4. **Configurar backups automáticos**

### 📊 Rendimiento
1. **Monitorear uso de recursos** regularmente
2. **Optimizar consultas MariaDB** si es necesario
3. **Configurar índices** apropiados
4. **Limpiar datos antiguos** periódicamente

### 🔧 Mantenimiento
1. **Backup diario** de base de datos
2. **Rotación de logs** configurada
3. **Actualizaciones de seguridad** automáticas
4. **Monitoreo de espacio en disco**

### 🌐 Acceso a la Aplicación
- **URL Principal:** http://10.0.1.9
- **API Health Check:** http://10.0.1.9/api/health
- **Repositorio GitHub:** https://github.com/xivexell/IP-MonitorV1.0

---

## 📋 Resumen de URLs y Comandos Importantes

### 🔗 URLs de Acceso
- **Aplicación Principal:** http://10.0.1.9
- **Health Check:** http://10.0.1.9/api/health

### 📦 Repositorio
- **GitHub:** https://github.com/xivexell/IP-MonitorV1.0
- **Clone:** `git clone https://github.com/xivexell/IP-MonitorV1.0.git`

### 🖥️ Servidor
- **IP:** 10.0.1.9
- **SSH:** `ssh usuario@10.0.1.9`

### ⚡ Comandos Rápidos
```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs network-monitor

# Reiniciar aplicación
pm2 restart network-monitor

# Verificar MariaDB
mysql -u network_monitor -p network_monitor_db

# Actualizar desde GitHub
cd /var/www/network-monitor && git pull origin main

# Verificar salud de la aplicación
curl http://10.0.1.9/api/health
```

---

¡Tu aplicación de monitoreo de red con MariaDB ya está lista para producción! 🎉

## 🚀 Próximos Pasos Recomendados

1. **Configurar monitoreo** con herramientas de sistema
2. **Implementar alertas por email/Telegram** reales
3. **Configurar cluster MariaDB** para alta disponibilidad
4. **Implementar autenticación de usuarios**
5. **Agregar dashboard de administración**