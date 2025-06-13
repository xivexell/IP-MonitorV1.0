import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, FileBadge as FileBar, BarChart3, ChevronLeft, ChevronRight, Monitor, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const { settings } = useSettings();
  const [showVersionModal, setShowVersionModal] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Panel Principal' },
    { path: '/devices', icon: <Monitor size={20} />, label: 'Dispositivos' },
    { path: '/reports', icon: <FileBar size={20} />, label: 'Informes' },
    { path: '/statistics', icon: <BarChart3 size={20} />, label: 'Estadísticas' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configuración' },
  ];

  const handleVersionClick = () => {
    setShowVersionModal(true);
  };

  const closeModal = () => {
    setShowVersionModal(false);
  };

  return (
    <>
      <div 
        className={`h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!collapsed ? (
              settings.logoUrl ? (
                <div className="flex items-center">
                  <img 
                    src={settings.logoUrl} 
                    alt={settings.appName}
                    className="h-8 w-auto object-contain"
                  />
                  <span className="ml-2 text-lg font-semibold text-gray-800 dark:text-white truncate">
                    {settings.appName}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                  {settings.appName}
                </span>
              )
            ) : (
              <div className="mx-auto">
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt={settings.appName}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <Monitor size={24} className="text-gray-800 dark:text-white" />
                )}
              </div>
            )}
            
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none"
            >
              {collapsed ? (
                <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronLeft size={18} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col space-y-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!collapsed && (
              <button
                onClick={handleVersionClick}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Versión 1.0.0
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Información de Versión */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden relative">
            {/* Barra de colores superior */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-green-500 to-orange-500"></div>
            
            {/* Botón de cerrar - Posicionado inmediatamente en la esquina */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors z-10 p-1 rounded-full hover:bg-gray-700"
            >
              <X size={20} />
            </button>
            
            {/* Contenido del modal */}
            <div className="p-6 text-white">
              {/* Badge de versión */}
              <div className="mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                  <Monitor size={14} className="mr-2" />
                  Versión 1.0.0
                </span>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-green-500 pl-4">
                Acerca del Software
              </h2>

              {/* Información del desarrollador */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <Monitor size={16} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-green-400 text-sm font-medium mb-1">Desarrollado por</p>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Ing. Jaime Ballesteros S.
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Jefe Div. Infraestructura Tecnológica
                    </p>
                  </div>
                </div>
              </div>

              {/* Indicadores animados */}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;