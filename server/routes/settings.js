import express from 'express';
import { executeQuery } from '../config/database.js';

const router = express.Router();

// Obtener todas las configuraciones
router.get('/', async (req, res) => {
  try {
    const settings = await executeQuery('SELECT key_name, value FROM settings');
    
    // Convertir array a objeto
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key_name] = setting.value;
      return acc;
    }, {});

    // Estructurar respuesta según el formato esperado por el frontend
    const response = {
      appName: settingsObj.app_name || 'Monitor de Red',
      companyName: settingsObj.company_name || 'Mi Empresa',
      dashboardSubtitle: settingsObj.dashboard_subtitle || 'Monitoree sus dispositivos de red en tiempo real',
      logoUrl: settingsObj.logo_url || '',
      pingInterval: parseInt(settingsObj.ping_interval) || 5,
      theme: settingsObj.theme || 'dark',
      primaryColor: settingsObj.primary_color || '#3B82F6',
      alerts: {
        visualEnabled: settingsObj.alerts_visual_enabled === 'true',
        visualDuration: parseInt(settingsObj.alerts_visual_duration) || 5,
        visualStyle: settingsObj.alerts_visual_style || 'fade',
        audioEnabled: settingsObj.alerts_audio_enabled === 'true',
        audioStartTime: settingsObj.alerts_audio_start_time || '08:30',
        audioEndTime: settingsObj.alerts_audio_end_time || '17:30',
        audioDays: settingsObj.alerts_audio_days ? settingsObj.alerts_audio_days.split(',') : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        emailEnabled: settingsObj.alerts_email_enabled === 'true',
        emailRecipients: settingsObj.alerts_email_recipients ? settingsObj.alerts_email_recipients.split(',') : [],
        telegramEnabled: settingsObj.alerts_telegram_enabled === 'true',
        telegramRecipients: settingsObj.alerts_telegram_recipients ? settingsObj.alerts_telegram_recipients.split(',') : []
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({ error: 'Error obteniendo configuraciones' });
  }
});

// Actualizar configuraciones
router.put('/', async (req, res) => {
  try {
    const {
      appName,
      companyName,
      dashboardSubtitle,
      logoUrl,
      pingInterval,
      theme,
      primaryColor,
      alerts
    } = req.body;

    // Preparar actualizaciones
    const updates = [
      { key: 'app_name', value: appName },
      { key: 'company_name', value: companyName },
      { key: 'dashboard_subtitle', value: dashboardSubtitle },
      { key: 'logo_url', value: logoUrl || '' },
      { key: 'ping_interval', value: pingInterval?.toString() || '5' },
      { key: 'theme', value: theme || 'dark' },
      { key: 'primary_color', value: primaryColor || '#3B82F6' }
    ];

    if (alerts) {
      updates.push(
        { key: 'alerts_visual_enabled', value: alerts.visualEnabled?.toString() || 'true' },
        { key: 'alerts_visual_duration', value: alerts.visualDuration?.toString() || '5' },
        { key: 'alerts_visual_style', value: alerts.visualStyle || 'fade' },
        { key: 'alerts_audio_enabled', value: alerts.audioEnabled?.toString() || 'true' },
        { key: 'alerts_audio_start_time', value: alerts.audioStartTime || '08:30' },
        { key: 'alerts_audio_end_time', value: alerts.audioEndTime || '17:30' },
        { key: 'alerts_audio_days', value: alerts.audioDays?.join(',') || 'Monday,Tuesday,Wednesday,Thursday,Friday' },
        { key: 'alerts_email_enabled', value: alerts.emailEnabled?.toString() || 'false' },
        { key: 'alerts_email_recipients', value: alerts.emailRecipients?.join(',') || '' },
        { key: 'alerts_telegram_enabled', value: alerts.telegramEnabled?.toString() || 'false' },
        { key: 'alerts_telegram_recipients', value: alerts.telegramRecipients?.join(',') || '' }
      );
    }

    // Actualizar cada configuración
    for (const update of updates) {
      await executeQuery(`
        INSERT INTO settings (key_name, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
        value = VALUES(value), 
        updated_at = CURRENT_TIMESTAMP
      `, [update.key, update.value]);
    }

    res.json({ message: 'Configuraciones actualizadas correctamente' });
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({ error: 'Error actualizando configuraciones' });
  }
});

// Obtener configuración específica
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const settings = await executeQuery(
      'SELECT value FROM settings WHERE key_name = ?',
      [key]
    );

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    res.json({ key, value: settings[0].value });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

// Actualizar configuración específica
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    await executeQuery(`
      INSERT INTO settings (key_name, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE 
      value = VALUES(value), 
      updated_at = CURRENT_TIMESTAMP
    `, [key, value]);

    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

export default router;