"use client";

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './use-api';
import { useToast } from './use-toast';

// Types for reports data
export interface Report {
  id: string;
  name: string;
  description?: string;
  config: ReportConfig;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  schedule?: ReportSchedule;
}

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  dataSource: string;
  filters: ReportFilter[];
  columns: ReportColumn[];
  groupBy?: string[];
  sortBy?: SortConfig[];
  schedule?: ScheduleConfig;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number | Date;
  values?: (string | number | Date)[];
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'xlsx';
}

export interface ReportSchedule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'xlsx';
  isActive: boolean;
  nextRun?: Date;
  lastRun?: Date;
}

export interface ReportData {
  columns: ReportColumn[];
  rows: any[][];
  totalRows: number;
  generatedAt: Date;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  reportId: string;
  reportName: string;
  generatedBy: string;
  parameters: Record<string, any>;
  executionTime: number;
  dataSource: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: ReportConfig;
  parameters: ReportParameter[];
  isBuiltIn: boolean;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

export interface ReportStats {
  totalReports: number;
  scheduledReports: number;
  reportsRunToday: number;
  averageExecutionTime: number;
  categories: {
    name: string;
    count: number;
  }[];
}

interface UseReportsDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function useReportsData(options: UseReportsDataOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await request('/admin/reports');
      
      if (response.success) {
        setReports(response.reports || []);
      } else {
        throw new Error(response.error || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [request]);

  // Fetch report templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await request('/admin/reports/templates');
      
      if (response.success) {
        setTemplates(response.templates || []);
      } else {
        throw new Error(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    }
  }, [request]);

  // Fetch scheduled reports
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await request('/admin/reports/schedules');
      
      if (response.success) {
        setSchedules(response.schedules || []);
      } else {
        throw new Error(response.error || 'Failed to fetch schedules');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    }
  }, [request]);

  // Fetch report stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await request('/admin/reports/stats');
      
      if (response.success) {
        setStats(response.stats);
      } else {
        throw new Error(response.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  }, [request]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReports(),
        fetchTemplates(),
        fetchSchedules(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchReports, fetchTemplates, fetchSchedules, fetchStats]);

  // Generate report
  const generateReport = useCallback(async (
    templateId: string, 
    parameters: Record<string, any> = {},
    format: 'json' | 'csv' | 'pdf' | 'xlsx' = 'json'
  ) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          parameters,
          format
        })
      });
      
      if (response.success) {
        showSuccess('Report generated successfully');
        return response.report;
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      showError(err instanceof Error ? err.message : 'Failed to generate report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Preview report
  const previewReport = useCallback(async (
    templateId: string, 
    parameters: Record<string, any> = {}
  ) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/reports/preview', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          parameters
        })
      });
      
      if (response.success) {
        return response.preview;
      } else {
        throw new Error(response.error || 'Failed to preview report');
      }
    } catch (err) {
      console.error('Error previewing report:', err);
      showError(err instanceof Error ? err.message : 'Failed to preview report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showError]);

  // Create custom report
  const createReport = useCallback(async (reportData: Partial<Report>) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
      
      if (response.success) {
        setReports(prev => [...prev, response.report]);
        showSuccess('Report created successfully');
        return response.report;
      } else {
        throw new Error(response.error || 'Failed to create report');
      }
    } catch (err) {
      console.error('Error creating report:', err);
      showError(err instanceof Error ? err.message : 'Failed to create report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Update report
  const updateReport = useCallback(async (reportId: string, updates: Partial<Report>) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      if (response.success) {
        setReports(prev => 
          prev.map(report => 
            report.id === reportId 
              ? { ...report, ...updates }
              : report
          )
        );
        showSuccess('Report updated successfully');
        return response.report;
      } else {
        throw new Error(response.error || 'Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      showError(err instanceof Error ? err.message : 'Failed to update report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Delete report
  const deleteReport = useCallback(async (reportId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/reports/${reportId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setReports(prev => prev.filter(report => report.id !== reportId));
        showSuccess('Report deleted successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete report');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Schedule report
  const scheduleReport = useCallback(async (scheduleData: Partial<ReportSchedule> & { reportId: string }) => {
    try {
      setLoading(true);
      
      const response = await request('/admin/reports/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });
      
      if (response.success) {
        setSchedules(prev => [...prev, response.schedule]);
        showSuccess('Report scheduled successfully');
        return response.schedule;
      } else {
        throw new Error(response.error || 'Failed to schedule report');
      }
    } catch (err) {
      console.error('Error scheduling report:', err);
      showError(err instanceof Error ? err.message : 'Failed to schedule report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Update schedule
  const updateSchedule = useCallback(async (scheduleId: string, updates: Partial<ReportSchedule>) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/reports/schedules/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      if (response.success) {
        setSchedules(prev => 
          prev.map(schedule => 
            schedule.id === scheduleId 
              ? { ...schedule, ...updates }
              : schedule
          )
        );
        showSuccess('Schedule updated successfully');
        return response.schedule;
      } else {
        throw new Error(response.error || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      showError(err instanceof Error ? err.message : 'Failed to update schedule');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Delete schedule
  const deleteSchedule = useCallback(async (scheduleId: string) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/reports/schedules/${scheduleId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
        showSuccess('Schedule deleted successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete schedule');
      return false;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Export report
  const exportReport = useCallback(async (
    reportId: string, 
    format: 'csv' | 'pdf' | 'xlsx' = 'csv'
  ) => {
    try {
      setLoading(true);
      
      const response = await request(`/admin/reports/${reportId}/export`, {
        method: 'POST',
        body: JSON.stringify({ format })
      });
      
      if (response.success) {
        showSuccess('Report exported successfully');
        return response.exportUrl;
      } else {
        throw new Error(response.error || 'Failed to export report');
      }
    } catch (err) {
      console.error('Error exporting report:', err);
      showError(err instanceof Error ? err.message : 'Failed to export report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request, showSuccess, showError]);

  // Validate schedule expression
  const validateSchedule = useCallback(async (schedule: string) => {
    try {
      const response = await request('/admin/reports/validate-schedule', {
        method: 'POST',
        body: JSON.stringify({ schedule })
      });
      
      if (response.success) {
        return {
          valid: response.valid,
          nextRuns: response.nextRuns,
          error: response.error
        };
      } else {
        throw new Error(response.error || 'Failed to validate schedule');
      }
    } catch (err) {
      console.error('Error validating schedule:', err);
      throw err;
    }
  }, [request]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAllData();
    }
  }, [autoFetch, fetchAllData]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchAllData]);

  return {
    // Data
    reports,
    templates,
    schedules,
    stats,
    loading,
    error,
    
    // Actions
    fetchAllData,
    fetchReports,
    fetchTemplates,
    fetchSchedules,
    fetchStats,
    generateReport,
    previewReport,
    createReport,
    updateReport,
    deleteReport,
    scheduleReport,
    updateSchedule,
    deleteSchedule,
    exportReport,
    validateSchedule,
    
    // Utilities
    refetch: fetchAllData
  };
}