# Prompt Completo: Aplicación de Monitoreo de Red Empresarial

## Descripción General
Crear una aplicación web completa de monitoreo de red empresarial con las siguientes características principales:

### Tecnologías Base
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Base de Datos**: SQLite (con soporte para MySQL/MariaDB)
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Gráficos**: Chart.js + React-Chartjs-2
- **Reportes**: jsPDF + autoTable + XLSX
- **Notificaciones**: Sistema personalizado con audio

## Arquitectura y Estructura del Proyecto

### Estructura de Directorios
```
/
├── src/
│   ├── components/
│   │   ├── AlertSystem/
│   │   │   └── AlertOverlay.tsx
│   │   ├── Dashboard/
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── DeviceGrid.tsx
│   │   │   ├── StatsSummary.tsx
│   │   │   └── StatusChart.tsx
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       ├── MainLayout.tsx
│   │       └── Sidebar.tsx
│   ├── contexts/
│   │   ├── AlertContext.tsx
│   │   ├── DeviceContext.tsx
│   │   └── SettingsContext.tsx
│   ├── pages/
│   │   ├── AddDevicePage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeviceDetailsPage.tsx
│   │   ├── DevicesPage.tsx
│   │   ├── EditDevicePage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── StatisticsPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── lib/
│   │   └── utils.ts
│   └── App.tsx
├── server/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── alerts.js
│   │   ├── devices.js
│   │   ├── ping.js
│   │   ├── reports.js
│   │   └── settings.js
│   ├── services/
│   │   └── pingService.js
│   └── index.js
├── public/
│   └── alert.mp3
└── package.json
```

## Especificaciones Técnicas Detalladas

### 1. Base de Datos (SQLite)

#### Tabla `devices`
```sql
CREATE TABLE devices (
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
);
```

#### Tabla `ping_history`
```sql
CREATE TABLE ping_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  latency REAL NULL,
  success INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

#### Tabla `settings`
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_name TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla `alerts`
```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('down', 'recovery')),
  message TEXT,
  acknowledged INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

### 2. Backend API (Node.js + Express)

#### Configuración del Servidor
```javascript
// server/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware de seguridad
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
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP'
});

app.use(limiter);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
```

#### Rutas API Principales

**Dispositivos (`/api/devices`)**
- `GET /` - Obtener todos los dispositivos con historial
- `GET /:id` - Obtener dispositivo específico
- `POST /` - Crear nuevo dispositivo
- `PUT /:id` - Actualizar dispositivo
- `DELETE /:id` - Eliminar dispositivo
- `POST /:id/ping` - Actualizar resultado de ping

**Configuraciones (`/api/settings`)**
- `GET /` - Obtener todas las configuraciones
- `PUT /` - Actualizar configuraciones
- `GET /:key` - Obtener configuración específica
- `PUT /:key` - Actualizar configuración específica

**Alertas (`/api/alerts`)**
- `GET /` - Obtener alertas con filtros
- `GET /recent` - Obtener alertas recientes (24h)
- `PUT /:id/acknowledge` - Marcar alerta como reconocida
- `PUT /acknowledge-all` - Marcar todas como reconocidas
- `GET /stats` - Estadísticas de alertas

**Ping (`/api/ping`)**
- `POST /test/:ip` - Probar ping a IP específica
- `POST /all` - Ejecutar ping a todos los dispositivos
- `GET /stats` - Estadísticas de ping

**Reportes (`/api/reports`)**
- `GET /devices` - Reporte de dispositivos
- `GET /ping-history` - Reporte de historial
- `GET /alerts` - Reporte de alertas

### 3. Servicio de Ping Automático

#### Configuración con Cron
```javascript
// server/services/pingService.js
import cron from 'node-cron';

export async function startPingService() {
  const interval = await getCurrentPingInterval(); // Desde settings
  const cronExpression = `*/${interval} * * * * *`; // Cada X segundos
  
  currentCronJob = cron.schedule(cronExpression, async () => {
    await pingAllDevices();
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });
}

async function simulatePing(ip) {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  const random = Math.random();
  const success = random > 0.05; // 95% de éxito
  
  if (success) {
    const baseLatency = getBaseLatencyForIP(ip);
    const variation = (Math.random() - 0.5) * 40;
    const latency = Math.max(1, Math.round(baseLatency + variation));
    return { success: true, latency };
  }
  return { success: false, latency: null };
}
```

### 4. Frontend React

#### Contextos Principales

**DeviceContext**
```typescript
interface DeviceContextProps {
  devices: Device[];
  addDevice: (ip: string, alias: string) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  updateDevice: (id: string, ip: string, alias: string) => Promise<void>;
  updateDeviceStatus: (id: string, isActive: boolean) => void;
  pingAllDevices: () => Promise<void>;
  getDeviceById: (id: string) => Device | undefined;
  isLoading: boolean;
  error: string | null;
}
```

**SettingsContext**
```typescript
interface SettingsContextProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateAlertSettings: (newAlertSettings: Partial<AlertSettings>) => Promise<void>;
  toggleTheme: () => void;
  updateLogo: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}
```

**AlertContext**
```typescript
interface AlertContextProps {
  alerts: Alert[];
  currentAlert: Alert | null;
  triggerAlert: (alertData: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: () => void;
}
```

#### Tipos TypeScript
```typescript
interface Device {
  id: string;
  ip: string;
  alias: string;
  isActive: boolean;
  latestPing: number | null;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  availability: number;
  totalDowns: number;
  failedPings: number;
  totalPings: number;
  lastStatusChange: Date | null;
  downtime: number;
  uptime: number;
  history: PingResult[];
}

interface AppSettings {
  appName: string;
  companyName: string;
  dashboardSubtitle: string;
  logoUrl: string;
  logoFile?: File | null;
  pingInterval: number;
  theme: 'light' | 'dark';
  primaryColor: string;
  alerts: AlertSettings;
}

interface AlertSettings {
  visualEnabled: boolean;
  visualDuration: number;
  visualStyle: 'fade' | 'slide' | 'bounce';
  audioEnabled: boolean;
  audioStartTime: string;
  audioEndTime: string;
  audioDays: string[];
  emailEnabled: boolean;
  emailRecipients: string[];
  telegramEnabled: boolean;
  telegramRecipients: string[];
}
```

### 5. Páginas y Componentes

#### Dashboard Principal
- **StatsSummary**: 6 tarjetas con métricas clave
  - Total dispositivos
  - En línea
  - Desconectados
  - Disponibilidad promedio
  - Latencia promedio
  - Total caídas

- **StatusChart**: Gráfico de líneas con latencia en tiempo real
  - Máximo 20 puntos de datos
  - Múltiples dispositivos en colores diferentes
  - Actualización automática

- **DeviceGrid**: Grid responsivo de tarjetas de dispositivos
  - Estado visual con colores
  - Métricas principales
  - Enlace a detalles

#### Página de Dispositivos
- **Lista completa** con filtros de búsqueda y estado
- **Botón agregar** dispositivo
- **Botón refresh** manual
- **Cards individuales** con información resumida

#### Página de Detalles de Dispositivo
- **Métricas detalladas** en cards
- **Gráfico de historial** de latencia
- **Tabla de estadísticas** completas
- **Botones de acción**: Editar, Eliminar, Refresh

#### Página de Configuración
- **Configuración general**: Nombre app, empresa, logo, intervalo ping
- **Alertas visuales**: Habilitación, duración, estilo
- **Alertas de audio**: Horarios, días activos
- **Notificaciones email**: Destinatarios (simulado)
- **Notificaciones Telegram**: Usuarios (simulado)

### 6. Sistema de Alertas

#### Alertas Visuales
```typescript
const AlertOverlay: React.FC = () => {
  const { currentAlert, dismissAlert } = useAlerts();
  const { settings } = useSettings();
  
  // Solo se muestran en el dashboard principal
  // Estilos: fade, slide, bounce
  // Duración configurable (1-60 segundos)
  // Auto-dismiss automático
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="p-8 rounded-lg shadow-xl max-w-md">
        <h2>{currentAlert?.type === 'down' ? 'Dispositivo Caído' : 'Dispositivo Recuperado'}</h2>
        <p>{currentAlert?.device.alias} ({currentAlert?.device.ip})</p>
        <p>{new Date(currentAlert?.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
};
```

#### Alertas de Audio
```typescript
// Audio alert con archivo MP3 incluido
const [audio] = useState<HTMLAudioElement | null>(
  typeof window !== 'undefined' ? new Audio('/alert.mp3') : null
);

// Lógica de horarios laborales
const now = new Date();
const currentDay = format(now, 'EEEE');
const currentTime = format(now, 'HH:mm');

if (settings.alerts.audioDays.includes(currentDay)) {
  if (currentTime >= settings.alerts.audioStartTime && 
      currentTime <= settings.alerts.audioEndTime) {
    audio.play().catch(err => console.error('Failed to play alert sound:', err));
  }
}
```

### 7. Reportes Profesionales

#### Configuración de Filtros
- **Fechas**: Inicio y fin con selectores de fecha y hora
- **Dispositivos**: Selección múltiple (Ctrl+Click)
- **Estado**: Todos, Solo en línea, Solo desconectados
- **Vista previa**: Tabla con datos filtrados

#### Formato PDF Detallado

**Orientación y Layout**
- Orientación horizontal (landscape)
- Márgenes: 20px en todos los lados
- Fuente: Helvetica (normal, bold)
- Tamaños: 16px (título), 12px (subtítulos), 10px (texto), 8-9px (tabla)

**Estructura del PDF**

1. **Cabecera Profesional**
```javascript
// Título principal
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.text(settings.appName, 20, 15);

// Subtítulo del reporte
doc.setFontSize(12);
doc.setFont('helvetica', 'normal');
doc.text('Informe de Monitoreo de Red', 20, 22);

// Información de la empresa
doc.setFontSize(10);
doc.text(`${settings.dashboardSubtitle} - ${settings.companyName}`, 20, 29);

// Rango de fechas con horas incluidas
doc.text(`Rango de fechas: ${startDateTime} - ${endDateTime}`, 20, 35);
doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 20, 41);
```

2. **Gráfico de Barras de Disponibilidad**
- **Título**: "Porcentaje de Servicios de Conectividad"
- **Subtítulo**: Rango de fechas con horas específicas
- **Dimensiones**: Ancho completo menos márgenes, altura adaptativa
- **Colores**: Celeste claro (#ADD8E6) con borde azul pastel (#87CEEB)
- **Etiquetas**: 
  - Eje Y: "Servicios de Conectividad" (rotado 90°)
  - Eje X: "Total periodo definido del reporte (%)"
- **Cuadrícula**: Líneas verticales cada 10% (0% a 100%)
- **Barras**: Altura mínima 8px, espaciado 2px
- **Datos**: Nombre del dispositivo (IP) + porcentaje

```javascript
const generateAvailabilityChart = (doc, startY) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const chartWidth = pageWidth - 60; // Márgenes simétricos
  const chartHeight = Math.max(80, filteredDevices.length * 12);
  
  // Marco del gráfico
  doc.setDrawColor(200, 200, 200);
  doc.rect(chartX, chartY, chartWidth, chartHeight);
  
  // Cuadrícula y etiquetas
  for (let i = 0; i <= 10; i++) {
    const x = chartX + (chartWidth * i / 10);
    const percentage = i * 10;
    
    if (i > 0) {
      doc.line(x, chartY, x, chartY + chartHeight);
    }
    doc.text(`${percentage}%`, x - 5, chartY + chartHeight + 8);
  }
  
  // Barras de dispositivos
  filteredDevices.forEach((device, index) => {
    const barY = chartY + 10 + (index * (barHeight + barSpacing));
    const barWidth = (device.availability / 100) * (chartWidth - 20);
    
    // Barra de disponibilidad
    doc.setFillColor(173, 216, 230); // Celeste claro
    doc.setDrawColor(135, 206, 235); // Borde azul pastel
    doc.rect(chartX + 10, barY, barWidth, barHeight, 'FD');
    
    // Etiqueta del dispositivo
    const deviceLabel = `${device.alias} (${device.ip})`;
    doc.text(deviceLabel, chartX + 12, barY + barHeight / 2 + 1);
    
    // Porcentaje
    doc.setFont('helvetica', 'bold');
    doc.text(`${device.availability.toFixed(1)}%`, chartX + 15 + barWidth, barY + barHeight / 2 + 1);
  });
};
```

3. **Tabla Detallada de Datos**
- **Columnas** (11 total con anchos específicos):
  1. Dispositivo (12% del ancho)
  2. Dirección IP (10% del ancho)
  3. Disponibilidad (8% del ancho)
  4. Total Pings (8% del ancho)
  5. Pings Fallidos (8% del ancho)
  6. Latencia Promedio (10% del ancho)
  7. Latencia Mínima (9% del ancho)
  8. Latencia Máxima (9% del ancho)
  9. Total Caídas (8% del ancho)
  10. Tiempo Activo (9% del ancho)
  11. Tiempo Inactivo (9% del ancho)

```javascript
autoTable(doc, {
  startY: currentY,
  head: [['Dispositivo', 'Dirección IP', 'Disponibilidad', ...]],
  body: tableData,
  headStyles: {
    fillColor: [59, 130, 246], // Azul primario
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 9,
    cellPadding: 3,
    halign: 'center'
  },
  bodyStyles: {
    fontSize: 8,
    cellPadding: 2,
    valign: 'middle'
  },
  columnStyles: {
    0: { cellWidth: columnWidths[0], halign: 'left' },
    1: { cellWidth: columnWidths[1], halign: 'center' },
    // ... resto de columnas
  },
  theme: 'striped',
  alternateRowStyles: {
    fillColor: [245, 245, 245]
  }
});
```

#### Formato Excel
- **Información de cabecera** con fechas y horas
- **Mismas columnas** que el PDF
- **Formato de celdas** apropiado
- **Nombre de archivo** con fecha

### 8. Estadísticas y Gráficos

#### Página de Estadísticas
- **Selector de dispositivo**: Individual o todos
- **Gráfico de latencia**: Barras con min/avg/max
- **Gráfico de disponibilidad**: Pie chart (individual) o barras (todos)
- **Distribución de caídas**: Barras por dispositivo

#### Configuración de Chart.js
```javascript
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(160, 174, 192, 0.1)' }
    },
    x: {
      grid: { display: false }
    }
  }
};
```

### 9. Diseño y UX

#### Sistema de Colores
- **Primario**: Azul (#3B82F6) configurable
- **Éxito**: Verde (#10B981)
- **Error**: Rojo (#EF4444)
- **Advertencia**: Ámbar (#F59E0B)
- **Neutros**: Escala de grises completa

#### Tema Oscuro/Claro
```css
/* Tailwind dark mode classes */
.dark {
  /* Variables CSS personalizadas */
  --bg-primary: #0f141a;
  --bg-secondary: #1a202c;
  --text-primary: #ffffff;
  --text-secondary: #a0aec0;
}
```

#### Responsividad
- **Mobile first**: Diseño adaptativo desde 320px
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid adaptativo**: 1-4 columnas según pantalla
- **Navegación móvil**: Sidebar colapsable

#### Animaciones
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0.8); opacity: 0; }
  70% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

### 10. Configuración de Producción

#### Variables de Entorno
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=network_monitor
DB_PASSWORD=secure_password_2024
DB_NAME=network_monitor_db

# Servidor
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
FRONTEND_URL=http://10.0.1.9:3000

# Seguridad
JWT_SECRET=your_super_secret_jwt_key

# Email (simulado)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Telegram (simulado)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

#### PM2 Configuration
```javascript
module.exports = {
  apps: [{
    name: 'network-monitor',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/pm2/network-monitor-error.log',
    out_file: '/var/log/pm2/network-monitor-out.log',
    log_file: '/var/log/pm2/network-monitor.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true
  }]
};
```

### 11. Funcionalidades Específicas

#### Validación de IP
```typescript
const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};
```

#### Formateo de Duración
```typescript
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};
```

#### Cálculo de Disponibilidad
```typescript
const calculateAvailability = (successful: number, total: number): number => {
  if (total === 0) return 100;
  return (successful / total) * 100;
};
```

### 12. Manejo de Errores

#### Frontend
```typescript
// Context error handling
const [error, setError] = useState<string | null>(null);

try {
  const result = await api.call();
  setError(null);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Error desconocido');
  // Fallback a localStorage si la API falla
}
```

#### Backend
```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});
```

### 13. Optimizaciones de Rendimiento

#### Lazy Loading
```typescript
// Componentes lazy
const LazyStatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const LazyReportsPage = lazy(() => import('./pages/ReportsPage'));
```

#### Memoización
```typescript
// Memoizar cálculos costosos
const memoizedStats = useMemo(() => {
  return devices.reduce((acc, device) => {
    acc.totalDevices++;
    if (device.isActive) acc.onlineDevices++;
    return acc;
  }, { totalDevices: 0, onlineDevices: 0 });
}, [devices]);
```

#### Debouncing
```typescript
// Debounce para búsquedas
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 14. Seguridad

#### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: 'Demasiadas solicitudes desde esta IP'
});
```

#### Helmet Configuration
```javascript
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
```

#### Input Sanitization
```javascript
// Validación de entrada
const validateDeviceInput = (ip, alias) => {
  if (!ip || !alias) {
    throw new Error('IP y alias son requeridos');
  }
  
  if (!isValidIP(ip)) {
    throw new Error('Formato de IP inválido');
  }
  
  if (alias.length < 2 || alias.length > 255) {
    throw new Error('Alias debe tener entre 2 y 255 caracteres');
  }
};
```

### 15. Testing y Calidad

#### Estructura de Tests
```typescript
// Ejemplo de test para utilidades
describe('formatDuration', () => {
  test('formats seconds correctly', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3661)).toBe('1h 1m');
  });
});

// Test para componentes
describe('DeviceCard', () => {
  test('renders device information correctly', () => {
    const mockDevice = {
      id: '1',
      alias: 'Test Device',
      ip: '192.168.1.1',
      isActive: true,
      availability: 99.5
    };
    
    render(<DeviceCard device={mockDevice} />);
    expect(screen.getByText('Test Device')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });
});
```

### 16. Documentación y Comentarios

#### JSDoc para Funciones
```typescript
/**
 * Calcula la disponibilidad de un dispositivo
 * @param successful - Número de pings exitosos
 * @param total - Número total de pings
 * @returns Porcentaje de disponibilidad (0-100)
 */
const calculateAvailability = (successful: number, total: number): number => {
  if (total === 0) return 100;
  return (successful / total) * 100;
};
```

#### Comentarios de Configuración
```javascript
// Configuración de CORS para producción
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'http://10.0.1.9:3000', 'http://10.0.1.9']
    : true,
  credentials: true
}));
```

### 17. Monitoreo y Logs

#### Logging Structure
```javascript
// Configuración de logs
const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || 'logs/app.log';

// Log de eventos importantes
console.log('✅ Base de datos inicializada correctamente');
console.log('🚀 Servidor ejecutándose en puerto', PORT);
console.log('📡 Servicio de ping automático iniciado');
console.error('❌ Error en ping automático:', error);
```

#### Health Check
```javascript
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    host: HOST,
    port: PORT
  });
});
```

### 18. Deployment

#### Build Process
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "start": "node server/index.js"
  }
}
```

#### Production Optimizations
```javascript
// Vite config para producción
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'uuid'],
        },
      },
    },
  },
});
```

## Características Especiales de la Aplicación

### 1. **Simulación Realista de Red**
- Latencias variables basadas en IP
- Porcentaje de fallo configurable (5% por defecto)
- Variación temporal en las respuestas

### 2. **Interfaz Profesional**
- Diseño tipo Apple con atención al detalle
- Animaciones suaves y micro-interacciones
- Tema oscuro/claro con transiciones

### 3. **Alertas Inteligentes**
- Sistema de horarios laborales
- Múltiples canales de notificación
- Configuración granular por tipo

### 4. **Reportes Empresariales**
- PDF con gráficos integrados
- Excel con datos completos
- Filtros avanzados de fecha/hora

### 5. **Escalabilidad**
- Arquitectura modular
- Base de datos optimizada
- Caching inteligente

### 6. **Experiencia de Usuario**
- Navegación intuitiva
- Feedback visual inmediato
- Estados de carga y error

### 7. **Configurabilidad Total**
- Branding personalizable
- Intervalos ajustables
- Alertas configurables

## Notas de Implementación

1. **Usar SQLite por defecto** para simplicidad de despliegue
2. **Incluir archivo de audio** para alertas (alert.mp3)
3. **Implementar fallbacks** para cuando la API no esté disponible
4. **Optimizar para producción** con compresión y caching
5. **Documentar todas las APIs** con ejemplos de uso
6. **Incluir manejo de errores** robusto en todos los niveles
7. **Configurar CORS** apropiadamente para producción
8. **Implementar rate limiting** para prevenir abuso
9. **Usar TypeScript** estricto para mejor calidad de código
10. **Incluir tests básicos** para funciones críticas

## Resultado Final

Una aplicación web completa, profesional y lista para producción que permite monitorear dispositivos de red en tiempo real, con alertas inteligentes, reportes detallados y una interfaz de usuario moderna y responsive. La aplicación debe ser capaz de manejar cientos de dispositivos simultáneamente y proporcionar insights valiosos sobre la salud de la red empresarial.