export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'activity' | 'progress';
  title: string;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
  config: WidgetConfig;
  refreshInterval?: number;
  permissions: string[];
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  dataSource: string;
  parameters: Record<string, any>;
  visualization: VisualizationConfig;
  alerts?: AlertConfig[];
  customization?: CustomizationConfig;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge';
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
  theme?: 'light' | 'dark';
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    value: number | string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifications: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook';
  target: string;
  enabled: boolean;
}

export interface CustomizationConfig {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  fontSize?: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  gridSize: {
    columns: number;
    rows: number;
  };
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetData {
  timestamp: Date;
  value: any;
  metadata?: Record<string, any>;
}

export interface MetricWidgetData extends WidgetData {
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
  target?: number;
}

export interface ChartWidgetData extends WidgetData {
  value: Array<{
    x: string | number | Date;
    y: number;
    series?: string;
  }>;
}

export interface TableWidgetData extends WidgetData {
  value: {
    headers: string[];
    rows: Array<Record<string, any>>;
    totalCount?: number;
  };
}

export interface AlertWidgetData extends WidgetData {
  value: {
    alerts: Array<{
      id: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: Date;
      acknowledged: boolean;
    }>;
  };
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'monitoring' | 'business' | 'system';
  type: DashboardWidget['type'];
  defaultConfig: WidgetConfig;
  defaultSize: { width: number; height: number };
  previewImage?: string;
  tags: string[];
}

export interface DashboardTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  borderRadius: number;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}