import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../contexts/SettingsContext';
import { AlertSettings, AppSettings } from '../types';
import { Save, AlertTriangle, Volume2, Mail, MessageSquare, Upload, X } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, updateAlertSettings, updateLogo } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch } = useForm({
    defaultValues: {
      appName: settings.appName,
      companyName: settings.companyName,
      dashboardSubtitle: settings.dashboardSubtitle,
      pingInterval: settings.pingInterval,
      primaryColor: settings.primaryColor,
      visualEnabled: settings.alerts.visualEnabled,
      visualDuration: settings.alerts.visualDuration,
      visualStyle: settings.alerts.visualStyle,
      audioEnabled: settings.alerts.audioEnabled,
      audioStartTime: settings.alerts.audioStartTime,
      audioEndTime: settings.alerts.audioEndTime,
      emailEnabled: settings.alerts.emailEnabled,
      emailRecipients: settings.alerts.emailRecipients.join(', '),
      telegramEnabled: settings.alerts.telegramEnabled,
      telegramRecipients: settings.alerts.telegramRecipients.join(', ')
    }
  });

  // Actualizar el formulario cuando cambien las configuraciones
  useEffect(() => {
    reset({
      appName: settings.appName,
      companyName: settings.companyName,
      dashboardSubtitle: settings.dashboardSubtitle,
      pingInterval: settings.pingInterval,
      primaryColor: settings.primaryColor,
      visualEnabled: settings.alerts.visualEnabled,
      visualDuration: settings.alerts.visualDuration,
      visualStyle: settings.alerts.visualStyle,
      audioEnabled: settings.alerts.audioEnabled,
      audioStartTime: settings.alerts.audioStartTime,
      audioEndTime: settings.alerts.audioEndTime,
      emailEnabled: settings.alerts.emailEnabled,
      emailRecipients: settings.alerts.emailRecipients.join(', '),
      telegramEnabled: settings.alerts.telegramEnabled,
      telegramRecipients: settings.alerts.telegramRecipients.join(', ')
    });

    // Establecer los días de audio seleccionados
    const checkboxes = document.querySelectorAll('input[name="audioDays"]');
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = settings.alerts.audioDays.includes(checkbox.value);
    });
  }, [settings, reset]);
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen válido');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Por favor seleccione una imagen menor a 5MB');
        return;
      }
      
      updateLogo(file);
    }
  };
  
  const removeLogo = () => {
    updateSettings({ logoUrl: '', logoFile: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const onSubmit = (data: any) => {
    updateSettings({
      appName: data.appName,
      companyName: data.companyName,
      dashboardSubtitle: data.dashboardSubtitle,
      pingInterval: Number(data.pingInterval),
      primaryColor: data.primaryColor
    });
    
    // Obtener los días seleccionados
    const selectedDays = Array.from(
      document.querySelectorAll('input[name="audioDays"]:checked')
    ).map((el: any) => el.value);
    
    updateAlertSettings({
      visualEnabled: data.visualEnabled,
      visualDuration: Number(data.visualDuration),
      visualStyle: data.visualStyle,
      
      audioEnabled: data.audioEnabled,
      audioStartTime: data.audioStartTime,
      audioEndTime: data.audioEndTime,
      audioDays: selectedDays,
      
      emailEnabled: data.emailEnabled,
      emailRecipients: data.emailRecipients ? data.emailRecipients.split(',').map((email: string) => email.trim()).filter((email: string) => email.length > 0) : [],
      
      telegramEnabled: data.telegramEnabled,
      telegramRecipients: data.telegramRecipients ? data.telegramRecipients.split(',').map((username: string) => username.trim()).filter((username: string) => username.length > 0) : []
    });
    
    alert('¡Configuración guardada exitosamente!');
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Configuración
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configure los ajustes de la aplicación y las alertas
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configuración General</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la Aplicación
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('appName', { required: 'El nombre de la aplicación es requerido' })}
                />
                {errors.appName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.appName.message as string}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('companyName', { required: 'El nombre de la empresa es requerido' })}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companyName.message as string}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción del Dashboard
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Monitoree sus dispositivos de red en tiempo real"
                  {...register('dashboardSubtitle', { required: 'La descripción del dashboard es requerida' })}
                />
                {errors.dashboardSubtitle && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dashboardSubtitle.message as string}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Este texto aparecerá debajo del nombre de la empresa en el dashboard principal
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo de la Empresa
                </label>
                
                {settings.logoUrl ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo actual"
                        className="h-16 w-auto object-contain border border-gray-200 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700"
                      />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Logo actual</p>
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="inline-flex items-center text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          <X size={14} className="mr-1" />
                          Eliminar logo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Haga clic para subir</span> o arrastre y suelte
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF hasta 5MB</p>
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <Upload size={16} className="mr-2" />
                  {settings.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Intervalo de Ping (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('pingInterval', { 
                    required: 'El intervalo de ping es requerido',
                    min: { value: 1, message: 'El intervalo mínimo es 1 segundo' },
                    max: { value: 300, message: 'El intervalo máximo es 300 segundos' }
                  })}
                />
                {errors.pingInterval && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pingInterval.message as string}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color Principal
                </label>
                <input
                  type="color"
                  className="w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white"
                  {...register('primaryColor')}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-4">
              <AlertTriangle size={20} className="text-amber-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Configuración de Alertas Visuales</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="visualEnabled"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('visualEnabled')}
                  />
                  <label htmlFor="visualEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Habilitar alertas visuales (solo en el panel principal)
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duración de la Alerta (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('visualDuration', { 
                    required: 'La duración es requerida',
                    min: { value: 1, message: 'La duración mínima es 1 segundo' },
                    max: { value: 60, message: 'La duración máxima es 60 segundos' }
                  })}
                />
                {errors.visualDuration && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.visualDuration.message as string}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estilo de Animación
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('visualStyle')}
                >
                  <option value="fade">Desvanecer</option>
                  <option value="slide">Deslizar</option>
                  <option value="bounce">Rebotar</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-4">
              <Volume2 size={20} className="text-blue-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Configuración de Alertas de Audio</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="audioEnabled"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('audioEnabled')}
                  />
                  <label htmlFor="audioEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Habilitar alertas de audio
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de Inicio (Horario Laboral)
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('audioStartTime')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora de Fin (Horario Laboral)
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register('audioEndTime')}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Días Activos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {[
                    ['Monday', 'Lunes'],
                    ['Tuesday', 'Martes'],
                    ['Wednesday', 'Miércoles'],
                    ['Thursday', 'Jueves'],
                    ['Friday', 'Viernes'],
                    ['Saturday', 'Sábado'],
                    ['Sunday', 'Domingo']
                  ].map(([value, label]) => (
                    <div key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`day-${value}`}
                        name="audioDays"
                        value={value}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked={settings.alerts.audioDays.includes(value)}
                      />
                      <label htmlFor={`day-${value}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-4">
              <Mail size={20} className="text-green-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notificaciones por Email</h2>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('emailEnabled')}
                />
                <label htmlFor="emailEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enviar notificaciones por email fuera del horario laboral
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Destinatarios de Email (separados por coma)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ejemplo@ejemplo.com, otro@ejemplo.com"
                  {...register('emailRecipients')}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nota: El envío de emails es simulado en esta demo.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-4">
              <MessageSquare size={20} className="text-purple-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notificaciones de Telegram</h2>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="telegramEnabled"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('telegramEnabled')}
                />
                <label htmlFor="telegramEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enviar notificaciones de Telegram fuera del horario laboral
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usuarios de Telegram (separados por coma)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="@usuario, @otro_usuario"
                  {...register('telegramRecipients')}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nota: El envío de mensajes de Telegram es simulado en esta demo.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!isDirty}
            >
              <Save size={16} className="mr-2" />
              Guardar Configuración
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;