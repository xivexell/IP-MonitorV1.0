import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AlertOverlay from '../AlertSystem/AlertOverlay';

const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Solo mostrar alertas visuales en el panel principal (dashboard)
  const showAlerts = location.pathname === '/';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header />
        
        <main className="pt-16 px-6 py-6 h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {showAlerts && <AlertOverlay />}
    </div>
  );
};

export default MainLayout;