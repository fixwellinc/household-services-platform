'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkOperationsDemo } from './BulkOperationsDemo';
import { BulkOperationProgress } from './BulkOperationProgress';
import { BulkOperationSafetyMonitor } from './BulkOperationSafetyMonitor';
import { useBulkOperations } from '@/hooks/use-bulk-operations';
import {
    Settings,
    Activity,
    Shield,
    Database,
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react';

export function BulkOperationsManagement() {
    const [activeTab, setActiveTab] = useState<'operations' | 'monitoring' | 'safety'>('operations');
    const { activeOperations, operationHistory } = useBulkOperations();

    const tabs = [
        {
            id: 'operations' as const,
            label: 'Operations',
            icon: Database,
            description: 'Manage bulk operations'
        },
        {
            id: 'monitoring' as const,
            label: 'Monitoring',
            icon: Activity,
            description: 'Track active operations'
        },
        {
            id: 'safety' as const,
            label: 'Safety',
            icon: Shield,
            description: 'Safety features and metrics'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bulk Operations Management</h1>
                    <p className="text-gray-600">
                        Safely manage bulk operations with comprehensive safety controls and monitoring
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {activeOperations.length > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {activeOperations.length} active
                        </Badge>
                    )}
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Safety Enabled
                    </Badge>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <div>
                                <div className="text-sm text-gray-500">Active Operations</div>
                                <div className="text-xl font-bold">{activeOperations.length}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <div>
                                <div className="text-sm text-gray-500">Completed Today</div>
                                <div className="text-xl font-bold">0</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                                <div className="text-sm text-gray-500">Success Rate</div>
                                <div className="text-xl font-bold">95.5%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <div>
                                <div className="text-sm text-gray-500">Safety Score</div>
                                <div className="text-xl font-bold">100%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Card>
                <CardHeader>
                    <div className="flex space-x-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </CardHeader>

                <CardContent>
                    {activeTab === 'operations' && (
                        <div className="space-y-6">
                            <BulkOperationsDemo />
                        </div>
                    )}

                    {activeTab === 'monitoring' && (
                        <div className="space-y-6">
                            {activeOperations.length > 0 ? (
                                <BulkOperationProgress operations={activeOperations} />
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No Active Operations
                                    </h3>
                                    <p className="text-gray-500">
                                        Start a bulk operation to see real-time progress monitoring here.
                                    </p>
                                </div>
                            )}

                            {/* Operation History Preview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Operations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-4 text-gray-500">
                                        No recent operations to display
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'safety' && (
                        <div className="space-y-6">
                            <BulkOperationSafetyMonitor />

                            {/* Safety Guidelines */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                        Safety Guidelines
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-red-700 mb-2">Critical Operations</h4>
                                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                                <li>• Delete operations require additional confirmation</li>
                                                <li>• Admin users are protected from bulk modifications</li>
                                                <li>• Large operations (&gt;100 items) require elevated permissions</li>
                                                <li>• All critical operations are logged with full audit trails</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-yellow-700 mb-2">Rate Limits</h4>
                                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                                <li>• Delete: 100 items per minute</li>
                                                <li>• Suspend: 200 items per minute</li>
                                                <li>• Update: 500 items per minute</li>
                                                <li>• Activate: 1000 items per minute</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-green-700 mb-2">Safety Features</h4>
                                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                                <li>• Real-time progress tracking with cancellation support</li>
                                                <li>• Automatic rollback data capture for recovery</li>
                                                <li>• Comprehensive error reporting and analysis</li>
                                                <li>• Batch processing to prevent system overload</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}