import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Device, PingResult } from '../types';
import { useSettings } from './SettingsContext';
import { useAlerts } from './AlertContext';

interface DeviceContextProps {
  devices: Device[];
  addDevice: (ip: string, alias: string) => void;
  removeDevice: (id: string) => void;
  updateDevice: (id: string, ip: string, alias: string) => void;
  updateDeviceStatus: (id: string, isActive: boolean) => void;
  pingAllDevices: () => void;
  getDeviceById: (id: string) => Device | undefined;
  isLoading: boolean;
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

// Mock ping function since we can't do real pings from browser
const mockPing = async (ip: string): Promise<{ success: boolean; latency: number | null }> => {
  // Simulate network conditions with varying success rates and latencies
  const random = Math.random();
  const success = random > 0.1; // 90% success rate
  
  if (success) {
    // Simulate varying latency between 10ms and 200ms
    const latency = Math.floor(10 + Math.random() * 190);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call delay
    return { success, latency };
  } else {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call delay
    return { success, latency: null };
  }
};

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();
  const { triggerAlert } = useAlerts();
  
  // Load devices from localStorage on initial render
  useEffect(() => {
    const savedDevices = localStorage.getItem('networkMonitor_devices');
    if (savedDevices) {
      try {
        const parsedDevices = JSON.parse(savedDevices);
        // Convert string dates back to Date objects
        const devicesWithDates = parsedDevices.map((device: any) => ({
          ...device,
          lastStatusChange: device.lastStatusChange ? new Date(device.lastStatusChange) : null,
          history: device.history.map((ping: any) => ({
            ...ping,
            timestamp: new Date(ping.timestamp)
          }))
        }));
        setDevices(devicesWithDates);
      } catch (error) {
        console.error('Failed to parse saved devices:', error);
      }
    }
  }, []);

  // Save devices to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('networkMonitor_devices', JSON.stringify(devices));
  }, [devices]);

  // Set up ping interval
  useEffect(() => {
    if (settings.pingInterval > 0 && devices.length > 0) {
      const intervalId = setInterval(() => {
        pingAllDevices();
      }, settings.pingInterval * 1000);

      return () => clearInterval(intervalId);
    }
  }, [settings.pingInterval, devices.length]);

  const addDevice = (ip: string, alias: string) => {
    const newDevice: Device = {
      id: uuidv4(),
      ip,
      alias,
      isActive: false,
      latestPing: null,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      availability: 100,
      totalDowns: 0,
      failedPings: 0,
      totalPings: 0,
      lastStatusChange: null,
      downtime: 0,
      uptime: 0,
      history: []
    };

    setDevices(prev => [...prev, newDevice]);
  };

  const removeDevice = (id: string) => {
    setDevices(prev => prev.filter(device => device.id !== id));
  };

  const updateDevice = (id: string, ip: string, alias: string) => {
    setDevices(prev => 
      prev.map(device => 
        device.id === id 
          ? { ...device, ip, alias }
          : device
      )
    );
  };

  const getDeviceById = (id: string) => {
    return devices.find(device => device.id === id);
  };

  const updateDeviceStatus = (id: string, isActive: boolean) => {
    setDevices(prev => 
      prev.map(device => {
        if (device.id === id) {
          const wasActive = device.isActive;
          
          // If status changed, trigger alert
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
    setIsLoading(true);
    
    const updatedDevices = await Promise.all(
      devices.map(async device => {
        const pingResult = await mockPing(device.ip);
        const now = new Date();
        
        const newHistory: PingResult = {
          timestamp: now,
          latency: pingResult.latency,
          success: pingResult.success
        };
        
        // Keep only the last 100 ping results in history
        const updatedHistory = [...device.history, newHistory].slice(-100);
        
        const newTotalPings = device.totalPings + 1;
        const newFailedPings = pingResult.success ? device.failedPings : device.failedPings + 1;
        
        // Calculate new min, max, and avg latency
        let newMinLatency = device.minLatency;
        let newMaxLatency = device.maxLatency;
        let newAvgLatency = device.avgLatency;
        
        if (pingResult.success && pingResult.latency !== null) {
          newMinLatency = Math.min(device.minLatency === Infinity ? pingResult.latency : device.minLatency, pingResult.latency);
          newMaxLatency = Math.max(device.maxLatency, pingResult.latency);
          
          // Recalculate average with the new ping
          const totalSuccessfulPings = newTotalPings - newFailedPings;
          newAvgLatency = ((device.avgLatency * (totalSuccessfulPings - 1)) + pingResult.latency) / totalSuccessfulPings;
        }
        
        // Calculate availability percentage
        const newAvailability = ((newTotalPings - newFailedPings) / newTotalPings) * 100;
        
        // Update device status
        const wasActive = device.isActive;
        const isNowActive = pingResult.success;
        
        let newTotalDowns = device.totalDowns;
        if (wasActive && !isNowActive) {
          newTotalDowns += 1;
        }
        
        // Update uptime/downtime counters
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
        
        // If status changed, trigger alert
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
    setIsLoading(false);
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
      isLoading
    }}>
      {children}
    </DeviceContext.Provider>
  );
};