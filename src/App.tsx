import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { DeviceProvider } from './contexts/DeviceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AlertProvider } from './contexts/AlertContext';

// Layout
import MainLayout from './components/Layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import DevicesPage from './pages/DevicesPage';
import DeviceDetailsPage from './pages/DeviceDetailsPage';
import AddDevicePage from './pages/AddDevicePage';
import EditDevicePage from './pages/EditDevicePage';
import ReportsPage from './pages/ReportsPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <SettingsProvider>
      <AlertProvider>
        <DeviceProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="devices" element={<DevicesPage />} />
                <Route path="devices/add" element={<AddDevicePage />} />
                <Route path="devices/:id" element={<DeviceDetailsPage />} />
                <Route path="devices/:id/edit" element={<EditDevicePage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Router>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </DeviceProvider>
      </AlertProvider>
    </SettingsProvider>
  );
}

export default App;