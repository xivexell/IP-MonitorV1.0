export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
};

export const generateMockPingData = (success: boolean): { latency: number | null } => {
  if (success) {
    return { latency: Math.floor(5 + Math.random() * 295) };
  }
  return { latency: null };
};

export const isWithinBusinessHours = (
  startTime: string,
  endTime: string,
  days: string[]
): boolean => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  if (!days.includes(currentDay)) {
    return false;
  }
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
};

export const calculateAvailability = (successful: number, total: number): number => {
  if (total === 0) return 100;
  return (successful / total) * 100;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatIP = (ip: string): string => {
  return ip.trim();
};

export const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};