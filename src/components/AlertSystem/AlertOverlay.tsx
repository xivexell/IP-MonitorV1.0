import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAlerts } from '../../contexts/AlertContext';
import { useSettings } from '../../contexts/SettingsContext';

const AlertOverlay: React.FC = () => {
  const { currentAlert, dismissAlert } = useAlerts();
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (currentAlert && settings.alerts.visualEnabled) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentAlert, settings.alerts.visualEnabled]);
  
  if (!isVisible) return null;
  
  const getAlertStyles = () => {
    const baseStyles = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
    const animationStyles = {
      fade: "animate-fade-in",
      slide: "animate-slide-in",
      bounce: "animate-bounce-in"
    };
    
    return `${baseStyles} ${animationStyles[settings.alerts.visualStyle]}`;
  };
  
  const getAlertBoxStyles = () => {
    const isDownAlert = currentAlert?.type === 'down';
    
    return `p-8 rounded-lg shadow-xl max-w-md w-full mx-auto text-center relative ${
      isDownAlert
        ? 'bg-red-600 text-white'
        : 'bg-green-600 text-white'
    }`;
  };
  
  return (
    <div className={getAlertStyles()}>
      <div className={getAlertBoxStyles()}>
        {/* Botón de cerrar - Posicionado inmediatamente en la esquina */}
        <button 
          onClick={dismissAlert}
          className="absolute top-2 right-2 text-white/80 hover:text-white p-1 rounded-full hover:bg-black/20 transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-2">
          {currentAlert?.type === 'down' ? 'Dispositivo Caído' : 'Dispositivo Recuperado'}
        </h2>
        
        <div className="text-lg mb-4">
          <p className="font-medium">{currentAlert?.device.alias}</p>
          <p className="text-base opacity-90">{currentAlert?.device.ip}</p>
        </div>
        
        <p className="text-sm opacity-80">
          {new Date(currentAlert?.timestamp || Date.now()).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default AlertOverlay;