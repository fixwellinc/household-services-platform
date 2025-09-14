export { BaseWidget } from './BaseWidget';
export { DashboardGrid } from './DashboardGrid';
export { DashboardContainer } from './DashboardContainer';
export { WidgetLibrary } from './WidgetLibrary';

// Widget exports
export { MetricWidget } from './widgets/MetricWidget';
export { ChartWidget } from './widgets/ChartWidget';
export { TableWidget } from './widgets/TableWidget';
export { AlertWidget } from './widgets/AlertWidget';

// Type exports
export type {
  DashboardWidget,
  DashboardLayout,
  WidgetTemplate,
  WidgetConfig,
  WidgetData,
  MetricWidgetData,
  ChartWidgetData,
  TableWidgetData,
  AlertWidgetData
} from '@/types/dashboard';