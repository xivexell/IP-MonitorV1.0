import React, { useState } from 'react';
import { useDevices } from '../contexts/DeviceContext';
import { Search, PlusCircle, RefreshCw } from 'lucide-react';
import DeviceCard from '../components/Dashboard/DeviceCard';
import { Link } from 'react-router-dom';

const DevicesPage: React.FC = () => {
  const { devices, pingAllDevices, isLoading } = useDevices();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'down'>('all');
  
  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ip.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && device.isActive) ||
      (filterStatus === 'down' && !device.isActive);
    
    return matchesSearch && matchesStatus;
  });
  
  const handleRefresh = () => {
    pingAllDevices();
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Dispositivos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestione y monitoree sus dispositivos de red
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ${
              isLoading ? 'animate-spin' : ''
            }`}
            disabled={isLoading}
          >
            <RefreshCw size={18} />
          </button>
          
          <Link
            to="/devices/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle size={16} className="mr-2" />
            Agregar Dispositivo
          </Link>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar dispositivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'down')}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="active">En línea</option>
            <option value="down">Desconectados</option>
          </select>
        </div>
      </div>
      
      {filteredDevices.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'No hay dispositivos que coincidan con los filtros'
              : 'No se han agregado dispositivos aún'}
          </p>
          
          {!searchQuery && filterStatus === 'all' && (
            <Link
              to="/devices/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle size={16} className="mr-2" />
              Agregar Dispositivo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DevicesPage;