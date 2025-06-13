import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDevices } from '../contexts/DeviceContext';
import { isValidIP } from '../lib/utils';
import { ArrowLeft, Save } from 'lucide-react';

interface EditDeviceForm {
  ip: string;
  alias: string;
}

const EditDevicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { devices, updateDevice } = useDevices();
  const navigate = useNavigate();
  
  const device = devices.find(d => d.id === id);
  
  const { register, handleSubmit, formState: { errors } } = useForm<EditDeviceForm>({
    defaultValues: {
      ip: device?.ip || '',
      alias: device?.alias || ''
    }
  });
  
  if (!device) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Dispositivo no encontrado</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          El dispositivo que intenta editar no existe o ha sido eliminado.
        </p>
        <button
          onClick={() => navigate('/devices')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a Dispositivos
        </button>
      </div>
    );
  }
  
  const onSubmit = (data: EditDeviceForm) => {
    updateDevice(device.id, data.ip, data.alias);
    navigate('/devices');
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
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Editar Dispositivo
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Modifique la información del dispositivo {device.alias}
        </p>
      </div>
      
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="ip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección IP
            </label>
            <input
              type="text"
              id="ip"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.ip ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="192.168.1.1"
              {...register('ip', {
                required: 'La dirección IP es requerida',
                validate: value => isValidIP(value) || 'Por favor ingrese una dirección IP válida'
              })}
            />
            {errors.ip && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ip.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="alias" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Dispositivo
            </label>
            <input
              type="text"
              id="alias"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.alias ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Router"
              {...register('alias', {
                required: 'El nombre del dispositivo es requerido',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              })}
            />
            {errors.alias && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.alias.message}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save size={16} className="mr-2" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDevicePage;