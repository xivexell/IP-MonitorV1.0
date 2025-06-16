import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Importar rutas
import deviceRoutes from './routes/devices.js';
import settingsRoutes from './routes/settings.js';
import alertRoutes from './routes/alerts.js';
import reportRoutes from './routes/reports.js';
import pingRoutes from './routes/ping.js';

// Importar servicios
import { initializeDatabase } from './config/database.js';
import { startPingService } from './services/pingService.js';

// Configuración
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Puerto por defecto 3000
const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: 'Demasiadas solicitudes desde esta IP, intente de nuevo más tarde.'
});

app.use(limiter);

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'http://10.0.1.9:3000', 'http://10.0.1.9', 'http://localhost:3000'].filter(Boolean)
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Rutas de la API
app.use('/api/devices', deviceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ping', pingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    host: HOST,
    port: PORT
  });
});

// Manejar rutas de SPA en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    console.log('✅ Base de datos inicializada correctamente');

    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor ejecutándose en ${HOST}:${PORT}`);
      console.log(`🌐 Aplicación disponible en:`);
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Red: http://10.0.1.9:${PORT}`);
      console.log(`📊 API disponible en: http://10.0.1.9:${PORT}/api`);
      console.log(`🔍 Health check: http://10.0.1.9:${PORT}/api/health`);
    });

    // Iniciar servicio de ping automático
    startPingService();
    console.log('📡 Servicio de ping automático iniciado');

    // Programar tareas de mantenimiento
    cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Ejecutando tareas de mantenimiento nocturno...');
      // Aquí se pueden agregar tareas de limpieza de datos antiguos
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales del sistema
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();