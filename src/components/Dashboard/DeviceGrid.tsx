import React from 'react';
import DeviceCard from './DeviceCard';
import { useDevices } from '../../contexts/DeviceContext';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeviceGrid: React.FC = () => {
  const { devices } = useDevices();
  const navigate = useNavigate();
  
  const goToAddDevice = () => {
    navigate('/devices/add');
  };
  
  const sortedDevices = [...devices].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? 1 : -1;
    }
    return a.alias.localeCompare(b.alias);
  });
  
  return (
    <div>
      {devices.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No hay dispositivos monitoreados</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Agregue su primer dispositivo para comenzar el monitoreo.
            </p>
            <button
              onClick={goToAddDevice}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle size={16} className="mr-2" />
              Agregar dispositivo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedDevices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))}
          
          <div 
            onClick={goToAddDevice}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 border-dashed h-full flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <PlusCircle size={32} className="text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-center">Agregar nuevo dispositivo</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceGrid;