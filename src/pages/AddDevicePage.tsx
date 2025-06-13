import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDevices } from '../contexts/DeviceContext';
import { isValidIP } from '../lib/utils';
import { ArrowLeft } from 'lucide-react';

interface AddDeviceForm {
  ip: string;
  alias: string;
}

const AddDevicePage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<AddDeviceForm>();
  const { addDevice } = useDevices();
  const navigate = useNavigate();
  
  const onSubmit = (data: AddDeviceForm) => {
    addDevice(data.ip, data.alias);
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
          Agregar Nuevo Dispositivo
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Agregue un nuevo dispositivo para monitorear su conectividad
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
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 mr-3"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar Dispositivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDevicePage;