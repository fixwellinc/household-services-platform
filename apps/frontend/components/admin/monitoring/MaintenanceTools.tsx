"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea } from '@/components/ui/shared';
import { Progress } from '@/components/ui/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  HardDrive,
  FileText,
  Trash2,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Download,
  Upload
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  lastRun?: Date;
  duration?: number;
  result?: string;
}

interface CacheStats {
  totalKeys: number;
  hitRate: number;
  memoryUsage: number;
  expiredKeys: number;
}

interface DatabaseStats {
  totalSize: string;
  tableCount: number;
  indexCount: number;
  connectionCount: number;
  slowQueries: number;
}

interface LogStats {
  totalLogs: number;
  errorLogs: number;
  warningLogs: number;
  logSize: string;
  oldestLog: Date;
}

export default function MaintenanceTools() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize maintenance tasks
  useEffect(() => {
    const initialTasks: MaintenanceTask[] = [
      {
        id: 'cache-cleanup',
        name: 'Cache Cleanup',
        description: 'Remove expired cache entries and optimize memory usage',
        status: 'idle',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'db-analyze',
        name: 'Database Analysis',
        description: 'Analyze database tables and update statistics',
        status: 'idle',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 'log-rotation',
        name: 'Log Rotation',
        description: 'Archive old logs and clean up log files',
        status: 'idle',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'index-rebuild',
        name: 'Index Rebuild',
        description: 'Rebuild database indexes for optimal performance',
        status: 'idle',
        lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ];
    setTasks(initialTasks);
    fetchStats();
  }, []);

  // Fetch system statistics
  const fetchStats = async () => {
    try {
      // Mock data - in real implementation, fetch from API
      setCacheStats({
        totalKeys: 15420,
        hitRate: 78.5,
        memoryUsage: 245,
        expiredKeys: 1250
      });

      setDatabaseStats({
        totalSize: '2.4 GB',
        tableCount: 28,
        indexCount: 156,
        connectionCount: 12,
        slowQueries: 3
      });

      setLogStats({
        totalLogs: 125000,
        errorLogs: 450,
        warningLogs: 1200,
        logSize: '890 MB',
        oldestLog: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Run maintenance task
  const runTask = async (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running', progress: 0 }
        : task
    ));

    try {
      // Simulate task execution with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, progress }
            : task
        ));
      }

      // Complete the task
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100,
              lastRun: new Date(),
              duration: 2000,
              result: 'Task completed successfully'
            }
          : task
      ));

      // Refresh stats after task completion
      await fetchStats();
    } catch (error) {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'failed',
              result: 'Task failed: ' + error
            }
          : task
      ));
    }
  };

  // Cache management functions
  const clearCache = async (pattern?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/monitoring/actions/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pattern })
      });

      if (response.ok) {
        await fetchStats();
        alert('Cache cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  // Database maintenance functions
  const analyzeDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance/database/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchStats();
        alert('Database analysis completed');
      }
    } catch (error) {
      console.error('Error analyzing database:', error);
      alert('Failed to analyze database');
    } finally {
      setLoading(false);
    }
  };

  // Log management functions
  const searchLogs = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      // Mock search results - in real implementation, search actual logs
      const mockResults = [
        {
          timestamp: new Date(),
          level: 'error',
          message: `Error related to: ${searchQuery}`,
          source: 'api.js:123'
        },
        {
          timestamp: new Date(Date.now() - 60000),
          level: 'warning',
          message: `Warning about: ${searchQuery}`,
          source: 'database.js:456'
        }
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      setLoading(true);
      // Mock export - in real implementation, call actual export API
      const blob = new Blob(['Mock log data'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusIcon = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTaskStatusColor = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Maintenance & Optimization Tools</h2>
        <p className="text-gray-600">Database maintenance, cache management, and system optimization</p>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Maintenance Tasks</TabsTrigger>
          <TabsTrigger value="cache">Cache Management</TabsTrigger>
          <TabsTrigger value="database">Database Tools</TabsTrigger>
          <TabsTrigger value="logs">Log Management</TabsTrigger>
        </TabsList>

        {/* Maintenance Tasks */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {getTaskStatusIcon(task.status)}
                      <span>{task.name}</span>
                    </CardTitle>
                    <Badge className={getTaskStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {task.status === 'running' && task.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  )}

                  {task.lastRun && (
                    <div className="text-sm text-gray-600 mb-4">
                      Last run: {task.lastRun.toLocaleString()}
                      {task.duration && (
                        <span className="ml-2">({task.duration}ms)</span>
                      )}
                    </div>
                  )}

                  {task.result && (
                    <div className="text-sm mb-4 p-2 bg-gray-50 rounded">
                      {task.result}
                    </div>
                  )}

                  <Button 
                    onClick={() => runTask(task.id)}
                    disabled={task.status === 'running'}
                    className="w-full"
                  >
                    {task.status === 'running' ? 'Running...' : 'Run Task'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cache Management */}
        <TabsContent value="cache" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Keys</p>
                    <p className="text-lg font-semibold">{cacheStats?.totalKeys.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Hit Rate</p>
                    <p className="text-lg font-semibold">{cacheStats?.hitRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-600">Memory Usage</p>
                    <p className="text-lg font-semibold">{cacheStats?.memoryUsage} MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">Expired Keys</p>
                    <p className="text-lg font-semibold">{cacheStats?.expiredKeys.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache Operations</CardTitle>
              <CardDescription>Manage cache entries and optimize memory usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => clearCache()}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All Cache</span>
                  </Button>
                  
                  <Button 
                    onClick={() => clearCache('expired')}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear Expired Only</span>
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="cache-pattern">Clear by Pattern</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="cache-pattern"
                      placeholder="e.g., user:*, subscription:*"
                      className="flex-1"
                    />
                    <Button variant="outline">Clear Pattern</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tools */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Size</p>
                    <p className="text-lg font-semibold">{databaseStats?.totalSize}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Tables</p>
                    <p className="text-lg font-semibold">{databaseStats?.tableCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-600">Indexes</p>
                    <p className="text-lg font-semibold">{databaseStats?.indexCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">Slow Queries</p>
                    <p className="text-lg font-semibold">{databaseStats?.slowQueries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
              <CardDescription>Optimize database performance and maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={analyzeDatabase}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Analyze Tables</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Rebuild Indexes</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Database className="h-4 w-4" />
                  <span>Vacuum Database</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Slow Queries</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log Management */}
        <TabsContent value="logs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Logs</p>
                    <p className="text-lg font-semibold">{logStats?.totalLogs.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">Error Logs</p>
                    <p className="text-lg font-semibold">{logStats?.errorLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-600">Warning Logs</p>
                    <p className="text-lg font-semibold">{logStats?.warningLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Log Size</p>
                    <p className="text-lg font-semibold">{logStats?.logSize}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Log Search & Analysis</CardTitle>
              <CardDescription>Search through system logs and export data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchLogs} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h4 className="font-medium mb-2">Search Results</h4>
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <div key={index} className="text-sm border-b pb-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={
                              result.level === 'error' ? 'bg-red-100 text-red-800' :
                              result.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {result.level}
                            </Badge>
                            <span className="text-gray-500">{result.timestamp.toLocaleString()}</span>
                            <span className="text-gray-500">{result.source}</span>
                          </div>
                          <p>{result.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Export Logs</h4>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => exportLogs('csv')}
                      disabled={loading}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export CSV</span>
                    </Button>
                    <Button 
                      onClick={() => exportLogs('json')}
                      disabled={loading}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export JSON</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}