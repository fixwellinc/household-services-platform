"use client";

import { useState, useEffect, useCallback } from 'react';
import { AuditLog, AuditLogFilters, AuditLogResponse, AuditLogStats } from '../types/admin';

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50
  });

  const fetchAuditLogs = useCallback(async (newFilters?: Partial<AuditLogFilters>) => {
    setLoading(true);
    setError(null);

    try {
      const currentFilters = { ...filters, ...newFilters };
      const queryParams = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data: { success: boolean } & AuditLogResponse = await response.json();
      
      if (data.success) {
        setAuditLogs(data.auditLogs);
        setPagination(data.pagination);
        setFilters(currentFilters);
      } else {
        throw new Error('Failed to fetch audit logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const exportAuditLogs = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
          queryParams.append(key, value.toString());
        }
      });
      
      queryParams.append('format', format);

      const response = await fetch(`/api/admin/audit-logs/export?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<AuditLogFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    fetchAuditLogs(updatedFilters);
  }, [fetchAuditLogs, filters]);

  const changePage = useCallback((page: number) => {
    fetchAuditLogs({ page });
  }, [fetchAuditLogs]);

  const clearFilters = useCallback(() => {
    const clearedFilters = { page: 1, limit: 50 };
    setFilters(clearedFilters);
    fetchAuditLogs(clearedFilters);
  }, [fetchAuditLogs]);

  // Initial load
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return {
    auditLogs,
    loading,
    error,
    pagination,
    filters,
    fetchAuditLogs,
    exportAuditLogs,
    updateFilters,
    changePage,
    clearFilters,
    refresh: () => fetchAuditLogs(filters)
  };
}

export function useAuditLogStats() {
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (dateRange?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (dateRange?.startDate) {
        queryParams.append('startDate', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        queryParams.append('endDate', dateRange.endDate);
      }

      const response = await fetch(`/api/admin/audit-logs/stats?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit log statistics');
      }

      const data: { success: boolean; stats: AuditLogStats } = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error('Failed to fetch audit log statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with last 30 days
  useEffect(() => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    fetchStats({ startDate, endDate });
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refresh: () => fetchStats()
  };
}