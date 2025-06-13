import React from 'react';
import { useDevices } from '../../contexts/DeviceContext';
import { 
  Server, 
  AlertCircle, 
  BarChart, 
  Clock, 
  CheckCircle,
  XCircle
} from 'lucide-react';

const StatsSummary: React.FC = () => {
  const { devices } = useDevices();
  
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.isActive).length;
  const offlineDevices = totalDevices - onlineDevices;
  
  const avgAvailability = devices.length > 0
    ? devices.reduce((sum, device) => sum + device.availability, 0) / devices.length
    : 0;
  
  const onlineDevicesWithLatency = devices.filter(d => d.isActive && d.latestPing !== null);
  const avgLatency = onlineDevicesWithLatency.length > 0
    ? onlineDevicesWithLatency.reduce((sum, device) => sum + (device.latestPing || 0), 0) / onlineDevicesWithLatency.length
    : 0;
  
  const totalOutages = devices.reduce((sum, device) => sum + device.totalDowns, 0);
  
  const stats = [
    {
      id: 'total-devices',
      label: 'Total Dispositivos',
      value: totalDevices,
      icon: <Server size={20} className="text-blue-500" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'online-devices',
      label: 'En línea',
      value: onlineDevices,
      icon: <CheckCircle size={20} className="text-green-500" />,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'offline-devices',
      label: 'Desconectados',
      value: offlineDevices,
      icon: <XCircle size={20} className="text-red-500" />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      id: 'avg-availability',
      label: 'Disponibilidad Promedio',
      value: `${avgAvailability.toFixed(1)}%`,
      icon: <BarChart size={20} className="text-purple-500" />,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'avg-latency',
      label: 'Latencia Promedio',
      value: `${Math.round(avgLatency)} ms`,
      icon: <Clock size={20} className="text-amber-500" />,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      id: 'total-outages',
      label: 'Total Caídas',
      value: totalOutages,
      icon: <AlertCircle size={20} className="text-rose-500" />,
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-600 dark:text-rose-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {stats.map(stat => (
        <div
          key={stat.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.bgColor} mr-3`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={`text-xl font-semibold ${stat.textColor}`}>{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSummary;