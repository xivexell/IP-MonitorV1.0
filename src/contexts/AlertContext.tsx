import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';
import { useSettings } from './SettingsContext';
import alertSound from '/alert.mp3?url';

interface DeviceInfo {
  id: string;
  ip: string;
  alias: string;
}

interface Alert {
  id: string;
  type: 'down' | 'recovery';
  device: DeviceInfo;
  timestamp: Date;
}

interface AlertContextProps {
  alerts: Alert[];
  currentAlert: Alert | null;
  triggerAlert: (alertData: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const { settings } = useSettings();
  
  // Audio alert sound
  const [audio] = useState<HTMLAudioElement | null>(
    typeof window !== 'undefined' ? new Audio(alertSound) : null
  );

  const triggerAlert = (alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Keep only last 100 alerts
    setCurrentAlert(newAlert);
    
    // Play sound if applicable
    if (settings.alerts.audioEnabled && audio) {
      const now = new Date();
      const currentDay = format(now, 'EEEE');
      const currentTime = format(now, 'HH:mm');
      
      // Check if current day is in allowed days
      if (settings.alerts.audioDays.includes(currentDay)) {
        // Check if current time is within allowed time range
        if (currentTime >= settings.alerts.audioStartTime && currentTime <= settings.alerts.audioEndTime) {
          audio.play().catch(err => console.error('Failed to play alert sound:', err));
        } else {
          // Outside business hours, send email/telegram if enabled
          if (settings.alerts.emailEnabled && settings.alerts.emailRecipients.length > 0) {
            sendEmailAlert(newAlert);
          }
          
          if (settings.alerts.telegramEnabled && settings.alerts.telegramRecipients.length > 0) {
            sendTelegramAlert(newAlert);
          }
        }
      }
    }
    
    // Auto-dismiss after configured duration
    if (settings.alerts.visualEnabled && settings.alerts.visualDuration > 0) {
      setTimeout(() => {
        dismissAlert();
      }, settings.alerts.visualDuration * 1000);
    }
  };

  const dismissAlert = () => {
    setCurrentAlert(null);
  };

  // Mock email alert function (would integrate with a real service in production)
  const sendEmailAlert = (alert: Alert) => {
    console.log('Sending email alert:', alert);
    // In a real implementation, this would call an API to send the email
  };

  // Mock telegram alert function (would integrate with Telegram API in production)
  const sendTelegramAlert = (alert: Alert) => {
    console.log('Sending Telegram alert:', alert);
    // In a real implementation, this would call an API to send the Telegram message
  };

  return (
    <AlertContext.Provider value={{
      alerts,
      currentAlert,
      triggerAlert,
      dismissAlert
    }}>
      {children}
    </AlertContext.Provider>
  );
};