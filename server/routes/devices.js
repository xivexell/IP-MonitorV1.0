import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from '../config/database.js';

const router = express.Router();

// Obtener todos los dispositivos
router.get('/', async (req, res) => {
  try {
    const devices = await executeQuery(`
      SELECT 
        id,
        ip,
        alias,
        is_active,
        latest_ping,
        avg_latency,
        min_latency,
        max_latency,
        availability,
        total_downs,
        failed_pings,
        total_pings,
        last_status_change,
        downtime,
        uptime,
        created_at,
        updated_at
      FROM devices 
      ORDER BY alias ASC
    `);

    // Obtener historial reciente para cada dispositivo (últimos 100 pings)
    const devicesWithHistory = await Promise.all(
      devices.map(async (device) => {
        const history = await executeQuery(`
          SELECT timestamp, latency, success
          FROM ping_history 
          WHERE device_id = ? 
          ORDER BY timestamp DESC 
          LIMIT 100
        `, [device.id]);

        return {
          ...device,
          isActive: Boolean(device.is_active),
          latestPing: device.latest_ping,
          avgLatency: device.avg_latency,
          minLatency: device.min_latency,
          maxLatency: device.max_latency,
          totalDowns: device.total_downs,
          failedPings: device.failed_pings,
          totalPings: device.total_pings,
          lastStatusChange: device.last_status_change,
          history: history.reverse() // Ordenar cronológicamente
        };
      })
    );

    res.json(devicesWithHistory);
  } catch (error) {
    console.error('Error obteniendo dispositivos:', error);
    res.status(500).json({ error: 'Error obteniendo dispositivos' });
  }
});

// Obtener un dispositivo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const devices = await executeQuery(`
      SELECT * FROM devices WHERE id = ?
    `, [id]);

    if (devices.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    const device = devices[0];

    // Obtener historial completo
    const history = await executeQuery(`
      SELECT timestamp, latency, success
      FROM ping_history 
      WHERE device_id = ? 
      ORDER BY timestamp ASC
    `, [id]);

    res.json({
      ...device,
      isActive: Boolean(device.is_active),
      latestPing: device.latest_ping,
      avgLatency: device.avg_latency,
      minLatency: device.min_latency,
      maxLatency: device.max_latency,
      totalDowns: device.total_downs,
      failedPings: device.failed_pings,
      totalPings: device.total_pings,
      lastStatusChange: device.last_status_change,
      history
    });
  } catch (error) {
    console.error('Error obteniendo dispositivo:', error);
    res.status(500).json({ error: 'Error obteniendo dispositivo' });
  }
});

// Crear nuevo dispositivo
router.post('/', async (req, res) => {
  try {
    const { ip, alias } = req.body;

    if (!ip || !alias) {
      return res.status(400).json({ error: 'IP y alias son requeridos' });
    }

    // Validar formato IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ error: 'Formato de IP inválido' });
    }

    // Verificar que la IP no esté duplicada
    const existing = await executeQuery(
      'SELECT id FROM devices WHERE ip = ?',
      [ip]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya existe un dispositivo con esta IP' });
    }

    const deviceId = uuidv4();
    
    await executeQuery(`
      INSERT INTO devices (
        id, ip, alias, is_active, latest_ping, avg_latency, 
        min_latency, max_latency, availability, total_downs, 
        failed_pings, total_pings, downtime, uptime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deviceId, ip, alias, false, null, 0, 
      0, 0, 100.00, 0, 
      0, 0, 0, 0
    ]);

    // Obtener el dispositivo creado
    const newDevices = await executeQuery(
      'SELECT * FROM devices WHERE id = ?',
      [deviceId]
    );

    const newDevice = newDevices[0];

    res.status(201).json({
      ...newDevice,
      isActive: Boolean(newDevice.is_active),
      latestPing: newDevice.latest_ping,
      avgLatency: newDevice.avg_latency,
      minLatency: newDevice.min_latency,
      maxLatency: newDevice.max_latency,
      totalDowns: newDevice.total_downs,
      failedPings: newDevice.failed_pings,
      totalPings: newDevice.total_pings,
      lastStatusChange: newDevice.last_status_change,
      history: []
    });
  } catch (error) {
    console.error('Error creando dispositivo:', error);
    res.status(500).json({ error: 'Error creando dispositivo' });
  }
});

// Actualizar dispositivo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ip, alias } = req.body;

    if (!ip || !alias) {
      return res.status(400).json({ error: 'IP y alias son requeridos' });
    }

    // Validar formato IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ error: 'Formato de IP inválido' });
    }

    // Verificar que el dispositivo existe
    const existing = await executeQuery(
      'SELECT id FROM devices WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    // Verificar que la IP no esté duplicada (excepto el mismo dispositivo)
    const duplicate = await executeQuery(
      'SELECT id FROM devices WHERE ip = ? AND id != ?',
      [ip, id]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({ error: 'Ya existe otro dispositivo con esta IP' });
    }

    await executeQuery(`
      UPDATE devices 
      SET ip = ?, alias = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [ip, alias, id]);

    // Obtener el dispositivo actualizado
    const updatedDevices = await executeQuery(
      'SELECT * FROM devices WHERE id = ?',
      [id]
    );

    const updatedDevice = updatedDevices[0];

    res.json({
      ...updatedDevice,
      isActive: Boolean(updatedDevice.is_active),
      latestPing: updatedDevice.latest_ping,
      avgLatency: updatedDevice.avg_latency,
      minLatency: updatedDevice.min_latency,
      maxLatency: updatedDevice.max_latency,
      totalDowns: updatedDevice.total_downs,
      failedPings: updatedDevice.failed_pings,
      totalPings: updatedDevice.total_pings,
      lastStatusChange: updatedDevice.last_status_change
    });
  } catch (error) {
    console.error('Error actualizando dispositivo:', error);
    res.status(500).json({ error: 'Error actualizando dispositivo' });
  }
});

// Eliminar dispositivo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el dispositivo existe
    const existing = await executeQuery(
      'SELECT id FROM devices WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    // Eliminar dispositivo (el historial se elimina automáticamente por CASCADE)
    await executeQuery('DELETE FROM devices WHERE id = ?', [id]);

    res.json({ message: 'Dispositivo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando dispositivo:', error);
    res.status(500).json({ error: 'Error eliminando dispositivo' });
  }
});

// Actualizar resultado de ping
router.post('/:id/ping', async (req, res) => {
  try {
    const { id } = req.params;
    const { success, latency, timestamp } = req.body;

    // Verificar que el dispositivo existe
    const devices = await executeQuery(
      'SELECT * FROM devices WHERE id = ?',
      [id]
    );

    if (devices.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    const device = devices[0];
    const pingTimestamp = timestamp ? new Date(timestamp) : new Date();
    const wasActive = Boolean(device.is_active);

    // Insertar resultado de ping en el historial
    await executeQuery(`
      INSERT INTO ping_history (device_id, timestamp, latency, success)
      VALUES (?, ?, ?, ?)
    `, [id, pingTimestamp, success ? latency : null, success]);

    // Calcular nuevas estadísticas
    const newTotalPings = device.total_pings + 1;
    const newFailedPings = success ? device.failed_pings : device.failed_pings + 1;
    const newAvailability = ((newTotalPings - newFailedPings) / newTotalPings) * 100;

    let newMinLatency = device.min_latency;
    let newMaxLatency = device.max_latency;
    let newAvgLatency = device.avg_latency;

    if (success && latency !== null) {
      newMinLatency = device.min_latency === 0 ? latency : Math.min(device.min_latency, latency);
      newMaxLatency = Math.max(device.max_latency, latency);
      
      const totalSuccessfulPings = newTotalPings - newFailedPings;
      newAvgLatency = ((device.avg_latency * (totalSuccessfulPings - 1)) + latency) / totalSuccessfulPings;
    }

    // Calcular tiempo de actividad/inactividad
    let newUptime = device.uptime;
    let newDowntime = device.downtime;
    let newTotalDowns = device.total_downs;

    if (device.last_status_change) {
      const elapsedSeconds = (pingTimestamp.getTime() - new Date(device.last_status_change).getTime()) / 1000;
      if (wasActive) {
        newUptime += elapsedSeconds;
      } else {
        newDowntime += elapsedSeconds;
      }
    }

    // Detectar cambio de estado
    if (wasActive && !success) {
      newTotalDowns += 1;
    }

    const statusChanged = wasActive !== success;

    // Actualizar dispositivo
    await executeQuery(`
      UPDATE devices SET
        is_active = ?,
        latest_ping = ?,
        avg_latency = ?,
        min_latency = ?,
        max_latency = ?,
        availability = ?,
        total_downs = ?,
        failed_pings = ?,
        total_pings = ?,
        last_status_change = ?,
        uptime = ?,
        downtime = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      success,
      success ? latency : null,
      newAvgLatency,
      newMinLatency,
      newMaxLatency,
      newAvailability,
      newTotalDowns,
      newFailedPings,
      newTotalPings,
      statusChanged ? pingTimestamp : device.last_status_change,
      newUptime,
      newDowntime,
      id
    ]);

    // Si hay cambio de estado, crear alerta
    if (statusChanged) {
      await executeQuery(`
        INSERT INTO alerts (device_id, type, message)
        VALUES (?, ?, ?)
      `, [
        id,
        success ? 'recovery' : 'down',
        `Dispositivo ${device.alias} (${device.ip}) ${success ? 'recuperado' : 'caído'}`
      ]);
    }

    res.json({ 
      success: true, 
      statusChanged,
      newStatus: success ? 'active' : 'down'
    });
  } catch (error) {
    console.error('Error actualizando ping:', error);
    res.status(500).json({ error: 'Error actualizando ping' });
  }
});

export default router;