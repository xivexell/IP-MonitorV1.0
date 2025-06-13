import React, { useState } from 'react';
import { useDevices } from '../contexts/DeviceContext';
import { ReportFilters } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { formatDuration } from '../lib/utils';
import { FileDown, FileSpreadsheet, File as FilePdf } from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportsPage: React.FC = () => {
  const { devices } = useDevices();
  const { settings } = useSettings();
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: null,
    endDate: null,
    deviceIds: [],
    status: 'all'
  });
  
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'startDate' || name === 'endDate') {
      setFilters(prev => ({
        ...prev,
        [name]: value ? new Date(value) : null
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleDeviceSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFilters(prev => ({
      ...prev,
      deviceIds: selectedOptions
    }));
  };
  
  const getFilteredDevices = () => {
    return devices.filter(device => {
      if (filters.deviceIds.length > 0 && !filters.deviceIds.includes(device.id)) {
        return false;
      }
      
      if (filters.status === 'active' && !device.isActive) {
        return false;
      }
      if (filters.status === 'down' && device.isActive) {
        return false;
      }
      
      return true;
    });
  };
  
  const filteredDevices = getFilteredDevices();
  
  const generateAvailabilityChart = (doc: jsPDF, startY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const chartWidth = pageWidth - 60; // Márgenes simétricos de 30 a cada lado
    const chartHeight = Math.max(80, filteredDevices.length * 12);
    const chartX = 30; // Margen izquierdo
    const chartY = startY;
    
    // Título del gráfico
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Porcentaje de Servicios de Conectividad', chartX, chartY - 10);
    
    // Rango de fechas con horas
    let dateRangeText = 'Todo el tiempo';
    if (filters.startDate && filters.endDate) {
      const startDateTime = `${filters.startDate.toLocaleDateString('es-ES')} ${startTime}`;
      const endDateTime = `${filters.endDate.toLocaleDateString('es-ES')} ${endTime}`;
      dateRangeText = `Del ${startDateTime} al ${endDateTime}`;
    } else if (filters.startDate) {
      dateRangeText = `Desde ${filters.startDate.toLocaleDateString('es-ES')} ${startTime}`;
    } else if (filters.endDate) {
      dateRangeText = `Hasta ${filters.endDate.toLocaleDateString('es-ES')} ${endTime}`;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(dateRangeText, chartX, chartY - 3);
    
    // Marco del gráfico
    doc.setDrawColor(200, 200, 200);
    doc.rect(chartX, chartY, chartWidth, chartHeight);
    
    // Etiquetas de los ejes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Etiqueta del eje Y (rotada)
    doc.text('Servicios de Conectividad', chartX - 15, chartY + chartHeight / 2, { angle: 90 });
    
    // Etiqueta del eje X
    doc.text('Total periodo definido del reporte (%)', chartX + chartWidth / 2 - 30, chartY + chartHeight + 15);
    
    // Líneas de la cuadrícula y etiquetas del eje X
    doc.setDrawColor(230, 230, 230);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    for (let i = 0; i <= 10; i++) {
      const x = chartX + (chartWidth * i / 10);
      const percentage = i * 10;
      
      // Línea vertical de la cuadrícula
      if (i > 0) {
        doc.line(x, chartY, x, chartY + chartHeight);
      }
      
      // Etiqueta del porcentaje
      doc.text(`${percentage}%`, x - 5, chartY + chartHeight + 8);
    }
    
    // Dibujar las barras
    const barHeight = Math.max(8, (chartHeight - 20) / filteredDevices.length);
    const barSpacing = 2;
    
    filteredDevices.forEach((device, index) => {
      const barY = chartY + 10 + (index * (barHeight + barSpacing));
      const barWidth = (device.availability / 100) * (chartWidth - 20);
      
      // Barra de disponibilidad
      doc.setFillColor(173, 216, 230); // Celeste claro
      doc.setDrawColor(135, 206, 235); // Borde azul pastel
      doc.rect(chartX + 10, barY, barWidth, barHeight, 'FD');
      
      // Etiqueta del dispositivo
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const deviceLabel = `${device.alias} (${device.ip})`;
      const maxLabelWidth = chartWidth - 25;
      
      // Truncar la etiqueta si es muy larga
      let truncatedLabel = deviceLabel;
      if (doc.getTextWidth(truncatedLabel) > maxLabelWidth) {
        while (doc.getTextWidth(truncatedLabel + '...') > maxLabelWidth && truncatedLabel.length > 10) {
          truncatedLabel = truncatedLabel.slice(0, -1);
        }
        truncatedLabel += '...';
      }
      
      doc.text(truncatedLabel, chartX + 12, barY + barHeight / 2 + 1);
      
      // Porcentaje al final de la barra
      const percentageText = `${device.availability.toFixed(1)}%`;
      doc.setFont('helvetica', 'bold');
      doc.text(percentageText, chartX + 15 + barWidth, barY + barHeight / 2 + 1);
    });
    
    return chartY + chartHeight + 25;
  };
  
  const generatePdfReport = () => {
    const doc = new jsPDF('landscape'); // Orientación horizontal
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Cabecera mejorada
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.appName, 20, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de Monitoreo de Red', 20, 22);
    
    doc.setFontSize(10);
    doc.text(`${settings.dashboardSubtitle} - ${settings.companyName}`, 20, 29);
    
    // Rango de fechas con horas incluidas
    let dateText = 'Todo el tiempo';
    if (filters.startDate && filters.endDate) {
      const startDateTime = `${filters.startDate.toLocaleDateString('es-ES')} ${startTime}`;
      const endDateTime = `${filters.endDate.toLocaleDateString('es-ES')} ${endTime}`;
      dateText = `${startDateTime} - ${endDateTime}`;
    } else if (filters.startDate) {
      dateText = `Desde ${filters.startDate.toLocaleDateString('es-ES')} ${startTime}`;
    } else if (filters.endDate) {
      dateText = `Hasta ${filters.endDate.toLocaleDateString('es-ES')} ${endTime}`;
    }
    
    doc.text(`Rango de fechas: ${dateText}`, 20, 35);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 20, 41);
    
    // Generar gráfico de disponibilidad con espacio adicional
    let currentY = 62; // Agregamos más espacio antes del gráfico
    if (filteredDevices.length > 0) {
      currentY = generateAvailabilityChart(doc, currentY);
    }
    
    // Agregar dos líneas en blanco antes del título de la tabla
    currentY += 10;
    
    // Tabla de datos con anchos optimizados para orientación horizontal
    const tableData = filteredDevices.map(device => [
      device.alias,
      device.ip,
      `${device.availability.toFixed(1)}%`,
      device.totalPings.toString(),
      device.failedPings.toString(),
      `${Math.round(device.avgLatency)} ms`,
      `${device.minLatency} ms`,
      `${device.maxLatency} ms`,
      device.totalDowns.toString(),
      formatDuration(device.uptime),
      formatDuration(device.downtime)
    ]);
    
    // Calcular anchos de columna dinámicamente basado en el ancho de página
    const availableWidth = pageWidth - 40; // Márgenes de 20 a cada lado
    const columnWidths = [
      availableWidth * 0.12,  // Dispositivo - 12%
      availableWidth * 0.10,  // Dirección IP - 10%
      availableWidth * 0.08,  // Disponibilidad - 8%
      availableWidth * 0.08,  // Total Pings - 8%
      availableWidth * 0.08,  // Pings Fallidos - 8%
      availableWidth * 0.10,  // Latencia Promedio - 10%
      availableWidth * 0.09,  // Latencia Mínima - 9%
      availableWidth * 0.09,  // Latencia Máxima - 9%
      availableWidth * 0.08,  // Total Caídas - 8%
      availableWidth * 0.09,  // Tiempo Activo - 9%
      availableWidth * 0.09   // Tiempo Inactivo - 9%
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [[
        'Dispositivo', 
        'Dirección IP', 
        'Disponibilidad', 
        'Total Pings', 
        'Pings Fallidos', 
        'Latencia Promedio', 
        'Latencia Mínima', 
        'Latencia Máxima', 
        'Total Caídas', 
        'Tiempo Activo', 
        'Tiempo Inactivo'
      ]],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [255, 255, 255]
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        0: { cellWidth: columnWidths[0], halign: 'left' },
        1: { cellWidth: columnWidths[1], halign: 'center' },
        2: { cellWidth: columnWidths[2], halign: 'center' },
        3: { cellWidth: columnWidths[3], halign: 'center' },
        4: { cellWidth: columnWidths[4], halign: 'center' },
        5: { cellWidth: columnWidths[5], halign: 'center' },
        6: { cellWidth: columnWidths[6], halign: 'center' },
        7: { cellWidth: columnWidths[7], halign: 'center' },
        8: { cellWidth: columnWidths[8], halign: 'center' },
        9: { cellWidth: columnWidths[9], halign: 'center' },
        10: { cellWidth: columnWidths[10], halign: 'center' }
      },
      margin: { left: 20, right: 20, top: 10, bottom: 10 },
      theme: 'striped',
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      tableWidth: 'auto',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      }
    });
    
    doc.save(`${settings.appName.replace(/\s+/g, '_')}_Informe_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const generateExcelReport = () => {
    // Incluir información de fecha y hora en Excel también
    let dateRangeInfo = 'Todo el tiempo';
    if (filters.startDate && filters.endDate) {
      const startDateTime = `${filters.startDate.toLocaleDateString('es-ES')} ${startTime}`;
      const endDateTime = `${filters.endDate.toLocaleDateString('es-ES')} ${endTime}`;
      dateRangeInfo = `${startDateTime} - ${endDateTime}`;
    } else if (filters.startDate) {
      dateRangeInfo = `Desde ${filters.startDate.toLocaleDateString('es-ES')} ${startTime}`;
    } else if (filters.endDate) {
      dateRangeInfo = `Hasta ${filters.endDate.toLocaleDateString('es-ES')} ${endTime}`;
    }
    
    const wsData = [
      [settings.appName],
      ['Informe de Monitoreo de Red'],
      [`${settings.dashboardSubtitle} - ${settings.companyName}`],
      [`Rango de fechas: ${dateRangeInfo}`],
      [`Generado: ${new Date().toLocaleString('es-ES')}`],
      [], // Línea en blanco
      ['Dispositivo', 'Dirección IP', 'Estado', 'Disponibilidad', 'Total Pings', 'Pings Fallidos', 'Latencia Promedio', 'Latencia Mínima', 'Latencia Máxima', 'Total Caídas', 'Tiempo Activo', 'Tiempo Inactivo'],
      ...filteredDevices.map(device => [
        device.alias,
        device.ip,
        device.isActive ? 'En línea' : 'Desconectado',
        `${device.availability.toFixed(1)}%`,
        device.totalPings,
        device.failedPings,
        `${Math.round(device.avgLatency)} ms`,
        `${device.minLatency} ms`,
        `${device.maxLatency} ms`,
        device.totalDowns,
        formatDuration(device.uptime),
        formatDuration(device.downtime)
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monitoreo de Red');
    
    XLSX.writeFile(wb, `${settings.appName.replace(/\s+/g, '_')}_Informe_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Informes
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Genere y descargue informes de monitoreo con filtros de fecha y hora
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros del Informe</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicial
            </label>
            <input
              type="date"
              name="startDate"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onChange={handleFilterChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hora Inicial
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Final
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onChange={handleFilterChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hora Final
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dispositivos
            </label>
            <select
              multiple
              name="deviceIds"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onChange={handleDeviceSelection}
              size={3}
            >
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.alias} ({device.ip})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Mantenga presionado Ctrl/Cmd para seleccionar múltiples dispositivos
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              name="status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onChange={handleFilterChange}
              value={filters.status}
            >
              <option value="all">Todos los Dispositivos</option>
              <option value="active">Solo En línea</option>
              <option value="down">Solo Desconectados</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={generatePdfReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={filteredDevices.length === 0}
          >
            <FilePdf size={16} className="mr-2" />
            Exportar como PDF
          </button>
          
          <button
            onClick={generateExcelReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={filteredDevices.length === 0}
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Exportar como Excel
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Vista Previa del Informe</h2>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredDevices.length} {filteredDevices.length === 1 ? 'dispositivo' : 'dispositivos'} en el informe
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dispositivo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponibilidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Latencia (Prom.)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Caídas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo Activo</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay dispositivos que coincidan con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredDevices.map(device => (
                  <tr key={device.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {device.alias}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {device.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                      }`}>
                        {device.isActive ? 'En línea' : 'Desconectado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {device.availability.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(device.avgLatency)} ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {device.totalDowns}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(device.uptime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;