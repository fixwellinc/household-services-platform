import React from 'react';
import { Search, TrendingUp, Clock, Tag } from 'lucide-react';
import { SearchSuggestion } from '../../../types/admin';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isLoading?: boolean;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function SearchSuggestions({
  suggestions,
  isLoading = false,
  onSuggestionClick,
  className = ""
}: SearchSuggestionsProps) {
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'query':
        return <Search className="h-3 w-3" />;
      case 'entity':
        return <Tag className="h-3 w-3" />;
      case 'field':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'query':
        return 'text-blue-600';
      case 'entity':
        return 'text-green-600';
      case 'field':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Suggestions
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion.text)}
          className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
        >
          <span className={`mr-2 ${getSuggestionColor(suggestion.type)}`}>
            {getSuggestionIcon(suggestion.type)}
          </span>
          <span className="flex-1 truncate">{suggestion.text}</span>
          {suggestion.count && (
            <span className="ml-2 text-xs text-gray-400">
              {suggestion.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Real-time search suggestions component with debouncing
interface RealTimeSearchSuggestionsProps {
  entity: string;
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function RealTimeSearchSuggestions({
  entity,
  query,
  onSuggestionClick,
  className = ""
}: RealTimeSearchSuggestionsProps) {
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(
          `/api/admin/search/suggestions/${entity}?${params}`,
          {
            credentials: 'include',
            signal: abortControllerRef.current.signal
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        if (data.success) {
          // Transform string suggestions to SearchSuggestion objects
          const transformedSuggestions: SearchSuggestion[] = data.suggestions.map(
            (text: string) => ({
              text,
              type: 'query' as const
            })
          );
          setSuggestions(transformedSuggestions);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [entity, query]);

  return (
    <SearchSuggestions
      suggestions={suggestions}
      isLoading={isLoading}
      onSuggestionClick={onSuggestionClick}
      className={className}
    />
  );
}