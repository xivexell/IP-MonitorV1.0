import React from 'react';
import { Sun, Moon, Bell } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAlerts } from '../../contexts/AlertContext';

const Header: React.FC = () => {
  const { settings, toggleTheme } = useSettings();
  const { alerts } = useAlerts();
  
  const recentAlerts = alerts.slice(0, 5);
  
  return (
    <header className="h-16 fixed top-0 right-0 left-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center px-4">
      <div className="flex items-center">
        {settings.logoUrl && (
          <img 
            src={settings.logoUrl} 
            alt={settings.companyName}
            className="h-8 w-auto object-contain mr-3"
          />
        )}
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {settings.appName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {settings.companyName}
          </span>
        </div>
      </div>
      
      <div className="ml-auto flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          aria-label="Cambiar tema"
        >
          {settings.theme === 'dark' ? (
            <Sun size={20} className="text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon size={20} className="text-gray-600 dark:text-gray-300" />
          )}
        </button>
        
        <div className="relative">
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 relative"
            aria-label="Notificaciones"
          >
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            {alerts.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>
          
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700 hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Alertas Recientes</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No hay alertas recientes</p>
              ) : (
                recentAlerts.map(alert => (
                  <div key={alert.id} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        alert.type === 'down' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {alert.device.alias} ({alert.device.ip})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.type === 'down' ? 'Dispositivo caído' : 'Dispositivo recuperado'} • {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center">
                Ver todas las alertas
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;