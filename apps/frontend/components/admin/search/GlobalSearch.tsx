import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Filter, Bookmark } from 'lucide-react';
import { useAdminSearch } from '../../../hooks/use-admin-search';
import { SearchResult } from '../../../types/admin';

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ 
  onResultClick, 
  placeholder = "Search users, subscriptions, bookings...",
  className = ""
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    results,
    isLoading,
    suggestions,
    isLoadingSuggestions,
    search,
    clearSearch
  } = useAdminSearch({
    autoSearch: true,
    debounceMs: 300
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5); // Keep only 5 recent searches
    
    setRecentSearches(updated);
    localStorage.setItem('admin-recent-searches', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSearch = (searchQuery?: string) => {
    const queryToUse = searchQuery || query;
    if (queryToUse.trim()) {
      saveRecentSearch(queryToUse.trim());
      search(queryToUse);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    saveRecentSearch(query);
    onResultClick?.(result);
    
    // Navigate to result URL
    window.location.href = result.url;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const handleClearSearch = () => {
    clearSearch();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('admin-recent-searches');
  };

  const showDropdown = isOpen && (
    query.length >= 2 || 
    recentSearches.length > 0 || 
    suggestions.length > 0
  );

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                   bg-white text-sm placeholder-gray-500"
        />
        
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Searching...
            </div>
          )}

          {/* Recent Searches */}
          {!isLoading && query.length < 2 && recentSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentQuery)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Clock className="h-3 w-3 mr-2 text-gray-400" />
                  {recentQuery}
                </button>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {!isLoading && query.length >= 2 && suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Search className="h-3 w-3 mr-2 text-gray-400" />
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results && results.results.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Results ({results.totalCount})
              </div>
              {results.results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </span>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 mt-1">
                          {result.subtitle}
                        </div>
                      )}
                      {result.description && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {result.description}
                        </div>
                      )}
                    </div>
                    {result.score && result.score > 0 && (
                      <div className="ml-2 text-xs text-gray-400">
                        {Math.round(result.score)}%
                      </div>
                    )}
                  </div>
                </button>
              ))}
              
              {results.totalCount > results.results.length && (
                <div className="px-4 py-2 text-center border-t border-gray-100">
                  <button
                    onClick={() => handleSearch()}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {results.totalCount} results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && results && results.results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <div>No results found for "{query}"</div>
              <div className="text-xs mt-1">Try adjusting your search terms</div>
            </div>
          )}

          {/* Search Tips */}
          {!isLoading && query.length < 2 && recentSearches.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <div>Start typing to search</div>
              <div className="text-xs mt-1">Search users, subscriptions, bookings, and more</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}