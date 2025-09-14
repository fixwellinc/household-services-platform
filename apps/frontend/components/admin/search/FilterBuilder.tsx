import React, { useState, useCallback } from 'react';
import { Plus, X, ChevronDown, Filter, Save, Trash2 } from 'lucide-react';
import { FilterConfig, FilterValue, FilterOperator, SavedSearch } from '../../../types/admin';

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  values?: any[];
}

interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: FilterRule[];
  groups?: FilterGroup[];
}

interface FilterBuilderProps {
  fields: FilterConfig[];
  initialFilters?: Record<string, FilterValue>;
  onFiltersChange: (filters: Record<string, FilterValue>) => void;
  savedSearches?: SavedSearch[];
  onSaveSearch?: (name: string, description?: string) => void;
  onLoadSearch?: (search: SavedSearch) => void;
  onDeleteSearch?: (id: string) => void;
  className?: string;
}

const DEFAULT_OPERATORS: FilterOperator[] = [
  { value: 'equals', label: 'Equals', type: 'equals' },
  { value: 'contains', label: 'Contains', type: 'contains' },
  { value: 'startsWith', label: 'Starts with', type: 'startsWith' },
  { value: 'endsWith', label: 'Ends with', type: 'endsWith' },
  { value: 'greater', label: 'Greater than', type: 'greater' },
  { value: 'less', label: 'Less than', type: 'less' },
  { value: 'between', label: 'Between', type: 'between' },
  { value: 'in', label: 'In', type: 'in' },
  { value: 'notIn', label: 'Not in', type: 'notIn' }
];

export function FilterBuilder({
  fields,
  initialFilters = {},
  onFiltersChange,
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  className = ""
}: FilterBuilderProps) {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(() => {
    // Convert initial filters to filter group format
    const rules: FilterRule[] = Object.entries(initialFilters).map(([field, filterValue]) => ({
      id: Math.random().toString(36).substr(2, 9),
      field,
      operator: filterValue.operator,
      value: filterValue.value,
      values: filterValue.values
    }));

    return {
      id: 'root',
      logic: 'AND',
      rules,
      groups: []
    };
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchDescription, setSaveSearchDescription] = useState('');

  // Convert filter group back to simple filters format
  const convertToSimpleFilters = useCallback((group: FilterGroup): Record<string, FilterValue> => {
    const filters: Record<string, FilterValue> = {};
    
    group.rules.forEach(rule => {
      if (rule.field && rule.operator && (rule.value !== undefined || rule.values)) {
        filters[rule.field] = {
          operator: rule.operator,
          value: rule.value,
          values: rule.values
        };
      }
    });

    return filters;
  }, []);

  // Update filters when filter group changes
  React.useEffect(() => {
    const filters = convertToSimpleFilters(filterGroup);
    onFiltersChange(filters);
  }, [filterGroup, convertToSimpleFilters, onFiltersChange]);

  const addRule = useCallback(() => {
    setFilterGroup(prev => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: Math.random().toString(36).substr(2, 9),
          field: '',
          operator: 'equals',
          value: ''
        }
      ]
    }));
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setFilterGroup(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroup(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterGroup({
      id: 'root',
      logic: 'AND',
      rules: [],
      groups: []
    });
  }, []);

  const getOperatorsForField = useCallback((fieldKey: string): FilterOperator[] => {
    const field = fields.find(f => f.key === fieldKey);
    if (field?.operators) {
      return field.operators;
    }

    // Return default operators based on field type
    switch (field?.type) {
      case 'text':
        return DEFAULT_OPERATORS.filter(op => 
          ['equals', 'contains', 'startsWith', 'endsWith', 'in', 'notIn'].includes(op.value)
        );
      case 'number':
        return DEFAULT_OPERATORS.filter(op => 
          ['equals', 'greater', 'less', 'between', 'in', 'notIn'].includes(op.value)
        );
      case 'date':
        return DEFAULT_OPERATORS.filter(op => 
          ['equals', 'greater', 'less', 'between'].includes(op.value)
        );
      case 'select':
      case 'multiselect':
        return DEFAULT_OPERATORS.filter(op => 
          ['equals', 'in', 'notIn'].includes(op.value)
        );
      case 'boolean':
        return DEFAULT_OPERATORS.filter(op => op.value === 'equals');
      default:
        return DEFAULT_OPERATORS;
    }
  }, [fields]);

  const renderValueInput = useCallback((rule: FilterRule) => {
    const field = fields.find(f => f.key === rule.field);
    if (!field) return null;

    const commonProps = {
      className: "px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            placeholder="Enter value..."
            {...commonProps}
          />
        );

      case 'number':
        if (rule.operator === 'between') {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={rule.values?.[0] || ''}
                onChange={(e) => updateRule(rule.id, { 
                  values: [e.target.value, rule.values?.[1] || ''] 
                })}
                placeholder="Min"
                {...commonProps}
                className={`${commonProps.className} w-24`}
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                value={rule.values?.[1] || ''}
                onChange={(e) => updateRule(rule.id, { 
                  values: [rule.values?.[0] || '', e.target.value] 
                })}
                placeholder="Max"
                {...commonProps}
                className={`${commonProps.className} w-24`}
              />
            </div>
          );
        }
        return (
          <input
            type="number"
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            placeholder="Enter number..."
            {...commonProps}
          />
        );

      case 'date':
        if (rule.operator === 'between') {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={rule.values?.[0] || ''}
                onChange={(e) => updateRule(rule.id, { 
                  values: [e.target.value, rule.values?.[1] || ''] 
                })}
                {...commonProps}
                className={`${commonProps.className} w-36`}
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={rule.values?.[1] || ''}
                onChange={(e) => updateRule(rule.id, { 
                  values: [rule.values?.[0] || '', e.target.value] 
                })}
                {...commonProps}
                className={`${commonProps.className} w-36`}
              />
            </div>
          );
        }
        return (
          <input
            type="date"
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            {...commonProps}
          />
        );

      case 'select':
        return (
          <select
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            {...commonProps}
          >
            <option value="">Select option...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <select
            multiple
            value={rule.values || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              updateRule(rule.id, { values });
            }}
            {...commonProps}
            className={`${commonProps.className} min-h-[80px]`}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <select
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value === 'true' })}
            {...commonProps}
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={rule.value || ''}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            placeholder="Enter value..."
            {...commonProps}
          />
        );
    }
  }, [fields, updateRule]);

  const handleSaveSearch = useCallback(() => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), saveSearchDescription.trim() || undefined);
      setSaveSearchName('');
      setSaveSearchDescription('');
      setShowSaveDialog(false);
    }
  }, [saveSearchName, saveSearchDescription, onSaveSearch]);

  const hasActiveFilters = filterGroup.rules.some(rule => 
    rule.field && rule.operator && (rule.value !== undefined || rule.values)
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {filterGroup.rules.filter(rule => rule.field && rule.operator).length} active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Saved Searches Dropdown */}
          {savedSearches.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const search = savedSearches.find(s => s.id === e.target.value);
                  if (search && onLoadSearch) {
                    onLoadSearch(search);
                  }
                }}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Load saved search...</option>
                {savedSearches.map(search => (
                  <option key={search.id} value={search.id}>
                    {search.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Save Search Button */}
          {hasActiveFilters && onSaveSearch && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </button>
          )}

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Rules */}
      <div className="p-4 space-y-3">
        {filterGroup.rules.map((rule, index) => (
          <div key={rule.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {/* Logic Operator (for rules after the first) */}
            {index > 0 && (
              <div className="flex items-center">
                <select
                  value={filterGroup.logic}
                  onChange={(e) => setFilterGroup(prev => ({ 
                    ...prev, 
                    logic: e.target.value as 'AND' | 'OR' 
                  }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
            )}

            {/* Field Selection */}
            <div className="flex-1 min-w-0">
              <select
                value={rule.field}
                onChange={(e) => updateRule(rule.id, { 
                  field: e.target.value, 
                  operator: 'equals', 
                  value: '', 
                  values: undefined 
                })}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select field...</option>
                {fields.map(field => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator Selection */}
            {rule.field && (
              <div className="flex-1 min-w-0">
                <select
                  value={rule.operator}
                  onChange={(e) => updateRule(rule.id, { 
                    operator: e.target.value, 
                    value: '', 
                    values: undefined 
                  })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {getOperatorsForField(rule.field).map(operator => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Value Input */}
            {rule.field && rule.operator && (
              <div className="flex-1 min-w-0">
                {renderValueInput(rule)}
              </div>
            )}

            {/* Remove Rule Button */}
            <button
              onClick={() => removeRule(rule.id)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add Rule Button */}
        <button
          onClick={addRule}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter Rule
        </button>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Search</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Name *
                </label>
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="Enter search name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saveSearchDescription}
                  onChange={(e) => setSaveSearchDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}