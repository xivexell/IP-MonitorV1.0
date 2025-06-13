import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, AlertSettings, ThemeMode } from '../types';
import { settingsAPI } from '../services/api';

interface SettingsContextProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateAlertSettings: (newAlertSettings: Partial<AlertSettings>) => Promise<void>;
  toggleTheme: () => void;
  updateLogo: (file: File) => void;
  isLoading: boolean;
  error: string | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settingsData = await settingsAPI.getAll();
      setSettings(settingsData);
    } catch (err) {
      console.error('Error cargando configuraciones:', err);
      setError(err instanceof Error ? err.message : 'Error cargando configuraciones');
      
      // Fallback a localStorage si la API falla
      const savedSettings = localStorage.getItem('networkMonitor_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          if (!parsedSettings.companyName) {
            parsedSettings.companyName = 'Mi Empresa';
          }
          if (!parsedSettings.dashboardSubtitle) {
            parsedSettings.dashboardSubtitle = 'Monitoree sus dispositivos de red en tiempo real';
          }
          setSettings(parsedSettings);
        } catch (parseError) {
          console.error('Error parseando configuraciones guardadas:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedSettings = { ...settings, ...newSettings };
      await settingsAPI.update(updatedSettings);
      setSettings(updatedSettings);
      
      // También guardar en localStorage como backup
      localStorage.setItem('networkMonitor_settings', JSON.stringify(updatedSettings));
    } catch (err) {
      console.error('Error actualizando configuraciones:', err);
      setError(err instanceof Error ? err.message : 'Error actualizando configuraciones');
      
      // Fallback: actualizar solo localmente
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('networkMonitor_settings', JSON.stringify(updatedSettings));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlertSettings = async (newAlertSettings: Partial<AlertSettings>) => {
    const updatedSettings = {
      ...settings,
      alerts: {
        ...settings.alerts,
        ...newAlertSettings
      }
    };
    
    await updateSettings(updatedSettings);
  };

  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await updateSettings({ theme: newTheme });
  };

  const updateLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        try {
          await updateSettings({
            logoUrl: e.target.result as string,
            logoFile: file
          });
        } catch (err) {
          console.error('Error actualizando logo:', err);
        }
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
      updateLogo,
      isLoading,
      error
    }}>
      {children}
    </SettingsContext.Provider>
  );
};