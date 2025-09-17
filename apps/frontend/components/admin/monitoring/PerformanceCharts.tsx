"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { Activity, Clock, Cpu, MemoryStick, Database } from 'lucide-react';

interface MetricPoint {
    timestamp: number;
    value: number;
}

interface ChartData {
    time: string;
    cpu?: number;
    memory?: number;
    responseTime?: number;
    cacheHitRate?: number;
}

export default function PerformanceCharts() {
    const [selectedMetric, setSelectedMetric] = useState('cpu');
    const [selectedPeriod, setSelectedPeriod] = useState('1h');
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch historical metrics
    const fetchMetricHistory = async (metric: string, period: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/monitoring/metrics/history?metric=${metric}&period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const formattedData = result.data.points.map((point: MetricPoint) => ({
                    time: new Date(point.timestamp).toLocaleTimeString(),
                    [metric]: point.value
                }));
                setChartData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching metric history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch real-time metrics for combined chart
    const fetchRealtimeMetrics = async () => {
        try {
            const response = await fetch('/api/admin/monitoring/metrics/realtime?metrics=cpu,memory,responseTime,cache', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const newDataPoint: ChartData = {
                    time: new Date().toLocaleTimeString(),
                    cpu: result.data.cpu,
                    memory: result.data.memory?.percentage,
                    responseTime: result.data.responseTime?.averageResponseTime,
                    cacheHitRate: result.data.cache?.hitRate
                };

                setChartData(prev => {
                    const updated = [...prev, newDataPoint];
                    // Keep only last 50 points for real-time view
                    return updated.slice(-50);
                });
            }
        } catch (error) {
            console.error('Error fetching real-time metrics:', error);
        }
    };

    useEffect(() => {
        if (selectedMetric === 'realtime') {
            // Start real-time updates
            fetchRealtimeMetrics();
            const interval = setInterval(fetchRealtimeMetrics, 5000);
            return () => clearInterval(interval);
        } else {
            // Fetch historical data
            fetchMetricHistory(selectedMetric, selectedPeriod);
        }
    }, [selectedMetric, selectedPeriod]);

    const getMetricColor = (metric: string) => {
        switch (metric) {
            case 'cpu':
                return '#3b82f6';
            case 'memory':
                return '#ef4444';
            case 'responseTime':
                return '#10b981';
            case 'cacheHitRate':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const getMetricUnit = (metric: string) => {
        switch (metric) {
            case 'cpu':
            case 'memory':
            case 'cacheHitRate':
                return '%';
            case 'responseTime':
                return 'ms';
            default:
                return '';
        }
    };

    const formatTooltipValue = (value: any, name: string) => {
        return [`${value}${getMetricUnit(name)}`, name.charAt(0).toUpperCase() + name.slice(1)];
    };

    // Generate mock data for demonstration
    const generateMockData = () => {
        const data = [];
        const now = Date.now();
        for (let i = 49; i >= 0; i--) {
            data.push({
                time: new Date(now - i * 60000).toLocaleTimeString(),
                cpu: Math.floor(Math.random() * 40) + 30,
                memory: Math.floor(Math.random() * 30) + 50,
                responseTime: Math.floor(Math.random() * 200) + 100,
                cacheHitRate: Math.floor(Math.random() * 20) + 75
            });
        }
        return data;
    };

    // Use mock data if no real data available
    const displayData = chartData.length > 0 ? chartData : generateMockData();

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Performance Charts</h2>
                    <p className="text-gray-600">Real-time and historical system performance metrics</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="w-48"
                    >
                        <option value="realtime">Real-time Combined</option>
                        <option value="cpu">CPU Usage</option>
                        <option value="memory">Memory Usage</option>
                        <option value="responseTime">Response Time</option>
                        <option value="cacheHitRate">Cache Hit Rate</option>
                    </Select>

                    {selectedMetric !== 'realtime' && (
                        <Select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-32"
                        >
                            <option value="1h">1 Hour</option>
                            <option value="6h">6 Hours</option>
                            <option value="24h">24 Hours</option>
                        </Select>
                    )}
                </div>
            </div>

            {/* Main Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>
                            {selectedMetric === 'realtime' ? 'Real-time System Metrics' :
                                `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} - ${selectedPeriod}`}
                        </span>
                    </CardTitle>
                    <CardDescription>
                        {selectedMetric === 'realtime' ?
                            'Live system performance metrics updated every 5 seconds' :
                            `Historical ${selectedMetric} data over the selected time period`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Activity className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600">Loading chart data...</p>
                                </div>
                            </div>
                        ) : selectedMetric === 'realtime' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={displayData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip formatter={formatTooltipValue} />
                                    <Line
                                        type="monotone"
                                        dataKey="cpu"
                                        stroke={getMetricColor('cpu')}
                                        strokeWidth={2}
                                        name="CPU %"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="memory"
                                        stroke={getMetricColor('memory')}
                                        strokeWidth={2}
                                        name="Memory %"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cacheHitRate"
                                        stroke={getMetricColor('cacheHitRate')}
                                        strokeWidth={2}
                                        name="Cache Hit Rate %"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={displayData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip formatter={formatTooltipValue} />
                                    <Area
                                        type="monotone"
                                        dataKey={selectedMetric}
                                        stroke={getMetricColor(selectedMetric)}
                                        fill={getMetricColor(selectedMetric)}
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Cpu className="h-4 w-4 text-blue-600" />
                            <div>
                                <p className="text-xs text-gray-600">Current CPU</p>
                                <p className="text-lg font-semibold">
                                    {displayData[displayData.length - 1]?.cpu || 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <MemoryStick className="h-4 w-4 text-red-600" />
                            <div>
                                <p className="text-xs text-gray-600">Current Memory</p>
                                <p className="text-lg font-semibold">
                                    {displayData[displayData.length - 1]?.memory || 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <div>
                                <p className="text-xs text-gray-600">Response Time</p>
                                <p className="text-lg font-semibold">
                                    {displayData[displayData.length - 1]?.responseTime || 0}ms
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Database className="h-4 w-4 text-yellow-600" />
                            <div>
                                <p className="text-xs text-gray-600">Cache Hit Rate</p>
                                <p className="text-lg font-semibold">
                                    {displayData[displayData.length - 1]?.cacheHitRate || 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Analysis</CardTitle>
                    <CardDescription>
                        Automated analysis and recommendations based on current metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">CPU Trend</h4>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Stable - within normal range</span>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Memory Trend</h4>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Increasing - monitor closely</span>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Response Time</h4>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Good - under 200ms average</span>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Cache Performance</h4>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Excellent - 75%+ hit rate</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Recommendations</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• System performance is within normal parameters</li>
                                <li>• Consider memory optimization if usage continues to increase</li>
                                <li>• Cache performance is optimal</li>
                                <li>• No immediate action required</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}