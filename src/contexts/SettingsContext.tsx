import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, AlertSettings, ThemeMode } from '../types';

interface SettingsContextProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateAlertSettings: (newAlertSettings: Partial<AlertSettings>) => void;
  toggleTheme: () => void;
  updateLogo: (file: File) => void;
}

const defaultAlertSettings: AlertSettings = {
  visualEnabled: true,
  visualDuration: 5,
  visualStyle: 'fade',
  
  audioEnabled: true,
  audioStartTime: '08:30',
  audioEndTime: '17:30',
  audioDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  
  emailEnabled: false,
  emailRecipients: [],
  
  telegramEnabled: false,
  telegramRecipients: []
};

const defaultSettings: AppSettings = {
  appName: 'Monitor de Red',
  companyName: 'Mi Empresa',
  dashboardSubtitle: 'Monitoree sus dispositivos de red en tiempo real',
  logoUrl: '',
  logoFile: null,
  pingInterval: 5,
  theme: 'dark',
  primaryColor: '#3B82F6',
  alerts: defaultAlertSettings
};

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe ser usado dentro de un SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem('networkMonitor_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure companyName and dashboardSubtitle exist for backward compatibility
        if (!parsedSettings.companyName) {
          parsedSettings.companyName = 'Mi Empresa';
        }
        if (!parsedSettings.dashboardSubtitle) {
          parsedSettings.dashboardSubtitle = 'Monitoree sus dispositivos de red en tiempo real';
        }
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error al cargar la configuración:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('networkMonitor_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const updateAlertSettings = (newAlertSettings: Partial<AlertSettings>) => {
    setSettings(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        ...newAlertSettings
      }
    }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const updateLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSettings(prev => ({
          ...prev,
          logoUrl: e.target.result as string,
          logoFile: file
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      updateAlertSettings,
      toggleTheme,
      updateLogo
    }}>
      {children}
    </SettingsContext.Provider>
  );
};