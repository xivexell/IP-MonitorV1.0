import cron from 'node-cron';
import { executeQuery } from '../config/database.js';

let pingInterval = null;
let currentCronJob = null;

// Función para simular ping
async function simulatePing(ip) {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  
  const random = Math.random();
  const success = random > 0.05; // 95% de éxito
  
  if (success) {
    const baseLatency = getBaseLatencyForIP(ip);
    const variation = (Math.random() - 0.5) * 40;
    const latency = Math.max(1, Math.round(baseLatency + variation));
    return { success: true, latency };
  } else {
    return { success: false, latency: null };
  }
}

function getBaseLatencyForIP(ip) {
  const parts = ip.split('.').map(Number);
  const hash = parts.reduce((acc, part) => acc + part, 0);
  return 5 + (hash % 145);
}

// Función para ejecutar ping a todos los dispositivos
async function pingAllDevices() {
  try {
    console.log('🔄 Ejecutando ping automático a todos los dispositivos...');
    
    const devices = await executeQuery('SELECT id, ip, alias, is_active FROM devices');
    
    if (devices.length === 0) {
      console.log('📭 No hay dispositivos para hacer ping');
      return;
    }

    const results = await Promise.all(
      devices.map(async (device) => {
        try {
          const pingResult = await simulatePing(device.ip);
          
          // Actualizar resultado en la base de datos
          await updateDevicePingResult(device, pingResult);
          
          return {
            deviceId: device.id,
            alias: device.alias,
            ip: device.ip,
            success: pingResult.success,
            latency: pingResult.latency,
            statusChanged: false // Se calculará en updateDevicePingResult
          };
        } catch (error) {
          console.error(`❌ Error haciendo ping a ${device.alias} (${device.ip}):`, error);
          return {
            deviceId: device.id,
            alias: device.alias,
            ip: device.ip,
            success: false,
            latency: null,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Ping completado: ${successful} exitosos, ${failed} fallidos de ${devices.length} dispositivos`);
    
    return results;
  } catch (error) {
    console.error('❌ Error en pingAllDevices:', error);
    throw error;
  }
}

// Función para actualizar resultado de ping en la base de datos
async function updateDevicePingResult(device, pingResult) {
  try {
    const pingTimestamp = new Date();
    const wasActive = Boolean(device.is_active);

    // Insertar resultado de ping en el historial
    await executeQuery(`
      INSERT INTO ping_history (device_id, timestamp, latency, success)
      VALUES (?, ?, ?, ?)
    `, [device.id, pingTimestamp, pingResult.success ? pingResult.latency : null, pingResult.success]);

    // Obtener estadísticas actuales del dispositivo
    const [currentDevice] = await executeQuery(
      'SELECT * FROM devices WHERE id = ?',
      [device.id]
    );

    if (!currentDevice) return;

    // Calcular nuevas estadísticas
    const newTotalPings = currentDevice.total_pings + 1;
    const newFailedPings = pingResult.success ? currentDevice.failed_pings : currentDevice.failed_pings + 1;
    const newAvailability = ((newTotalPings - newFailedPings) / newTotalPings) * 100;

    let newMinLatency = currentDevice.min_latency;
    let newMaxLatency = currentDevice.max_latency;
    let newAvgLatency = currentDevice.avg_latency;

    if (pingResult.success && pingResult.latency !== null) {
      newMinLatency = currentDevice.min_latency === 0 ? pingResult.latency : Math.min(currentDevice.min_latency, pingResult.latency);
      newMaxLatency = Math.max(currentDevice.max_latency, pingResult.latency);
      
      const totalSuccessfulPings = newTotalPings - newFailedPings;
      newAvgLatency = ((currentDevice.avg_latency * (totalSuccessfulPings - 1)) + pingResult.latency) / totalSuccessfulPings;
    }

    // Calcular tiempo de actividad/inactividad
    let newUptime = currentDevice.uptime;
    let newDowntime = currentDevice.downtime;
    let newTotalDowns = currentDevice.total_downs;

    if (currentDevice.last_status_change) {
      const elapsedSeconds = (pingTimestamp.getTime() - new Date(currentDevice.last_status_change).getTime()) / 1000;
      if (wasActive) {
        newUptime += elapsedSeconds;
      } else {
        newDowntime += elapsedSeconds;
      }
    }

    // Detectar cambio de estado
    if (wasActive && !pingResult.success) {
      newTotalDowns += 1;
    }

    const statusChanged = wasActive !== pingResult.success;

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
      pingResult.success,
      pingResult.success ? pingResult.latency : null,
      newAvgLatency,
      newMinLatency,
      newMaxLatency,
      newAvailability,
      newTotalDowns,
      newFailedPings,
      newTotalPings,
      statusChanged ? pingTimestamp : currentDevice.last_status_change,
      newUptime,
      newDowntime,
      device.id
    ]);

    // Si hay cambio de estado, crear alerta
    if (statusChanged) {
      await executeQuery(`
        INSERT INTO alerts (device_id, type, message)
        VALUES (?, ?, ?)
      `, [
        device.id,
        pingResult.success ? 'recovery' : 'down',
        `Dispositivo ${device.alias} (${device.ip}) ${pingResult.success ? 'recuperado' : 'caído'}`
      ]);

      console.log(`🚨 Alerta: ${device.alias} (${device.ip}) ${pingResult.success ? 'recuperado' : 'caído'}`);
    }

    return statusChanged;
  } catch (error) {
    console.error(`❌ Error actualizando resultado de ping para ${device.alias}:`, error);
    throw error;
  }
}

// Función para obtener el intervalo de ping actual
async function getCurrentPingInterval() {
  try {
    const [setting] = await executeQuery(
      'SELECT value FROM settings WHERE key_name = ?',
      ['ping_interval']
    );
    
    return setting ? parseInt(setting.value) : 5; // Default 5 segundos
  } catch (error) {
    console.error('Error obteniendo intervalo de ping:', error);
    return 5; // Default fallback
  }
}

// Función para iniciar el servicio de ping
export async function startPingService() {
  try {
    // Obtener intervalo actual
    const interval = await getCurrentPingInterval();
    
    // Detener job anterior si existe
    if (currentCronJob) {
      currentCronJob.stop();
      currentCronJob = null;
    }

    // Crear expresión cron basada en el intervalo
    const cronExpression = `*/${interval} * * * * *`; // Cada X segundos
    
    console.log(`📡 Iniciando servicio de ping automático cada ${interval} segundos`);
    
    // Crear nuevo job de cron
    currentCronJob = cron.schedule(cronExpression, async () => {
      try {
        await pingAllDevices();
      } catch (error) {
        console.error('❌ Error en ping automático:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/Bogota" // Ajustar según tu zona horaria
    });

    // Ejecutar ping inicial
    setTimeout(async () => {
      try {
        await pingAllDevices();
      } catch (error) {
        console.error('❌ Error en ping inicial:', error);
      }
    }, 2000); // Esperar 2 segundos antes del primer ping

    console.log('✅ Servicio de ping automático iniciado correctamente');
  } catch (error) {
    console.error('❌ Error iniciando servicio de ping:', error);
    throw error;
  }
}

// Función para reiniciar el servicio con nuevo intervalo
export async function restartPingService() {
  console.log('🔄 Reiniciando servicio de ping...');
  await startPingService();
}

// Función para detener el servicio
export function stopPingService() {
  if (currentCronJob) {
    currentCronJob.stop();
    currentCronJob = null;
    console.log('🛑 Servicio de ping detenido');
  }
}

// Función para obtener estado del servicio
export function getPingServiceStatus() {
  return {
    running: currentCronJob ? currentCronJob.running : false,
    interval: pingInterval
  };
}

// Función manual para ejecutar ping inmediato
export async function triggerManualPing() {
  console.log('🔄 Ejecutando ping manual...');
  return await pingAllDevices();
}