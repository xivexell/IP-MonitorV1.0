import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDevices } from '../contexts/DeviceContext';
import { ArrowLeft, Trash2, RefreshCw, Signal, Clock, AlertTriangle, Activity, Edit } from 'lucide-react';
import { formatDuration } from '../lib/utils';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

const DeviceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { devices, removeDevice, pingAllDevices } = useDevices();
  const navigate = useNavigate();
  
  const device = devices.find(d => d.id === id);
  
  if (!device) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Dispositivo no encontrado</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          El dispositivo que busca no existe o ha sido eliminado.
        </p>
        <Link
          to="/devices"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a Dispositivos
        </Link>
      </div>
    );
  }
  
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
  
  const historyData = {
    labels: device.history.map(ping => format(new Date(ping.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Latencia',
        data: device.history.map(ping => ping.success ? ping.latency : null),
        fill: false,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Latencia (ms)'
        },
        grid: {
          color: 'rgba(160, 174, 192, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return value === null ? 'Desconectado' : `${value} ms`;
          }
        }
      }
    }
  };
  
  const handleDelete = () => {
    if (confirm('¿Está seguro de que desea eliminar este dispositivo del monitoreo?')) {
      removeDevice(device.id);
      navigate('/devices');
    }
  };
  
  const handleRefresh = () => {
    pingAllDevices();
  };
  
  const handleEdit = () => {
    navigate(`/devices/${device.id}/edit`);
  };
  
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> Volver
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mr-3">
                {device.alias}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.textColor} bg-opacity-10 dark:bg-opacity-20`}>
                {statusDetails.text}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              IP: {device.ip}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw size={18} />
            </button>
            
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              <Edit size={16} className="mr-1.5" />
              Editar
            </button>
            
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 size={16} className="mr-1.5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 mr-3">
              <Signal size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latencia</p>
              <div className="flex items-baseline">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {statusDetails.latencyText}
                </p>
                {device.isActive && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    mín: {device.minLatency}ms / máx: {device.maxLatency}ms
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 mr-3">
              <Activity size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disponibilidad</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {device.availability.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 mr-3">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tiempo Activo</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(device.uptime)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 mr-3">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Caídas</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {device.totalDowns}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Historial de Latencia</h2>
        <div className="h-64">
          <Line data={historyData} options={chartOptions} />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estadísticas Detalladas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <table className="min-w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Total de Pings</td>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">{device.totalPings}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Pings Fallidos</td>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">{device.failedPings}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Tasa de Éxito</td>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {((device.totalPings - device.failedPings) / (device.totalPings || 1) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <table className="min-w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Latencia Promedio</td>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {Math.round(device.avgLatency)} ms
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Latencia Mínima</td>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {device.minLatency} ms
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Latencia Máxima</td>
                  <td className="py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {device.maxLatency} ms
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsPage;