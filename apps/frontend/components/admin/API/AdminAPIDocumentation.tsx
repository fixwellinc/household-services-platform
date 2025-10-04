"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  Code, 
  Copy, 
  Download, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Shield,
  Database,
  Users,
  Settings,
  BarChart3,
  Mail,
  Monitor,
  Building2,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
}

interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

interface APIResponse {
  status: number;
  description: string;
  schema: any;
  example?: any;
}

interface APIExample {
  name: string;
  description: string;
  request: {
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  };
  response: {
    status: number;
    body: any;
  };
}

interface TestResult {
  id: string;
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'pending';
  duration: number;
  timestamp: string;
  request: any;
  response: any;
  error?: string;
}

export function AdminAPIDocumentation() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('documentation');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Mock API endpoints data
  const mockEndpoints: APIEndpoint[] = [
    {
      id: '1',
      method: 'GET',
      path: '/api/admin/dashboard/stats',
      description: 'Get dashboard statistics and metrics',
      category: 'Dashboard',
      requiresAuth: true,
      requiresAdmin: true,
      parameters: [],
      responses: [
        {
          status: 200,
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              stats: {
                type: 'object',
                properties: {
                  totalUsers: { type: 'number' },
                  totalRevenue: { type: 'number' },
                  activeBookings: { type: 'number' },
                  systemHealth: { type: 'string' }
                }
              }
            }
          },
          example: {
            success: true,
            stats: {
              totalUsers: 1250,
              totalRevenue: 45000,
              activeBookings: 89,
              systemHealth: 'healthy'
            }
          }
        }
      ],
      examples: [
        {
          name: 'Get Dashboard Stats',
          description: 'Retrieve current dashboard statistics',
          request: {
            headers: {
              'Authorization': 'Bearer your-token',
              'Content-Type': 'application/json'
            }
          },
          response: {
            status: 200,
            body: {
              success: true,
              stats: {
                totalUsers: 1250,
                totalRevenue: 45000,
                activeBookings: 89,
                systemHealth: 'healthy'
              }
            }
          }
        }
      ]
    },
    {
      id: '2',
      method: 'GET',
      path: '/api/admin/users',
      description: 'Get list of users with pagination and filtering',
      category: 'Users',
      requiresAuth: true,
      requiresAdmin: true,
      parameters: [
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'Page number for pagination',
          example: 1
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Number of users per page',
          example: 20
        },
        {
          name: 'search',
          type: 'string',
          required: false,
          description: 'Search term for filtering users',
          example: 'john'
        },
        {
          name: 'role',
          type: 'string',
          required: false,
          description: 'Filter by user role',
          example: 'customer'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              users: { type: 'array' },
              pagination: { type: 'object' }
            }
          }
        }
      ],
      examples: [
        {
          name: 'Get Users',
          description: 'Retrieve paginated list of users',
          request: {
            headers: {
              'Authorization': 'Bearer your-token'
            },
            query: {
              page: '1',
              limit: '20',
              search: 'john'
            }
          },
          response: {
            status: 200,
            body: {
              success: true,
              users: [
                {
                  id: '1',
                  name: 'John Doe',
                  email: 'john@example.com',
                  role: 'customer',
                  createdAt: '2024-01-15T10:30:00Z'
                }
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1250,
                pages: 63
              }
            }
          }
        }
      ]
    },
    {
      id: '3',
      method: 'POST',
      path: '/api/admin/users',
      description: 'Create a new user',
      category: 'Users',
      requiresAuth: true,
      requiresAdmin: true,
      parameters: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'User full name',
          example: 'John Doe'
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          description: 'User email address',
          example: 'john@example.com'
        },
        {
          name: 'role',
          type: 'string',
          required: true,
          description: 'User role',
          example: 'customer'
        },
        {
          name: 'password',
          type: 'string',
          required: true,
          description: 'User password',
          example: 'securepassword123'
        }
      ],
      responses: [
        {
          status: 201,
          description: 'User created successfully',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: { type: 'object' },
              message: { type: 'string' }
            }
          }
        },
        {
          status: 400,
          description: 'Validation error',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' }
            }
          }
        }
      ],
      examples: [
        {
          name: 'Create User',
          description: 'Create a new user account',
          request: {
            headers: {
              'Authorization': 'Bearer your-token',
              'Content-Type': 'application/json'
            },
            body: {
              name: 'John Doe',
              email: 'john@example.com',
              role: 'customer',
              password: 'securepassword123'
            }
          },
          response: {
            status: 201,
            body: {
              success: true,
              user: {
                id: '123',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'customer',
                createdAt: '2024-01-15T10:30:00Z'
              },
              message: 'User created successfully'
            }
          }
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading API documentation
    setTimeout(() => {
      setEndpoints(mockEndpoints);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || endpoint.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600 bg-green-100';
      case 'POST': return 'text-blue-600 bg-blue-100';
      case 'PUT': return 'text-yellow-600 bg-yellow-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'PATCH': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'Users': return <Users className="h-4 w-4" />;
      case 'Settings': return <Settings className="h-4 w-4" />;
      case 'Analytics': return <BarChart3 className="h-4 w-4" />;
      case 'Communications': return <Mail className="h-4 w-4" />;
      case 'Monitoring': return <Monitor className="h-4 w-4" />;
      case 'Tenants': return <Building2 className="h-4 w-4" />;
      case 'ML Analytics': return <Brain className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const toggleEndpointExpansion = (endpointId: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointId)) {
      newExpanded.delete(endpointId);
    } else {
      newExpanded.add(endpointId);
    }
    setExpandedEndpoints(newExpanded);
  };

  const runTest = async (endpoint: APIEndpoint, example: APIExample) => {
    const testId = `${endpoint.id}-${Date.now()}`;
    const testResult: TestResult = {
      id: testId,
      endpoint: endpoint.path,
      method: endpoint.method,
      status: 'pending',
      duration: 0,
      timestamp: new Date().toISOString(),
      request: example.request,
      response: null
    };

    setTestResults(prev => [testResult, ...prev]);

    try {
      const startTime = Date.now();
      
      const response = await request(endpoint.path, {
        method: endpoint.method,
        headers: example.request.headers,
        body: example.request.body ? JSON.stringify(example.request.body) : undefined
      });

      const duration = Date.now() - startTime;

      const updatedResult: TestResult = {
        ...testResult,
        status: 'success',
        duration,
        response: {
          status: 200,
          body: response
        }
      };

      setTestResults(prev => prev.map(r => r.id === testId ? updatedResult : r));
      showSuccess(`Test completed successfully in ${duration}ms`);
    } catch (err) {
      const duration = Date.now() - Date.now();
      const updatedResult: TestResult = {
        ...testResult,
        status: 'error',
        duration,
        error: err instanceof Error ? err.message : 'Unknown error'
      };

      setTestResults(prev => prev.map(r => r.id === testId ? updatedResult : r));
      showError('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  const exportDocumentation = () => {
    const doc = {
      title: 'FixWell Admin API Documentation',
      version: '1.0.0',
      baseUrl: 'https://api.fixwell.com',
      endpoints: endpoints
    };

    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixwell-admin-api-docs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Documentation exported successfully');
  };

  if (loading) {
    return <AdminLoadingState message="Loading API documentation..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load API documentation"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <AdminErrorBoundary context="AdminAPIDocumentation">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600">Complete API reference and testing tools</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={exportDocumentation}>
              <Download className="h-4 w-4 mr-2" />
              Export Docs
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Dashboard">Dashboard</SelectItem>
                  <SelectItem value="Users">Users</SelectItem>
                  <SelectItem value="Settings">Settings</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Communications">Communications</SelectItem>
                  <SelectItem value="Monitoring">Monitoring</SelectItem>
                  <SelectItem value="Tenants">Tenants</SelectItem>
                  <SelectItem value="ML Analytics">ML Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="testing">API Testing</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
          </TabsList>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <div className="space-y-4">
              {filteredEndpoints.map((endpoint) => (
                <Card key={endpoint.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-lg font-mono">{endpoint.path}</code>
                        <div className="flex items-center space-x-1 text-gray-600">
                          {getCategoryIcon(endpoint.category)}
                          <span className="text-sm">{endpoint.category}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEndpointExpansion(endpoint.id)}
                      >
                        {expandedEndpoints.has(endpoint.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-gray-600">{endpoint.description}</p>
                    
                    <div className="flex items-center space-x-2">
                      {endpoint.requiresAuth && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Auth Required
                        </Badge>
                      )}
                      {endpoint.requiresAdmin && (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin Only
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  {expandedEndpoints.has(endpoint.id) && (
                    <CardContent className="space-y-6">
                      {/* Parameters */}
                      {endpoint.parameters.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                          <div className="space-y-3">
                            {endpoint.parameters.map((param, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <code className="font-mono text-sm font-semibold">{param.name}</code>
                                    <Badge variant="outline" className="text-xs">
                                      {param.type}
                                    </Badge>
                                    {param.required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                                  {param.example && (
                                    <code className="text-xs text-gray-500 mt-1 block">
                                      Example: {JSON.stringify(param.example)}
                                    </code>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Responses */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Responses</h4>
                        <div className="space-y-3">
                          {endpoint.responses.map((response, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant={response.status < 400 ? 'default' : 'destructive'}>
                                  {response.status}
                                </Badge>
                                <span className="text-sm font-medium">{response.description}</span>
                              </div>
                              {response.example && (
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(response.example, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Examples */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Examples</h4>
                        <div className="space-y-4">
                          {endpoint.examples.map((example, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">{example.name}</h5>
                                <Button
                                  size="sm"
                                  onClick={() => runTest(endpoint, example)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Test
                                </Button>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <h6 className="font-medium text-gray-800 mb-2">Request</h6>
                                  <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                                    <div className="text-blue-400">{endpoint.method} {endpoint.path}</div>
                                    {example.request.headers && (
                                      <div className="mt-2">
                                        {Object.entries(example.request.headers).map(([key, value]) => (
                                          <div key={key} className="text-yellow-400">
                                            {key}: {value}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {example.request.body && (
                                      <div className="mt-2">
                                        <div className="text-gray-400">Body:</div>
                                        <pre className="mt-1">
                                          {JSON.stringify(example.request.body, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h6 className="font-medium text-gray-800 mb-2">Response</h6>
                                  <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                                    <div className="text-blue-400">Status: {example.response.status}</div>
                                    <pre className="mt-2">
                                      {JSON.stringify(example.response.body, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  API Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No tests run yet. Run some tests from the documentation tab.</p>
                    </div>
                  ) : (
                    testResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Badge className={getMethodColor(result.method)}>
                              {result.method}
                            </Badge>
                            <code className="text-sm">{result.endpoint}</code>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {result.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : result.status === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-sm text-gray-600">
                              {result.status === 'pending' ? 'Running...' : `${result.duration}ms`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-500">
                          <div>{new Date(result.timestamp).toLocaleTimeString()}</div>
                          {result.error && (
                            <div className="text-red-600">{result.error}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    JavaScript/TypeScript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
{`// Using fetch API
const response = await fetch('/api/admin/dashboard/stats', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);

// Using axios
import axios from 'axios';

const response = await axios.get('/api/admin/dashboard/stats', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

console.log(response.data);`}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    cURL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
{`curl -X GET "https://api.fixwell.com/api/admin/dashboard/stats" \\
  -H "Authorization: Bearer your-token" \\
  -H "Content-Type: application/json"

# POST request example
curl -X POST "https://api.fixwell.com/api/admin/users" \\
  -H "Authorization: Bearer your-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "password": "securepassword123"
  }'`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminErrorBoundary>
  );
}
