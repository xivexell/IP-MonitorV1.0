import React, { useEffect, useState } from 'react';
import { useDevices } from '../contexts/DeviceContext';
import { Device } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatisticsPage: React.FC = () => {
  const { devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  
  const [latencyData, setLatencyData] = useState<any>(null);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [outageDistributionData, setOutageDistributionData] = useState<any>(null);
  
  useEffect(() => {
    if (devices.length === 0) return;
    
    prepareLatencyData();
    prepareAvailabilityData();
    prepareOutageDistributionData();
  }, [devices, selectedDevice]);
  
  const prepareLatencyData = () => {
    let filteredDevices = devices;
    
    if (selectedDevice !== 'all') {
      filteredDevices = devices.filter(d => d.id === selectedDevice);
    }
    
    if (selectedDevice === 'all' && filteredDevices.length > 5) {
      filteredDevices = [...filteredDevices]
        .sort((a, b) => a.avgLatency - b.avgLatency)
        .slice(0, 5);
    }
    
    const datasets = filteredDevices.map((device, index) => {
      const colors = [
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(249, 115, 22, 0.7)',
      ];
      
      const color = colors[index % colors.length];
      
      return {
        label: device.alias,
        data: [
          device.minLatency,
          device.avgLatency,
          device.maxLatency
        ],
        backgroundColor: color,
        borderColor: color.replace('0.7', '1'),
        borderWidth: 1
      };
    });
    
    setLatencyData({
      labels: ['Latencia Mínima', 'Latencia Promedio', 'Latencia Máxima'],
      datasets
    });
  };
  
  const prepareAvailabilityData = () => {
    let filteredDevices = devices;
    
    if (selectedDevice !== 'all') {
      filteredDevices = devices.filter(d => d.id === selectedDevice);
    }
    
    const datasets = filteredDevices.map((device, index) => {
      const colors = [
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(249, 115, 22, 0.7)',
      ];
      
      const color = colors[index % colors.length];
      
      const successRate = device.availability;
      const failureRate = 100 - successRate;
      
      return {
        label: device.alias,
        data: [successRate, failureRate],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      };
    });
    
    if (selectedDevice !== 'all') {
      setAvailabilityData({
        labels: ['Disponible', 'No Disponible'],
        datasets
      });
    } else {
      setAvailabilityData({
        labels: filteredDevices.map(d => d.alias),
        datasets: [
          {
            label: 'Disponibilidad %',
            data: filteredDevices.map(d => d.availability),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
          },
          {
            label: 'No Disponibilidad %',
            data: filteredDevices.map(d => 100 - d.availability),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }
        ]
      });
    }
  };
  
  const prepareOutageDistributionData = () => {
    let filteredDevices = devices;
    
    if (selectedDevice !== 'all') {
      filteredDevices = devices.filter(d => d.id === selectedDevice);
    }
    
    setOutageDistributionData({
      labels: filteredDevices.map(d => d.alias),
      datasets: [
        {
          label: 'Número de Caídas',
          data: filteredDevices.map(d => d.totalDowns),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }
      ]
    });
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(160, 174, 192, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Estadísticas
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Estadísticas detalladas y tendencias de monitoreo
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center">
          <label htmlFor="deviceSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
            Seleccionar Dispositivo:
          </label>
          <select
            id="deviceSelect"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Dispositivos</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.alias} ({device.ip})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {devices.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No hay dispositivos para mostrar estadísticas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estadísticas de Latencia</h2>
            <div className="h-64">
              {latencyData ? (
                <Bar data={latencyData} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estadísticas de Disponibilidad</h2>
            <div className="h-64">
              {availabilityData ? (
                selectedDevice !== 'all' ? (
                  <Pie data={availabilityData} options={pieOptions} />
                ) : (
                  <Bar data={availabilityData} options={barOptions} />
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribución de Caídas</h2>
            <div className="h-64">
              {outageDistributionData ? (
                <Bar data={outageDistributionData} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;