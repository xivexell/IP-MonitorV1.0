export interface Device {
  id: string;
  ip: string;
  alias: string;
  isActive: boolean;
  latestPing: number | null;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  availability: number;
  totalDowns: number;
  failedPings: number;
  totalPings: number;
  lastStatusChange: Date | null;
  downtime: number;
  uptime: number;
  history: PingResult[];
}

export interface PingResult {
  timestamp: Date;
  latency: number | null;
  success: boolean;
}

export interface AlertSettings {
  visualEnabled: boolean;
  visualDuration: number;
  visualStyle: 'fade' | 'slide' | 'bounce';
  
  audioEnabled: boolean;
  audioStartTime: string;
  audioEndTime: string;
  audioDays: string[];
  
  emailEnabled: boolean;
  emailRecipients: string[];
  
  telegramEnabled: boolean;
  telegramRecipients: string[];
}

export interface AppSettings {
  appName: string;
  companyName: string;
  dashboardSubtitle: string;
  logoUrl: string;
  logoFile?: File | null;
  pingInterval: number;
  theme: 'light' | 'dark';
  primaryColor: string;
  alerts: AlertSettings;
}

export interface ReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  deviceIds: string[];
  status: 'all' | 'active' | 'down';
}

export type ThemeMode = 'light' | 'dark';