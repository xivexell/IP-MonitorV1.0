const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Configuración base para fetch
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Función auxiliar para manejar respuestas
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// API de Dispositivos
export const devicesAPI = {
  // Obtener todos los dispositivos
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/devices`, fetchConfig);
    return handleResponse(response);
  },

  // Obtener un dispositivo específico
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${id}`, fetchConfig);
    return handleResponse(response);
  },

  // Crear nuevo dispositivo
  create: async (deviceData: { ip: string; alias: string }) => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    return handleResponse(response);
  },

  // Actualizar dispositivo
  update: async (id: string, deviceData: { ip: string; alias: string }) => {
    const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
    return handleResponse(response);
  },

  // Eliminar dispositivo
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Actualizar resultado de ping
  updatePing: async (id: string, pingData: { success: boolean; latency: number | null; timestamp?: string }) => {
    const response = await fetch(`${API_BASE_URL}/devices/${id}/ping`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(pingData),
    });
    return handleResponse(response);
  },
};

// API de Configuraciones
export const settingsAPI = {
  // Obtener todas las configuraciones
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/settings`, fetchConfig);
    return handleResponse(response);
  },

  // Actualizar configuraciones
  update: async (settings: any) => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },

  // Obtener configuración específica
  getByKey: async (key: string) => {
    const response = await fetch(`${API_BASE_URL}/settings/${key}`, fetchConfig);
    return handleResponse(response);
  },

  // Actualizar configuración específica
  updateByKey: async (key: string, value: string) => {
    const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    return handleResponse(response);
  },
};

// API de Alertas
export const alertsAPI = {
  // Obtener todas las alertas
  getAll: async (params?: { limit?: number; offset?: number; acknowledged?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.acknowledged !== undefined) searchParams.append('acknowledged', params.acknowledged.toString());

    const response = await fetch(`${API_BASE_URL}/alerts?${searchParams}`, fetchConfig);
    return handleResponse(response);
  },

  // Obtener alertas recientes
  getRecent: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/recent`, fetchConfig);
    return handleResponse(response);
  },

  // Marcar alerta como reconocida
  acknowledge: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}/acknowledge`, {
      ...fetchConfig,
      method: 'PUT',
    });
    return handleResponse(response);
  },

  // Marcar todas las alertas como reconocidas
  acknowledgeAll: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/acknowledge-all`, {
      ...fetchConfig,
      method: 'PUT',
    });
    return handleResponse(response);
  },

  // Obtener estadísticas de alertas
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/stats`, fetchConfig);
    return handleResponse(response);
  },
};

// API de Reportes
export const reportsAPI = {
  // Generar reporte de dispositivos
  getDevicesReport: async (params?: {
    startDate?: string;
    endDate?: string;
    deviceIds?: string[];
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.deviceIds) {
      params.deviceIds.forEach(id => searchParams.append('deviceIds', id));
    }

    const response = await fetch(`${API_BASE_URL}/reports/devices?${searchParams}`, fetchConfig);
    return handleResponse(response);
  },

  // Generar reporte de historial de pings
  getPingHistoryReport: async (params?: {
    startDate?: string;
    endDate?: string;
    deviceId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.deviceId) searchParams.append('deviceId', params.deviceId);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_BASE_URL}/reports/ping-history?${searchParams}`, fetchConfig);
    return handleResponse(response);
  },

  // Generar reporte de alertas
  getAlertsReport: async (params?: {
    startDate?: string;
    endDate?: string;
    deviceId?: string;
    type?: string;
    acknowledged?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.deviceId) searchParams.append('deviceId', params.deviceId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.acknowledged !== undefined) searchParams.append('acknowledged', params.acknowledged.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_BASE_URL}/reports/alerts?${searchParams}`, fetchConfig);
    return handleResponse(response);
  },
};

// API de Ping
export const pingAPI = {
  // Probar ping a una IP específica
  test: async (ip: string) => {
    const response = await fetch(`${API_BASE_URL}/ping/test/${ip}`, {
      ...fetchConfig,
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Ejecutar ping a todos los dispositivos
  pingAll: async () => {
    const response = await fetch(`${API_BASE_URL}/ping/all`, {
      ...fetchConfig,
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Obtener estadísticas de ping
  getStats: async (params?: { deviceId?: string; hours?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.deviceId) searchParams.append('deviceId', params.deviceId);
    if (params?.hours) searchParams.append('hours', params.hours.toString());

    const response = await fetch(`${API_BASE_URL}/ping/stats?${searchParams}`, fetchConfig);
    return handleResponse(response);
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`, fetchConfig);
    return handleResponse(response);
  },
};