import React from 'react';
import StatsSummary from '../components/Dashboard/StatsSummary';
import DeviceGrid from '../components/Dashboard/DeviceGrid';
import StatusChart from '../components/Dashboard/StatusChart';
import { useSettings } from '../contexts/SettingsContext';

const Dashboard: React.FC = () => {
  const { settings } = useSettings();
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          {settings.logoUrl && (
            <div className="mr-4">
              <img 
                src={settings.logoUrl} 
                alt={settings.companyName}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {settings.appName}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
              {settings.companyName}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {settings.dashboardSubtitle}
            </p>
          </div>
        </div>
      </div>

      <StatsSummary />
      
      <div className="mb-6">
        <StatusChart />
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Dispositivos</h2>
        <DeviceGrid />
      </div>
    </div>
  );
};

export default Dashboard;