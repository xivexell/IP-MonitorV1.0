import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Device, PingResult } from '../types';
import { useSettings } from './SettingsContext';
import { useAlerts } from './AlertContext';
import { devicesAPI, pingAPI } from '../services/api';

interface DeviceContextProps {
  devices: Device[];
  addDevice: (ip: string, alias: string) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  updateDevice: (id: string, ip: string, alias: string) => Promise<void>;
  updateDeviceStatus: (id: string, isActive: boolean) => void;
  pingAllDevices: () => Promise<void>;
  getDeviceById: (id: string) => Device | undefined;
  isLoading: boolean;
  error: string | null;
}

const DeviceContext = createContext<DeviceContextProps | undefined>(undefined);

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const { triggerAlert } = useAlerts();

  // Cargar dispositivos al inicializar
  useEffect(() => {
    loadDevices();
  }, []);

  // Configurar intervalo de ping automático
  useEffect(() => {
    if (settings.pingInterval > 0 && devices.length > 0) {
      const intervalId = setInterval(() => {
        pingAllDevices();
      }, settings.pingInterval * 1000);

      return () => clearInterval(intervalId);
    }
  }, [settings.pingInterval, devices.length]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const devicesData = await devicesAPI.getAll();
      setDevices(devicesData);
    } catch (err) {
      console.error('Error cargando dispositivos:', err);
      setError(err instanceof Error ? err.message : 'Error cargando dispositivos');
      
      // Fallback a localStorage si la API falla
      const savedDevices = localStorage.getItem('networkMonitor_devices');
      if (savedDevices) {
        try {
          const parsedDevices = JSON.parse(savedDevices);
          const devicesWithDates = parsedDevices.map((device: any) => ({
            ...device,
            lastStatusChange: device.lastStatusChange ? new Date(device.lastStatusChange) : null,
            history: device.history.map((ping: any) => ({
              ...ping,
              timestamp: new Date(ping.timestamp)
            }))
          }));
          setDevices(devicesWithDates);
        } catch (parseError) {
          console.error('Error parseando dispositivos guardados:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addDevice = async (ip: string, alias: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const newDevice = await devicesAPI.create({ ip, alias });
      setDevices(prev => [...prev, newDevice]);
    } catch (err) {
      console.error('Error agregando dispositivo:', err);
      setError(err instanceof Error ? err.message : 'Error agregando dispositivo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await devicesAPI.delete(id);
      setDevices(prev => prev.filter(device => device.id !== id));
    } catch (err) {
      console.error('Error eliminando dispositivo:', err);
      setError(err instanceof Error ? err.message : 'Error eliminando dispositivo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDevice = async (id: string, ip: string, alias: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedDevice = await devicesAPI.update(id, { ip, alias });
      setDevices(prev => 
        prev.map(device => 
          device.id === id ? { ...device, ...updatedDevice } : device
        )
      );
    } catch (err) {
      console.error('Error actualizando dispositivo:', err);
      setError(err instanceof Error ? err.message : 'Error actualizando dispositivo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceById = (id: string) => {
    return devices.find(device => device.id === id);
  };

  const updateDeviceStatus = (id: string, isActive: boolean) => {
    setDevices(prev => 
      prev.map(device => {
        if (device.id === id) {
          const wasActive = device.isActive;
          
          // Si el estado cambió, disparar alerta
          if (wasActive !== isActive) {
            triggerAlert({
              type: isActive ? 'recovery' : 'down',
              device: {
                id: device.id,
                ip: device.ip,
                alias: device.alias
              }
            });
          }
          
          return {
            ...device,
            isActive,
            lastStatusChange: wasActive !== isActive ? new Date() : device.lastStatusChange
          };
        }
        return device;
      })
    );
  };

  const pingAllDevices = async () => {
    if (devices.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Usar la API de ping para ejecutar ping a todos los dispositivos
      const results = await pingAPI.pingAll();
      
      // Recargar dispositivos para obtener los datos actualizados
      await loadDevices();
      
      console.log('Ping completado:', results);
    } catch (err) {
      console.error('Error ejecutando ping:', err);
      setError(err instanceof Error ? err.message : 'Error ejecutando ping');
      
      // Fallback: ejecutar ping local si la API falla
      await pingAllDevicesLocal();
    } finally {
      setIsLoading(false);
    }
  };

  // Función de fallback para ping local (mantener compatibilidad)
  const pingAllDevicesLocal = async () => {
    const updatedDevices = await Promise.all(
      devices.map(async device => {
        const pingResult = await mockPing(device.ip);
        const now = new Date();
        
        const newHistory: PingResult = {
          timestamp: now,
          latency: pingResult.latency,
          success: pingResult.success
        };
        
        const updatedHistory = [...device.history, newHistory].slice(-100);
        
        const newTotalPings = device.totalPings + 1;
        const newFailedPings = pingResult.success ? device.failedPings : device.failedPings + 1;
        
        let newMinLatency = device.minLatency;
        let newMaxLatency = device.maxLatency;
        let newAvgLatency = device.avgLatency;
        
        if (pingResult.success && pingResult.latency !== null) {
          newMinLatency = Math.min(device.minLatency === Infinity ? pingResult.latency : device.minLatency, pingResult.latency);
          newMaxLatency = Math.max(device.maxLatency, pingResult.latency);
          
          const totalSuccessfulPings = newTotalPings - newFailedPings;
          newAvgLatency = ((device.avgLatency * (totalSuccessfulPings - 1)) + pingResult.latency) / totalSuccessfulPings;
        }
        
        const newAvailability = ((newTotalPings - newFailedPings) / newTotalPings) * 100;
        
        const wasActive = device.isActive;
        const isNowActive = pingResult.success;
        
        let newTotalDowns = device.totalDowns;
        if (wasActive && !isNowActive) {
          newTotalDowns += 1;
        }
        
        let newUptime = device.uptime;
        let newDowntime = device.downtime;
        
        if (device.lastStatusChange) {
          const elapsedSeconds = (now.getTime() - device.lastStatusChange.getTime()) / 1000;
          if (wasActive) {
            newUptime += elapsedSeconds;
          } else {
            newDowntime += elapsedSeconds;
          }
        }
        
        if (wasActive !== isNowActive) {
          triggerAlert({
            type: isNowActive ? 'recovery' : 'down',
            device: {
              id: device.id,
              ip: device.ip,
              alias: device.alias
            }
          });
        }
        
        return {
          ...device,
          isActive: isNowActive,
          latestPing: pingResult.latency,
          avgLatency: newAvgLatency,
          minLatency: newMinLatency === Infinity ? 0 : newMinLatency,
          maxLatency: newMaxLatency,
          availability: newAvailability,
          totalDowns: newTotalDowns,
          failedPings: newFailedPings,
          totalPings: newTotalPings,
          lastStatusChange: wasActive !== isNowActive ? now : device.lastStatusChange,
          downtime: newDowntime,
          uptime: newUptime,
          history: updatedHistory
        };
      })
    );
    
    setDevices(updatedDevices);
  };

  // Mock ping function (fallback)
  const mockPing = async (ip: string): Promise<{ success: boolean; latency: number | null }> => {
    const random = Math.random();
    const success = random > 0.1;
    
    if (success) {
      const latency = Math.floor(10 + Math.random() * 190);
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success, latency };
    } else {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success, latency: null };
    }
  };

  return (
    <DeviceContext.Provider value={{
      devices,
      addDevice,
      removeDevice,
      updateDevice,
      updateDeviceStatus,
      pingAllDevices,
      getDeviceById,
      isLoading,
      error
    }}>
      {children}
    </DeviceContext.Provider>
  );
};