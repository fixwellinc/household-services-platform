import React, { useState } from 'react';
import { Bookmark, Search, Edit2, Trash2, Share, Lock, Unlock, Calendar, User } from 'lucide-react';
import { SavedSearch } from '../../../types/admin';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onLoadSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
  onUpdateSearch?: (id: string, updates: Partial<SavedSearch>) => void;
  onShareSearch?: (id: string) => void;
  currentUserId?: string;
  className?: string;
}

export function SavedSearches({
  savedSearches,
  onLoadSearch,
  onDeleteSearch,
  onUpdateSearch,
  onShareSearch,
  currentUserId = 'current-user',
  className = ""
}: SavedSearchesProps) {
  const [editingSearch, setEditingSearch] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Group searches by ownership
  const mySearches = savedSearches.filter(search => search.createdBy === currentUserId);
  const sharedSearches = savedSearches.filter(search => 
    search.createdBy !== currentUserId && search.isPublic
  );

  const handleEditStart = (search: SavedSearch) => {
    setEditingSearch(search.id);
    setEditName(search.name);
    setEditDescription(search.description || '');
  };

  const handleEditSave = () => {
    if (editingSearch && onUpdateSearch) {
      onUpdateSearch(editingSearch, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        updatedAt: new Date()
      });
    }
    setEditingSearch(null);
    setEditName('');
    setEditDescription('');
  };

  const handleEditCancel = () => {
    setEditingSearch(null);
    setEditName('');
    setEditDescription('');
  };

  const handleTogglePublic = (search: SavedSearch) => {
    if (onUpdateSearch && search.createdBy === currentUserId) {
      onUpdateSearch(search.id, {
        isPublic: !search.isPublic,
        updatedAt: new Date()
      });
    }
  };

  const renderSearchItem = (search: SavedSearch) => {
    const isEditing = editingSearch === search.id;
    const isOwner = search.createdBy === currentUserId;
    const filterCount = Object.keys(search.filterState.filters).length;

    return (
      <div
        key={search.id}
        className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
      >
        {isEditing ? (
          // Edit Mode
          <div className="space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search name..."
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description (optional)..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editName.trim()}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {search.name}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {search.isPublic ? (
                      <Unlock className="h-3 w-3 text-green-500" />
                    ) : (
                      <Lock className="h-3 w-3 text-gray-400" />
                    )}
                    {!isOwner && (
                      <Share className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {search.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {search.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isOwner && onUpdateSearch && (
                  <button
                    onClick={() => handleEditStart(search)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Edit"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}
                {isOwner && onShareSearch && (
                  <button
                    onClick={() => handleTogglePublic(search)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title={search.isPublic ? "Make private" : "Make public"}
                  >
                    {search.isPublic ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => onDeleteSearch(search.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <Search className="h-3 w-3 mr-1" />
                  {search.entity}
                </span>
                {filterCount > 0 && (
                  <span className="flex items-center">
                    {filterCount} filter{filterCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!isOwner && (
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    Shared
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(search.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Query Preview */}
            {search.filterState.query && (
              <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                <span className="font-medium text-gray-700">Query: </span>
                <span className="text-gray-600">"{search.filterState.query}"</span>
              </div>
            )}

            {/* Filters Preview */}
            {filterCount > 0 && (
              <div className="mb-3 space-y-1">
                {Object.entries(search.filterState.filters).slice(0, 3).map(([field, filter]) => (
                  <div key={field} className="text-xs text-gray-600">
                    <span className="font-medium">{field}</span>
                    <span className="mx-1">{filter.operator}</span>
                    <span className="italic">
                      {Array.isArray(filter.values) 
                        ? filter.values.join(', ') 
                        : filter.value
                      }
                    </span>
                  </div>
                ))}
                {filterCount > 3 && (
                  <div className="text-xs text-gray-500">
                    +{filterCount - 3} more filter{filterCount - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Load Button */}
            <button
              onClick={() => onLoadSearch(search)}
              className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Load Search
            </button>
          </div>
        )}
      </div>
    );
  };

  if (savedSearches.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">No saved searches</h3>
        <p className="text-sm text-gray-500">
          Create and save search configurations to quickly access them later.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* My Searches */}
      {mySearches.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Bookmark className="h-4 w-4 mr-2" />
            My Searches ({mySearches.length})
          </h3>
          <div className="grid gap-3">
            {mySearches.map(renderSearchItem)}
          </div>
        </div>
      )}

      {/* Shared Searches */}
      {sharedSearches.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Share className="h-4 w-4 mr-2" />
            Shared Searches ({sharedSearches.length})
          </h3>
          <div className="grid gap-3">
            {sharedSearches.map(renderSearchItem)}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact saved searches dropdown for use in filter bars
interface SavedSearchesDropdownProps {
  savedSearches: SavedSearch[];
  onLoadSearch: (search: SavedSearch) => void;
  className?: string;
}

export function SavedSearchesDropdown({
  savedSearches,
  onLoadSearch,
  className = ""
}: SavedSearchesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search);
    setIsOpen(false);
  };

  if (savedSearches.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <Bookmark className="h-4 w-4 mr-2" />
        Saved Searches
        <span className="ml-1 text-xs text-gray-500">({savedSearches.length})</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Saved Searches
            </div>
            {savedSearches.map(search => (
              <button
                key={search.id}
                onClick={() => handleLoadSearch(search)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {search.name}
                    </div>
                    {search.description && (
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {search.description}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                      <span>{search.entity}</span>
                      <span>•</span>
                      <span>{Object.keys(search.filterState.filters).length} filters</span>
                      <span>•</span>
                      <span>{new Date(search.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {search.isPublic ? (
                      <Unlock className="h-3 w-3 text-green-500" />
                    ) : (
                      <Lock className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}