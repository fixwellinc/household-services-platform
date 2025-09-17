"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/shared';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    Bell,
    Settings,
    Plus,
    Edit,
    Trash2,
    Play,
    Pause,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Shield
} from 'lucide-react';

interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: string;
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'warning' | 'critical';
    enabled: boolean;
    lastTriggered?: Date;
    consecutiveViolations: number;
    isActive: boolean;
}

interface Alert {
    id: string;
    ruleId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'warning' | 'critical';
    timestamp: Date;
    status: 'active' | 'acknowledged' | 'resolved';
    currentValue: number;
    threshold: number;
    metric: string;
    resolvedAt?: Date;
}

interface AlertingStats {
    totalRules: number;
    activeRules: number;
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    alertsBySeverity: {
        critical: number;
        high: number;
        medium: number;
        warning: number;
        low: number;
    };
    isMonitoring: boolean;
}

export default function AlertManagement() {
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<AlertingStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [showRuleForm, setShowRuleForm] = useState(false);

    // Form state for new/edit rule
    const [ruleForm, setRuleForm] = useState<{
        name: string;
        description: string;
        metric: string;
        condition: string;
        threshold: number;
        duration: number;
        severity: 'low' | 'medium' | 'high' | 'warning' | 'critical';
        enabled: boolean;
    }>({
        name: '',
        description: '',
        metric: 'cpu_usage',
        condition: 'greater_than',
        threshold: 80,
        duration: 300,
        severity: 'warning',
        enabled: true
    });

    useEffect(() => {
        fetchAlertData();
    }, []);

    const fetchAlertData = async () => {
        try {
            setLoading(true);

            // Fetch alert rules, alerts, and stats
            const [rulesResponse, alertsResponse, statsResponse] = await Promise.all([
                fetch('/api/admin/monitoring/alerting/rules', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                }),
                fetch('/api/admin/monitoring/alerting/alerts', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                }),
                fetch('/api/admin/monitoring/alerting/stats', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                })
            ]);

            if (rulesResponse.ok) {
                const rulesData = await rulesResponse.json();
                setAlertRules(rulesData.data || []);
            }

            if (alertsResponse.ok) {
                const alertsData = await alertsResponse.json();
                setAlerts(alertsData.data || []);
            }

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.data);
            }
        } catch (error) {
            console.error('Error fetching alert data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async () => {
        try {
            const response = await fetch('/api/admin/monitoring/alerting/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(ruleForm)
            });

            if (response.ok) {
                await fetchAlertData();
                setShowRuleForm(false);
                resetRuleForm();
            }
        } catch (error) {
            console.error('Error creating rule:', error);
        }
    };

    const handleUpdateRule = async () => {
        if (!editingRule) return;

        try {
            const response = await fetch(`/api/admin/monitoring/alerting/rules/${editingRule.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(ruleForm)
            });

            if (response.ok) {
                await fetchAlertData();
                setEditingRule(null);
                setShowRuleForm(false);
                resetRuleForm();
            }
        } catch (error) {
            console.error('Error updating rule:', error);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this alert rule?')) return;

        try {
            const response = await fetch(`/api/admin/monitoring/alerting/rules/${ruleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                await fetchAlertData();
            }
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const handleToggleRule = async (ruleId: string, enabled: boolean) => {
        try {
            const response = await fetch(`/api/admin/monitoring/alerting/rules/${ruleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ enabled })
            });

            if (response.ok) {
                await fetchAlertData();
            }
        } catch (error) {
            console.error('Error toggling rule:', error);
        }
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                await fetchAlertData();
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/resolve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                await fetchAlertData();
            }
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const startEditingRule = (rule: AlertRule) => {
        setEditingRule(rule);
        setRuleForm({
            name: rule.name,
            description: rule.description,
            metric: rule.metric,
            condition: rule.condition,
            threshold: rule.threshold,
            duration: rule.duration,
            severity: rule.severity,
            enabled: rule.enabled
        });
        setShowRuleForm(true);
    };

    const resetRuleForm = () => {
        setRuleForm({
            name: '',
            description: '',
            metric: 'cpu_usage',
            condition: 'greater_than',
            threshold: 80,
            duration: 300,
            severity: 'warning',
            enabled: true
        });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-red-100 text-red-800';
            case 'acknowledged':
                return 'bg-yellow-100 text-yellow-800';
            case 'resolved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'acknowledged':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Alert Management</h2>
                    <p className="text-gray-600">Configure automated monitoring and alerting rules</p>
                </div>
                <div className="flex items-center space-x-2">
                    {stats && (
                        <Badge className={stats.isMonitoring ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {stats.isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Active Rules</p>
                                    <p className="text-lg font-semibold">{stats.activeRules}/{stats.totalRules}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Active Alerts</p>
                                    <p className="text-lg font-semibold">{stats.activeAlerts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Resolved Alerts</p>
                                    <p className="text-lg font-semibold">{stats.resolvedAlerts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Total Alerts</p>
                                    <p className="text-lg font-semibold">{stats.totalAlerts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="rules" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="rules">Alert Rules</TabsTrigger>
                    <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
                    <TabsTrigger value="history">Alert History</TabsTrigger>
                </TabsList>

                {/* Alert Rules */}
                <TabsContent value="rules" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Alert Rules</h3>
                        <Button onClick={() => setShowRuleForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>

                    {/* Rule Form */}
                    {showRuleForm && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="rule-name">Rule Name</Label>
                                        <Input
                                            id="rule-name"
                                            value={ruleForm.name}
                                            onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                            placeholder="Enter rule name"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="rule-metric">Metric</Label>
                                        <Select
                                            id="rule-metric"
                                            value={ruleForm.metric}
                                            onChange={(e) => setRuleForm({ ...ruleForm, metric: e.target.value })}
                                        >
                                            <option value="cpu_usage">CPU Usage</option>
                                            <option value="memory_usage">Memory Usage</option>
                                            <option value="response_time">Response Time</option>
                                            <option value="cache_hit_rate">Cache Hit Rate</option>
                                            <option value="error_rate">Error Rate</option>
                                            <option value="disk_usage">Disk Usage</option>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="rule-condition">Condition</Label>
                                        <Select
                                            id="rule-condition"
                                            value={ruleForm.condition}
                                            onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
                                        >
                                            <option value="greater_than">Greater Than</option>
                                            <option value="less_than">Less Than</option>
                                            <option value="equals">Equals</option>
                                            <option value="not_equals">Not Equals</option>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="rule-threshold">Threshold</Label>
                                        <Input
                                            id="rule-threshold"
                                            type="number"
                                            value={ruleForm.threshold}
                                            onChange={(e) => setRuleForm({ ...ruleForm, threshold: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="rule-duration">Duration (seconds)</Label>
                                        <Input
                                            id="rule-duration"
                                            type="number"
                                            value={ruleForm.duration}
                                            onChange={(e) => setRuleForm({ ...ruleForm, duration: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="rule-severity">Severity</Label>
                                        <Select
                                            id="rule-severity"
                                            value={ruleForm.severity}
                                            onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value as any })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="warning">Warning</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="rule-description">Description</Label>
                                        <Input
                                            id="rule-description"
                                            value={ruleForm.description}
                                            onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                                            placeholder="Enter rule description"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 mt-4">
                                    <Button variant="outline" onClick={() => {
                                        setShowRuleForm(false);
                                        setEditingRule(null);
                                        resetRuleForm();
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={editingRule ? handleUpdateRule : handleCreateRule}>
                                        {editingRule ? 'Update Rule' : 'Create Rule'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rules List */}
                    <div className="grid grid-cols-1 gap-4">
                        {alertRules.map((rule) => (
                            <Card key={rule.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h4 className="font-medium">{rule.name}</h4>
                                                <Badge className={getSeverityColor(rule.severity)}>
                                                    {rule.severity}
                                                </Badge>
                                                {rule.isActive && (
                                                    <Badge className="bg-red-100 text-red-800">
                                                        ACTIVE
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                                            <div className="text-xs text-gray-500">
                                                {rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold}
                                                {rule.lastTriggered && (
                                                    <span className="ml-4">
                                                        Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                                            >
                                                {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEditingRule(rule)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteRule(rule.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Active Alerts */}
                <TabsContent value="alerts" className="space-y-6">
                    <h3 className="text-lg font-semibold">Active Alerts</h3>

                    <div className="space-y-4">
                        {alerts.filter(alert => alert.status === 'active').map((alert) => (
                            <Card key={alert.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {getStatusIcon(alert.status)}
                                                <h4 className="font-medium">{alert.title}</h4>
                                                <Badge className={getSeverityColor(alert.severity)}>
                                                    {alert.severity}
                                                </Badge>
                                                <Badge className={getStatusColor(alert.status)}>
                                                    {alert.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                            <div className="text-xs text-gray-500">
                                                Triggered: {new Date(alert.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                            >
                                                Acknowledge
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResolveAlert(alert.id)}
                                            >
                                                Resolve
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Alert History */}
                <TabsContent value="history" className="space-y-6">
                    <h3 className="text-lg font-semibold">Alert History</h3>

                    <div className="space-y-4">
                        {alerts.slice(0, 20).map((alert) => (
                            <Card key={alert.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {getStatusIcon(alert.status)}
                                                <h4 className="font-medium">{alert.title}</h4>
                                                <Badge className={getSeverityColor(alert.severity)}>
                                                    {alert.severity}
                                                </Badge>
                                                <Badge className={getStatusColor(alert.status)}>
                                                    {alert.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                            <div className="text-xs text-gray-500">
                                                Triggered: {new Date(alert.timestamp).toLocaleString()}
                                                {alert.resolvedAt && (
                                                    <span className="ml-4">
                                                        Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}