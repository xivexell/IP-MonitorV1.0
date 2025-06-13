# 📋 Tutorial Completo: Despliegue con MySQL - Aplicación de Monitoreo de Red

## 🎯 Objetivo
Desplegar la aplicación de monitoreo de red con base de datos MySQL en un servidor Debian GNU/Linux 11 (bullseye) para uso en producción empresarial.

## 📋 Requisitos Previos
- Servidor Debian 11 con acceso SSH
- Usuario con privilegios sudo
- Conexión a internet estable
- Dominio o IP pública (opcional para HTTPS)
- Mínimo 2GB RAM y 20GB espacio en disco

**Datos del Servidor:**
- IP del Servidor: `10.0.1.9`
- Repositorio GitHub: `https://github.com/xivexell/IP-MonitorV1.0`

---

## 🚀 PASO 1: Preparación del Servidor

### 1.1 Actualizar el Sistema
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

# Permitir MySQL (solo desde localhost por seguridad)
sudo ufw allow from 127.0.0.1 to any port 3306

# Habilitar el firewall
sudo ufw enable

# Verificar el estado
sudo ufw status
```

---

## 🗄️ PASO 2: Instalación y Configuración de MySQL

### 2.1 Instalar MySQL Server
```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql

# Habilitar MySQL para que inicie automáticamente
sudo systemctl enable mysql
```

### 2.2 Configurar Seguridad de MySQL
```bash
# Ejecutar script de seguridad
sudo mysql_secure_installation

# Responder las preguntas:
# - Validate Password Plugin: Y (recomendado)
# - Password Strength: 2 (STRONG)
# - Remove anonymous users: Y
# - Disallow root login remotely: Y
# - Remove test database: Y
# - Reload privilege tables: Y
```

### 2.3 Crear Base de Datos y Usuario
```bash
# Conectar a MySQL como root
sudo mysql -u root -p

# Ejecutar los siguientes comandos SQL:
```

```sql
-- Crear base de datos
CREATE DATABASE network_monitor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación
CREATE USER 'network_monitor'@'localhost' IDENTIFIED BY 'secure_password_2024';

-- Otorgar permisos completos sobre la base de datos
GRANT ALL PRIVILEGES ON network_monitor_db.* TO 'network_monitor'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar la creación
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'network_monitor';

-- Salir de MySQL
EXIT;
```

### 2.4 Verificar Conexión
```bash
# Probar conexión con el nuevo usuario
mysql -u network_monitor -p network_monitor_db

# Si la conexión es exitosa, salir
EXIT;
```

### 2.5 Configurar MySQL para Producción
```bash
# Editar configuración de MySQL
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

**Agregar/modificar las siguientes líneas:**
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
skip-networking = 0
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
# Reiniciar MySQL para aplicar cambios
sudo systemctl restart mysql

# Verificar que MySQL esté funcionando
sudo systemctl status mysql
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
```

### 4.2 Configurar Nginx para la Aplicación
```bash
# Crear archivo de configuración para la aplicación
sudo nano /etc/nginx/sites-available/network-monitor
```

**Contenido del archivo `/etc/nginx/sites-available/network-monitor`:**
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
    
    # Configuración para archivos estáticos (si se sirven desde Nginx)
    location /static/ {
        alias /var/www/network-monitor/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # Configuración para archivos de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
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

# Desactivar el sitio por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar la configuración de Nginx
sudo nginx -t

# Si todo está correcto, recargar Nginx
sudo systemctl reload nginx
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
# - etc.
```

### 5.3 Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo de variables de entorno
nano .env
```

**Contenido del archivo `.env`:**
```env
# Configuración de la Base de Datos MySQL
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
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_cambiar_en_produccion

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

### 5.4 Instalar Dependencias y Construir la Aplicación
```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Instalar dependencias
npm install

# Construir la aplicación para producción
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/

# Crear directorio para logs
mkdir -p logs
```

---

## 🔧 PASO 6: Configuración del Servidor de Producción

### 6.1 Verificar la Estructura del Proyecto
```bash
# Verificar que todos los archivos estén en su lugar
ls -la

# Debería mostrar:
# - server/ (directorio del backend)
# - dist/ (aplicación frontend compilada)
# - package.json
# - .env
# - node_modules/
```

### 6.2 Probar la Aplicación Localmente
```bash
# Probar que la aplicación inicie correctamente
npm start

# Debería mostrar:
# ✅ Base de datos inicializada correctamente
# 🚀 Servidor ejecutándose en puerto 3000
# 📡 Servicio de ping automático iniciado

# Presionar Ctrl+C para detener
```

### 6.3 Verificar Conexión a la Base de Datos
```bash
# Verificar que las tablas se crearon correctamente
mysql -u network_monitor -p network_monitor_db

# Ejecutar en MySQL:
SHOW TABLES;

# Debería mostrar:
# +--------------------------------+
# | Tables_in_network_monitor_db   |
# +--------------------------------+
# | alerts                         |
# | devices                        |
# | migrations                     |
# | ping_history                   |
# | settings                       |
# +--------------------------------+

# Salir de MySQL
EXIT;
```

---

## 🔄 PASO 7: Configuración de PM2

### 7.1 Crear Archivo de Configuración PM2
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
    instances: 'max',
    exec_mode: 'cluster',
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
    min_uptime: '10s'
  }]
};
```

### 7.2 Configurar Logs de PM2
```bash
# Crear directorio para logs de PM2
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### 7.3 Iniciar la Aplicación con PM2
```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js --env production

# Verificar el estado
pm2 status

# Ver logs en tiempo real
pm2 logs network-monitor

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciarse automáticamente
pm2 startup
# Ejecutar el comando que PM2 te proporcione (algo como):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## 🔒 PASO 8: Configuración de HTTPS con Let's Encrypt (Opcional)

### 8.1 Instalar Certbot
```bash
# Instalar snapd
sudo apt install -y snapd

# Instalar certbot
sudo snap install --classic certbot

# Crear enlace simbólico
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 8.2 Obtener Certificado SSL (Solo si tienes dominio)
```bash
# Si tienes un dominio apuntando a 10.0.1.9, puedes obtener certificado SSL
# sudo certbot --nginx -d tu-dominio.com

# Para IP directa, HTTPS no es necesario en red interna
# La aplicación funcionará perfectamente con HTTP en http://10.0.1.9
```

---

## 📊 PASO 9: Configuración de Monitoreo y Logs

### 9.1 Configurar Rotación de Logs
```bash
# Crear configuración para logrotate
sudo nano /etc/logrotate.d/network-monitor
```

**Contenido del archivo:**
```
/var/log/pm2/network-monitor*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}

/var/www/network-monitor/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 9.2 Configurar Backup Automático de Base de Datos
```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-network-monitor.sh
```

**Contenido del script:**
```bash
#!/bin/bash

# Configuración
DB_NAME="network_monitor_db"
DB_USER="network_monitor"
DB_PASS="secure_password_2024"
BACKUP_DIR="/var/backups/network-monitor"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

# Realizar backup de la base de datos
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Eliminar backups antiguos (mantener solo los últimos 7 días)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

```bash
# Hacer el script ejecutable
sudo chmod +x /usr/local/bin/backup-network-monitor.sh

# Configurar cron para backup diario
sudo crontab -e

# Agregar la siguiente línea:
0 2 * * * /usr/local/bin/backup-network-monitor.sh >> /var/log/backup-network-monitor.log 2>&1
```

---

## 📋 PASO 10: Verificación y Pruebas

### 10.1 Lista de Verificación Completa
```bash
# ✅ Verificar que MySQL está ejecutándose
sudo systemctl status mysql

# ✅ Verificar que Nginx está ejecutándose
sudo systemctl status nginx

# ✅ Verificar que PM2 está ejecutándose
pm2 status

# ✅ Verificar que la aplicación responde
curl -I http://localhost:3000/api/health

# ✅ Verificar logs sin errores
pm2 logs network-monitor --lines 50

# ✅ Verificar conexión a base de datos
mysql -u network_monitor -p network_monitor_db -e "SELECT COUNT(*) FROM settings;"

# ✅ Verificar acceso desde navegador
# Abrir http://10.0.1.9 en tu navegador
```

### 10.2 Pruebas de Funcionalidad
1. **Acceder a la aplicación** desde un navegador web en `http://10.0.1.9`
2. **Agregar un dispositivo** para monitorear
3. **Verificar que los datos se guardan** en MySQL:
   ```bash
   mysql -u network_monitor -p network_monitor_db -e "SELECT * FROM devices;"
   ```
4. **Verificar que las alertas funcionan** correctamente
5. **Generar un reporte** PDF/Excel
6. **Configurar las opciones** en la página de configuración
7. **Verificar el historial de pings** en la base de datos:
   ```bash
   mysql -u network_monitor -p network_monitor_db -e "SELECT COUNT(*) FROM ping_history;"
   ```

---

## 🔧 PASO 11: Comandos de Administración

### 11.1 Comandos Útiles de PM2
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

### 11.2 Comandos Útiles de MySQL
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

### 11.3 Comandos Útiles de Nginx
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

## 🔄 PASO 12: Actualización de la Aplicación

### 12.1 Script de Actualización
```bash
# Crear script de actualización
nano update-app.sh
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
mysqldump -u network_monitor -p$DB_PASSWORD network_monitor_db > /var/backups/db_backup_$(date +%Y%m%d-%H%M%S).sql

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

### 12.2 Hacer el Script Ejecutable
```bash
# Hacer ejecutable
chmod +x update-app.sh

# Ejecutar actualización
./update-app.sh
```

---

## 🛡️ PASO 13: Configuraciones de Seguridad Adicionales

### 13.1 Configurar Fail2Ban
```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Crear configuración personalizada
sudo nano /etc/fail2ban/jail.local
```

**Contenido de `/etc/fail2ban/jail.local`:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/network-monitor.error.log

[mysql]
enabled = true
port = 3306
logpath = /var/log/mysql/error.log
maxretry = 3
```

```bash
# Reiniciar Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 13.2 Configurar Actualizaciones Automáticas de Seguridad
```bash
# Instalar unattended-upgrades
sudo apt install -y unattended-upgrades

# Configurar actualizaciones automáticas
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🆘 PASO 14: Solución de Problemas Comunes

### 14.1 La aplicación no carga
```bash
# Verificar logs de PM2
pm2 logs network-monitor

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/network-monitor.error.log

# Verificar que el puerto 3000 está en uso
sudo netstat -tlnp | grep :3000

# Verificar conexión a MySQL
mysql -u network_monitor -p network_monitor_db -e "SELECT 1;"
```

### 14.2 Error de conexión a MySQL
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql

# Verificar logs de MySQL
sudo tail -f /var/log/mysql/error.log

# Verificar usuario y permisos
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'network_monitor';"

# Verificar variables de entorno
cat .env | grep DB_
```

### 14.3 Error 502 Bad Gateway
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

### 14.4 Problemas de Rendimiento
```bash
# Verificar uso de recursos
htop

# Verificar estadísticas de MySQL
mysql -u network_monitor -p network_monitor_db -e "SHOW PROCESSLIST;"

# Verificar logs lentos de MySQL
sudo tail -f /var/log/mysql/slow.log

# Optimizar tablas de MySQL
mysql -u network_monitor -p network_monitor_db -e "OPTIMIZE TABLE devices, ping_history, alerts;"
```

---

## 📞 Información de Contacto y Soporte

**Desarrollado por:** Ing. Jaime Ballesteros S.  
**Cargo:** Jefe Div. Infraestructura Tecnológica  
**Versión:** 1.0.0 con MySQL  
**Repositorio:** https://github.com/xivexell/IP-MonitorV1.0  
**Servidor:** 10.0.1.9

---

## 📝 Notas Importantes

### 🔐 Seguridad
1. **Cambiar contraseñas por defecto** en `.env`
2. **Configurar firewall** correctamente
3. **Mantener MySQL actualizado**
4. **Usar HTTPS** si tienes dominio
5. **Configurar backups automáticos**

### 📊 Rendimiento
1. **Monitorear uso de recursos** regularmente
2. **Optimizar consultas MySQL** si es necesario
3. **Configurar índices** apropiados
4. **Limpiar datos antiguos** periódicamente

### 🔧 Mantenimiento
1. **Backup diario** de base de datos
2. **Rotación de logs** configurada
3. **Actualizaciones de seguridad** automáticas
4. **Monitoreo de espacio en disco**

### 📈 Escalabilidad
- La aplicación puede manejar **cientos de dispositivos**
- Para más de **1000 dispositivos**, considerar:
  - Servidor dedicado para MySQL
  - Load balancer con múltiples instancias
  - Optimización de base de datos

### 🌐 Acceso a la Aplicación
- **URL Principal:** http://10.0.1.9
- **API Health Check:** http://10.0.1.9/api/health
- **Repositorio GitHub:** https://github.com/xivexell/IP-MonitorV1.0

---

¡Tu aplicación de monitoreo de red con MySQL ya está lista para producción empresarial! 🎉

## 🚀 Próximos Pasos Recomendados

1. **Configurar monitoreo** con Grafana + Prometheus
2. **Implementar alertas por email/Telegram** reales
3. **Configurar cluster MySQL** para alta disponibilidad
4. **Implementar autenticación de usuarios**
5. **Agregar dashboard de administración**

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

# Verificar MySQL
mysql -u network_monitor -p network_monitor_db

# Actualizar desde GitHub
cd /var/www/network-monitor && git pull origin main
```