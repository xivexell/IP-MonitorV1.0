import express from 'express';
import { executeQuery } from '../config/database.js';

const router = express.Router();

// Generar reporte de dispositivos
router.get('/devices', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      deviceIds, 
      status = 'all',
      format = 'json'
    } = req.query;

    let query = `
      SELECT 
        d.id,
        d.ip,
        d.alias,
        d.is_active,
        d.latest_ping,
        d.avg_latency,
        d.min_latency,
        d.max_latency,
        d.availability,
        d.total_downs,
        d.failed_pings,
        d.total_pings,
        d.uptime,
        d.downtime,
        d.created_at,
        d.updated_at
      FROM devices d
    `;

    const params = [];
    const conditions = [];

    // Filtrar por dispositivos específicos
    if (deviceIds && deviceIds.length > 0) {
      const deviceIdArray = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
      conditions.push(`d.id IN (${deviceIdArray.map(() => '?').join(',')})`);
      params.push(...deviceIdArray);
    }

    // Filtrar por estado
    if (status === 'active') {
      conditions.push('d.is_active = 1');
    } else if (status === 'down') {
      conditions.push('d.is_active = 0');
    }

    // Filtrar por fecha de creación
    if (startDate) {
      conditions.push('d.created_at >= ?');
      params.push(new Date(startDate).toISOString());
    }

    if (endDate) {
      conditions.push('d.created_at <= ?');
      params.push(new Date(endDate).toISOString());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.alias ASC';

    const devices = await executeQuery(query, params);

    // Formatear datos para el reporte
    const reportData = devices.map(device => ({
      id: device.id,
      ip: device.ip,
      alias: device.alias,
      status: device.is_active ? 'En línea' : 'Desconectado',
      availability: parseFloat(device.availability).toFixed(1) + '%',
      totalPings: device.total_pings,
      failedPings: device.failed_pings,
      avgLatency: device.avg_latency ? Math.round(device.avg_latency) + ' ms' : 'N/A',
      minLatency: device.min_latency + ' ms',
      maxLatency: device.max_latency + ' ms',
      totalDowns: device.total_downs,
      uptime: formatDuration(device.uptime),
      downtime: formatDuration(device.downtime),
      createdAt: device.created_at,
      updatedAt: device.updated_at
    }));

    // Calcular estadísticas del reporte
    const stats = {
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.is_active).length,
      downDevices: devices.filter(d => !d.is_active).length,
      avgAvailability: devices.length > 0 
        ? (devices.reduce((sum, d) => sum + parseFloat(d.availability), 0) / devices.length).toFixed(1) + '%'
        : '0%',
      totalOutages: devices.reduce((sum, d) => sum + d.total_downs, 0)
    };

    const response = {
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          startDate,
          endDate,
          deviceIds,
          status
        },
        stats
      },
      data: reportData
    };

    res.json(response);
  } catch (error) {
    console.error('Error generando reporte de dispositivos:', error);
    res.status(500).json({ error: 'Error generando reporte de dispositivos' });
  }
});

// Generar reporte de historial de pings
router.get('/ping-history', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      deviceId,
      limit = 1000,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        ph.id,
        ph.device_id,
        ph.timestamp,
        ph.latency,
        ph.success,
        d.alias as device_alias,
        d.ip as device_ip
      FROM ping_history ph
      JOIN devices d ON ph.device_id = d.id
    `;

    const params = [];
    const conditions = [];

    if (deviceId) {
      conditions.push('ph.device_id = ?');
      params.push(deviceId);
    }

    if (startDate) {
      conditions.push('ph.timestamp >= ?');
      params.push(new Date(startDate).toISOString());
    }

    if (endDate) {
      conditions.push('ph.timestamp <= ?');
      params.push(new Date(endDate).toISOString());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ph.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const pingHistory = await executeQuery(query, params);

    // Formatear datos
    const formattedHistory = pingHistory.map(ping => ({
      id: ping.id,
      deviceId: ping.device_id,
      deviceAlias: ping.device_alias,
      deviceIp: ping.device_ip,
      timestamp: ping.timestamp,
      latency: ping.latency,
      success: Boolean(ping.success),
      status: ping.success ? 'Éxito' : 'Fallo'
    }));

    res.json({
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, deviceId },
        count: formattedHistory.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      data: formattedHistory
    });
  } catch (error) {
    console.error('Error generando reporte de historial:', error);
    res.status(500).json({ error: 'Error generando reporte de historial' });
  }
});

// Generar reporte de alertas
router.get('/alerts', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      deviceId,
      type,
      acknowledged,
      limit = 500,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        a.id,
        a.device_id,
        a.type,
        a.message,
        a.acknowledged,
        a.created_at,
        d.alias as device_alias,
        d.ip as device_ip
      FROM alerts a
      JOIN devices d ON a.device_id = d.id
    `;

    const params = [];
    const conditions = [];

    if (deviceId) {
      conditions.push('a.device_id = ?');
      params.push(deviceId);
    }

    if (type) {
      conditions.push('a.type = ?');
      params.push(type);
    }

    if (acknowledged !== undefined) {
      conditions.push('a.acknowledged = ?');
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    if (startDate) {
      conditions.push('a.created_at >= ?');
      params.push(new Date(startDate).toISOString());
    }

    if (endDate) {
      conditions.push('a.created_at <= ?');
      params.push(new Date(endDate).toISOString());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const alerts = await executeQuery(query, params);

    // Formatear datos
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      deviceId: alert.device_id,
      deviceAlias: alert.device_alias,
      deviceIp: alert.device_ip,
      type: alert.type,
      typeLabel: alert.type === 'down' ? 'Caída' : 'Recuperación',
      message: alert.message,
      acknowledged: Boolean(alert.acknowledged),
      acknowledgedLabel: alert.acknowledged ? 'Sí' : 'No',
      createdAt: alert.created_at
    }));

    res.json({
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, deviceId, type, acknowledged },
        count: formattedAlerts.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      data: formattedAlerts
    });
  } catch (error) {
    console.error('Error generando reporte de alertas:', error);
    res.status(500).json({ error: 'Error generando reporte de alertas' });
  }
});

// Función auxiliar para formatear duración
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

export default router;