import express from 'express';
import { executeQuery } from '../config/database.js';

const router = express.Router();

// Obtener todas las alertas
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, acknowledged } = req.query;
    
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
    
    if (acknowledged !== undefined) {
      query += ' WHERE a.acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const alerts = await executeQuery(query, params);

    // Formatear respuesta
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id.toString(),
      type: alert.type,
      device: {
        id: alert.device_id,
        ip: alert.device_ip,
        alias: alert.device_alias
      },
      message: alert.message,
      acknowledged: Boolean(alert.acknowledged),
      timestamp: alert.created_at
    }));

    res.json(formattedAlerts);
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ error: 'Error obteniendo alertas' });
  }
});

// Obtener alertas recientes (últimas 24 horas)
router.get('/recent', async (req, res) => {
  try {
    const alerts = await executeQuery(`
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
      WHERE a.created_at >= datetime('now', '-24 hours')
      ORDER BY a.created_at DESC
      LIMIT 50
    `);

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id.toString(),
      type: alert.type,
      device: {
        id: alert.device_id,
        ip: alert.device_ip,
        alias: alert.device_alias
      },
      message: alert.message,
      acknowledged: Boolean(alert.acknowledged),
      timestamp: alert.created_at
    }));

    res.json(formattedAlerts);
  } catch (error) {
    console.error('Error obteniendo alertas recientes:', error);
    res.status(500).json({ error: 'Error obteniendo alertas recientes' });
  }
});

// Marcar alerta como reconocida
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      'UPDATE alerts SET acknowledged = 1 WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({ message: 'Alerta marcada como reconocida' });
  } catch (error) {
    console.error('Error reconociendo alerta:', error);
    res.status(500).json({ error: 'Error reconociendo alerta' });
  }
});

// Marcar todas las alertas como reconocidas
router.put('/acknowledge-all', async (req, res) => {
  try {
    const result = await executeQuery(
      'UPDATE alerts SET acknowledged = 1 WHERE acknowledged = 0'
    );

    res.json({ 
      message: 'Todas las alertas marcadas como reconocidas',
      count: result.changes
    });
  } catch (error) {
    console.error('Error reconociendo todas las alertas:', error);
    res.status(500).json({ error: 'Error reconociendo todas las alertas' });
  }
});

// Eliminar alertas antiguas
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await executeQuery(
      'DELETE FROM alerts WHERE created_at < datetime("now", "-" || ? || " days")',
      [parseInt(days)]
    );

    res.json({ 
      message: `Alertas anteriores a ${days} días eliminadas`,
      count: result.changes
    });
  } catch (error) {
    console.error('Error limpiando alertas:', error);
    res.status(500).json({ error: 'Error limpiando alertas' });
  }
});

// Obtener estadísticas de alertas
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN type = 'down' THEN 1 ELSE 0 END) as down_alerts,
        SUM(CASE WHEN type = 'recovery' THEN 1 ELSE 0 END) as recovery_alerts,
        SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged_alerts,
        SUM(CASE WHEN created_at >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as alerts_24h,
        SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as alerts_7d
      FROM alerts
    `);

    res.json(stats || {
      total_alerts: 0,
      down_alerts: 0,
      recovery_alerts: 0,
      unacknowledged_alerts: 0,
      alerts_24h: 0,
      alerts_7d: 0
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas de alertas' });
  }
});

export default router;