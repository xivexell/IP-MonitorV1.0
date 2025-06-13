# 📋 Tutorial: Despliegue en Producción - Aplicación de Monitoreo de Red

## 🎯 Objetivo
Desplegar la aplicación de monitoreo de red en un servidor Debian GNU/Linux 11 (bullseye) en modo CLI para uso en producción.

## 📋 Requisitos Previos
- Servidor Debian 11 con acceso SSH
- Usuario con privilegios sudo
- Conexión a internet estable
- Dominio o IP pública (opcional para HTTPS)

---

## 🚀 PASO 1: Preparación del Servidor

### 1.1 Actualizar el Sistema
```bash
# Conectarse al servidor via SSH
ssh usuario@tu-servidor.com

# Actualizar la lista de paquetes
sudo apt update

# Actualizar todos los paquetes instalados
sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
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

# Habilitar el firewall
sudo ufw enable

# Verificar el estado
sudo ufw status
```

---

## 🟢 PASO 2: Instalación de Node.js

### 2.1 Instalar Node.js 18 LTS
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

### 2.2 Instalar PM2 (Gestor de Procesos)
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar la instalación
pm2 --version
```

---

## 🌐 PASO 3: Instalación y Configuración de Nginx

### 3.1 Instalar Nginx
```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar el estado
sudo systemctl status nginx
```

### 3.2 Configurar Nginx para la Aplicación
```bash
# Crear archivo de configuración para la aplicación
sudo nano /etc/nginx/sites-available/network-monitor
```

**Contenido del archivo `/etc/nginx/sites-available/network-monitor`:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;  # Cambiar por tu dominio o IP
    
    # Redirigir a HTTPS (opcional, configurar después)
    # return 301 https://$server_name$request_uri;
    
    # Configuración para HTTP (temporal)
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
    }
    
    # Configuración para archivos estáticos
    location /static/ {
        alias /var/www/network-monitor/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Configuración de logs
    access_log /var/log/nginx/network-monitor.access.log;
    error_log /var/log/nginx/network-monitor.error.log;
}
```

### 3.3 Activar la Configuración
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

## 📁 PASO 4: Preparación de la Aplicación

### 4.1 Crear Directorio de la Aplicación
```bash
# Crear directorio para la aplicación
sudo mkdir -p /var/www/network-monitor

# Cambiar propietario del directorio
sudo chown -R $USER:$USER /var/www/network-monitor

# Navegar al directorio
cd /var/www/network-monitor
```

### 4.2 Clonar o Subir la Aplicación

**Opción A: Si tienes Git configurado**
```bash
# Clonar desde repositorio (si aplica)
git clone https://github.com/tu-usuario/network-monitor.git .
```

**Opción B: Subir archivos manualmente**
```bash
# En tu máquina local, comprimir la aplicación
# zip -r network-monitor.zip . -x node_modules/\* .git/\*

# Subir al servidor usando SCP
# scp network-monitor.zip usuario@tu-servidor.com:/var/www/network-monitor/

# En el servidor, descomprimir
unzip network-monitor.zip
rm network-monitor.zip
```

### 4.3 Instalar Dependencias y Construir la Aplicación
```bash
# Asegurarse de estar en el directorio correcto
cd /var/www/network-monitor

# Instalar dependencias
npm install

# Construir la aplicación para producción
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/
```

---

## 🔧 PASO 5: Configuración del Servidor de Producción

### 5.1 Crear Servidor Express para Producción
```bash
# Crear archivo server.js
nano server.js
```

**Contenido del archivo `server.js`:**
```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, 'dist')));

// Configurar headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Manejar rutas de SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Aplicación disponible en: http://localhost:${PORT}`);
});

// Manejo de errores
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});
```

### 5.2 Instalar Express
```bash
# Instalar Express como dependencia
npm install express

# Probar el servidor localmente
node server.js
```

---

## 🔄 PASO 6: Configuración de PM2

### 6.1 Crear Archivo de Configuración PM2
```bash
# Crear archivo de configuración PM2
nano ecosystem.config.js
```

**Contenido del archivo `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'network-monitor',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/network-monitor-error.log',
    out_file: '/var/log/pm2/network-monitor-out.log',
    log_file: '/var/log/pm2/network-monitor.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 6.2 Configurar Logs de PM2
```bash
# Crear directorio para logs de PM2
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### 6.3 Iniciar la Aplicación con PM2
```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js

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

## 🔒 PASO 7: Configuración de HTTPS con Let's Encrypt (Opcional pero Recomendado)

### 7.1 Instalar Certbot
```bash
# Instalar snapd
sudo apt install -y snapd

# Instalar certbot
sudo snap install --classic certbot

# Crear enlace simbólico
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 7.2 Obtener Certificado SSL
```bash
# Obtener certificado (reemplazar con tu dominio)
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones en pantalla
# Certbot configurará automáticamente Nginx para HTTPS
```

### 7.3 Configurar Renovación Automática
```bash
# Probar renovación automática
sudo certbot renew --dry-run

# El cron job se configura automáticamente
```

---

## 📊 PASO 8: Monitoreo y Mantenimiento

### 8.1 Comandos Útiles de PM2
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
```

### 8.2 Comandos Útiles de Nginx
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

### 8.3 Monitoreo del Sistema
```bash
# Ver uso de recursos
htop

# Ver espacio en disco
df -h

# Ver memoria
free -h

# Ver procesos de Node.js
ps aux | grep node
```

---

## 🔄 PASO 9: Actualización de la Aplicación

### 9.1 Script de Actualización
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

# Actualizar código (si usas Git)
echo "📥 Descargando actualizaciones..."
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

echo "✅ Actualización completada!"
echo "🌐 La aplicación está disponible en: http://tu-dominio.com"
```

### 9.2 Hacer el Script Ejecutable
```bash
# Hacer ejecutable
chmod +x update-app.sh

# Ejecutar actualización
./update-app.sh
```

---

## 🛡️ PASO 10: Configuraciones de Seguridad Adicionales

### 10.1 Configurar Fail2Ban (Protección contra Ataques)
```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Crear configuración personalizada
sudo nano /etc/fail2ban/jail.local
```

**Contenido básico de `/etc/fail2ban/jail.local`:**
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
```

```bash
# Reiniciar Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 10.2 Configurar Actualizaciones Automáticas de Seguridad
```bash
# Instalar unattended-upgrades
sudo apt install -y unattended-upgrades

# Configurar actualizaciones automáticas
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📋 PASO 11: Verificación Final

### 11.1 Lista de Verificación
```bash
# ✅ Verificar que Nginx está ejecutándose
sudo systemctl status nginx

# ✅ Verificar que PM2 está ejecutándose
pm2 status

# ✅ Verificar que la aplicación responde
curl -I http://localhost

# ✅ Verificar logs sin errores
pm2 logs network-monitor --lines 50

# ✅ Verificar acceso desde navegador
# Abrir http://tu-dominio.com o http://tu-ip-publica
```

### 11.2 Pruebas de Funcionalidad
1. **Acceder a la aplicación** desde un navegador web
2. **Agregar un dispositivo** para monitorear
3. **Verificar que las alertas funcionan** correctamente
4. **Generar un reporte** PDF/Excel
5. **Configurar las opciones** en la página de configuración

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
```

### 12.2 Error 502 Bad Gateway
```bash
# Verificar que PM2 está ejecutándose
pm2 status

# Reiniciar la aplicación
pm2 restart network-monitor

# Verificar configuración de Nginx
sudo nginx -t
```

### 12.3 Problemas de Permisos
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
**Versión:** 1.0.0

---

## 📝 Notas Importantes

1. **Backup Regular:** Configura backups automáticos de la aplicación y base de datos
2. **Monitoreo:** Considera usar herramientas como Grafana + Prometheus para monitoreo avanzado
3. **Logs:** Revisa regularmente los logs para detectar problemas temprano
4. **Actualizaciones:** Mantén el sistema y dependencias actualizadas
5. **Seguridad:** Cambia contraseñas por defecto y usa autenticación de dos factores cuando sea posible

---

¡Tu aplicación de monitoreo de red ya está lista para producción! 🎉