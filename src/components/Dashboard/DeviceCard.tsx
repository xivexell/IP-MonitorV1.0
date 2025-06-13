import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Signal, AlertTriangle, Activity, ChevronRight } from 'lucide-react';
import { Device } from '../../types';
import { formatDuration } from '../../lib/utils';

interface DeviceCardProps {
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const totalTime = device.uptime + device.downtime;
  const uptimePercentage = totalTime > 0 ? (device.uptime / totalTime) * 100 : 100;
  
  const getStatusDetails = () => {
    if (device.isActive) {
      return {
        text: 'En línea',
        bgColor: 'bg-green-500',
        textColor: 'text-green-600 dark:text-green-400',
        latencyText: `${Math.round(device.latestPing || 0)} ms`,
      };
    } else {
      return {
        text: 'Desconectado',
        bgColor: 'bg-red-500',
        textColor: 'text-red-600 dark:text-red-400',
        latencyText: 'N/A',
      };
    }
  };
  
  const statusDetails = getStatusDetails();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
      <div className={`h-1.5 w-full ${statusDetails.bgColor}`} />
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{device.alias}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{device.ip}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDetails.textColor} bg-opacity-10 dark:bg-opacity-20`}>
            {statusDetails.text}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center">
            <Signal size={16} className="text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Latencia</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{statusDetails.latencyText}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Activity size={16} className="text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Disponibilidad</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{device.availability.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Caídas</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{device.totalDowns}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock size={16} className="text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tiempo activo</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDuration(device.uptime)}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Tiempo activo</span>
            <span className="text-gray-700 dark:text-gray-300">{uptimePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${uptimePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <Link
          to={`/devices/${device.id}`}
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
        >
          Ver detalles <ChevronRight size={14} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default DeviceCard;