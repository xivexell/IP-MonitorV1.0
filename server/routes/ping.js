import express from 'express';
import { executeQuery } from '../config/database.js';

const router = express.Router();

// Simular ping a un dispositivo
router.post('/test/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    
    // Validar formato IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ error: 'Formato de IP inválido' });
    }

    // Simular ping (en producción real, aquí se haría un ping real)
    const result = await simulatePing(ip);
    
    res.json({
      ip,
      success: result.success,
      latency: result.latency,
      timestamp: new Date().toISOString(),
      message: result.success 
        ? `Ping exitoso: ${result.latency}ms` 
        : 'Ping falló: Host no alcanzable'
    });
  } catch (error) {
    console.error('Error ejecutando ping de prueba:', error);
    res.status(500).json({ error: 'Error ejecutando ping de prueba' });
  }
});

// Ejecutar ping a todos los dispositivos
router.post('/all', async (req, res) => {
  try {
    const devices = await executeQuery('SELECT id, ip, alias FROM devices');
    
    const results = await Promise.all(
      devices.map(async (device) => {
        const pingResult = await simulatePing(device.ip);
        
        // Actualizar resultado en la base de datos
        await fetch(`http://localhost:${process.env.PORT || 3000}/api/devices/${device.id}/ping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: pingResult.success,
            latency: pingResult.latency,
            timestamp: new Date().toISOString()
          })
        });

        return {
          deviceId: device.id,
          ip: device.ip,
          alias: device.alias,
          success: pingResult.success,
          latency: pingResult.latency
        };
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      totalDevices: devices.length,
      successfulPings: results.filter(r => r.success).length,
      failedPings: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Error ejecutando ping a todos los dispositivos:', error);
    res.status(500).json({ error: 'Error ejecutando ping a todos los dispositivos' });
  }
});

// Obtener estadísticas de ping
router.get('/stats', async (req, res) => {
  try {
    const { deviceId, hours = 24 } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_pings,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_pings,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_pings,
        AVG(CASE WHEN success = TRUE THEN latency ELSE NULL END) as avg_latency,
        MIN(CASE WHEN success = TRUE THEN latency ELSE NULL END) as min_latency,
        MAX(CASE WHEN success = TRUE THEN latency ELSE NULL END) as max_latency
      FROM ping_history 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;

    const params = [parseInt(hours)];

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }

    const [stats] = await executeQuery(query, params);

    const availability = stats.total_pings > 0 
      ? ((stats.successful_pings / stats.total_pings) * 100).toFixed(2)
      : '100.00';

    res.json({
      period: `${hours} horas`,
      totalPings: stats.total_pings || 0,
      successfulPings: stats.successful_pings || 0,
      failedPings: stats.failed_pings || 0,
      availability: parseFloat(availability),
      avgLatency: stats.avg_latency ? Math.round(stats.avg_latency) : null,
      minLatency: stats.min_latency || null,
      maxLatency: stats.max_latency || null
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de ping:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas de ping' });
  }
});

// Función para simular ping (reemplazar con implementación real en producción)
async function simulatePing(ip) {
  // Simular tiempo de respuesta de red
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  
  // Simular condiciones de red variables
  const random = Math.random();
  const success = random > 0.05; // 95% de éxito
  
  if (success) {
    // Simular latencia variable basada en la IP
    const baseLatency = getBaseLatencyForIP(ip);
    const variation = (Math.random() - 0.5) * 40; // ±20ms de variación
    const latency = Math.max(1, Math.round(baseLatency + variation));
    
    return { success: true, latency };
  } else {
    return { success: false, latency: null };
  }
}

// Función para obtener latencia base simulada basada en IP
function getBaseLatencyForIP(ip) {
  // Simular diferentes latencias según el rango de IP
  const parts = ip.split('.').map(Number);
  const hash = parts.reduce((acc, part) => acc + part, 0);
  
  // Generar latencia base entre 5ms y 150ms
  return 5 + (hash % 145);
}

export default router;