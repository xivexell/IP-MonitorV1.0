import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useDevices } from '../../contexts/DeviceContext';
import { Device } from '../../types';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MAX_DATA_POINTS = 20;

const StatusChart: React.FC = () => {
  const { devices } = useDevices();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  
  const prepareChartData = () => {
    if (devices.length === 0) return;
    
    const deviceData = devices.map(device => {
      const history = device.history.slice(-MAX_DATA_POINTS);
      return {
        id: device.id,
        name: device.alias,
        history
      };
    });
    
    const mostRecentDevice = deviceData.sort((a, b) => 
      b.history.length - a.history.length
    )[0];
    
    if (!mostRecentDevice || mostRecentDevice.history.length === 0) {
      return;
    }
    
    const labels = mostRecentDevice.history.map(ping => 
      format(new Date(ping.timestamp), 'HH:mm:ss')
    );
    
    const datasets = deviceData.map((device, index) => {
      const colors = [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(239, 68, 68)',
        'rgb(168, 85, 247)',
        'rgb(249, 115, 22)',
        'rgb(236, 72, 153)'
      ];
      
      const color = colors[index % colors.length];
      
      return {
        label: device.name,
        data: device.history.map(ping => ping.success ? ping.latency : null),
        fill: false,
        borderColor: color,
        backgroundColor: color,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });
    
    setChartData({
      labels,
      datasets
    });
  };
  
  useEffect(() => {
    prepareChartData();
  }, [devices]);
  
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
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return value === null ? `${label}: Desconectado` : `${label}: ${value} ms`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  if (devices.length === 0 || !chartData.labels.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm h-64 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monitoreo de Latencia</h3>
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default StatusChart;