import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectFilterProps {
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  showCounts?: boolean;
  maxDisplayed?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  searchable = true,
  showCounts = false,
  maxDisplayed = 3,
  className = "",
  disabled = false
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggleOption = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allValues = filteredOptions.map(option => option.value);
    const newSelection = Array.from(new Set([...selectedValues, ...allValues]));
    onSelectionChange(newSelection);
  };

  const handleDeselectAll = () => {
    const filteredValues = filteredOptions.map(option => option.value);
    const newSelection = selectedValues.filter(value => !filteredValues.includes(value));
    onSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (selectedValues.length <= maxDisplayed) {
      const selectedOptions = options.filter(option => selectedValues.includes(option.value));
      return selectedOptions.map(option => option.label).join(', ');
    }

    return `${selectedValues.length} selected`;
  };

  const selectedFilteredCount = filteredOptions.filter(option => 
    selectedValues.includes(option.value)
  ).length;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          ${disabled 
            ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
            : 'hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
          ${selectedValues.length > 0 ? 'text-gray-900' : 'text-gray-500'}
        `}
      >
        <span className="block truncate">{getDisplayText()}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected Values Pills (when collapsed) */}
      {selectedValues.length > 0 && selectedValues.length <= maxDisplayed && !isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 flex flex-wrap gap-1 z-10">
          {selectedValues.slice(0, maxDisplayed).map(value => {
            const option = options.find(opt => opt.value === value);
            if (!option) return null;
            
            return (
              <span
                key={value}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {option.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleOption(value);
                  }}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {filteredOptions.length > 0 && (
            <div className="p-2 border-b border-gray-100 flex items-center justify-between text-xs">
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All ({filteredOptions.length})
                </button>
                {selectedFilteredCount > 0 && (
                  <button
                    onClick={handleDeselectAll}
                    className="text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Deselect All
                  </button>
                )}
              </div>
              {selectedValues.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchQuery ? 'No matching options' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleToggleOption(option.value)}
                    className={`
                      w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50
                      ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    <div className={`
                      flex-shrink-0 w-4 h-4 mr-3 border rounded flex items-center justify-center
                      ${isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    
                    <span className="flex-1 truncate">{option.label}</span>
                    
                    {showCounts && option.count !== undefined && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({option.count})
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Count */}
          {selectedValues.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-600 bg-gray-50">
              {selectedValues.length} of {options.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Real-time multi-select filter with API integration
interface RealTimeMultiSelectFilterProps extends Omit<MultiSelectFilterProps, 'options'> {
  entity: string;
  field: string;
  onOptionsLoad?: (options: Option[]) => void;
}

export function RealTimeMultiSelectFilter({
  entity,
  field,
  onOptionsLoad,
  ...props
}: RealTimeMultiSelectFilterProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load options from API
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real implementation, this would fetch field options from the API
        // For now, we'll use mock data based on entity and field
        const mockOptions = getMockOptions(entity, field);
        setOptions(mockOptions);
        onOptionsLoad?.(mockOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load options');
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [entity, field, onOptionsLoad]);

  if (isLoading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
        Loading options...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
        Error: {error}
      </div>
    );
  }

  return <MultiSelectFilter options={options} {...props} />;
}

// Mock function to generate options based on entity and field
function getMockOptions(entity: string, field: string): Option[] {
  const mockData: Record<string, Record<string, Option[]>> = {
    users: {
      role: [
        { value: 'ADMIN', label: 'Admin', count: 5 },
        { value: 'EMPLOYEE', label: 'Employee', count: 12 },
        { value: 'CUSTOMER', label: 'Customer', count: 1250 }
      ],
      isActive: [
        { value: 'true', label: 'Active', count: 1200 },
        { value: 'false', label: 'Inactive', count: 67 }
      ]
    },
    subscriptions: {
      tier: [
        { value: 'STARTER', label: 'Starter', count: 450 },
        { value: 'HOMECARE', label: 'Homecare', count: 320 },
        { value: 'PRIORITY', label: 'Priority', count: 180 }
      ],
      status: [
        { value: 'ACTIVE', label: 'Active', count: 850 },
        { value: 'CANCELLED', label: 'Cancelled', count: 85 },
        { value: 'PAUSED', label: 'Paused', count: 15 }
      ]
    },
    serviceRequests: {
      urgency: [
        { value: 'LOW', label: 'Low', count: 120 },
        { value: 'NORMAL', label: 'Normal', count: 340 },
        { value: 'HIGH', label: 'High', count: 85 },
        { value: 'EMERGENCY', label: 'Emergency', count: 12 }
      ],
      status: [
        { value: 'PENDING', label: 'Pending', count: 45 },
        { value: 'ASSIGNED', label: 'Assigned', count: 78 },
        { value: 'IN_PROGRESS', label: 'In Progress', count: 23 },
        { value: 'COMPLETED', label: 'Completed', count: 410 },
        { value: 'CANCELLED', label: 'Cancelled', count: 1 }
      ]
    }
  };

  return mockData[entity]?.[field] || [];
}