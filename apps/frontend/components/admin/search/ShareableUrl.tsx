import React, { useState } from 'react';
import { Share2, Copy, Mail, QrCode, Check, ExternalLink } from 'lucide-react';
import { useFilterStateSharing } from '../../../hooks/use-url-state';

interface ShareableUrlProps {
  url: string;
  title?: string;
  description?: string;
  onCopy?: (success: boolean) => void;
  className?: string;
}

export function ShareableUrl({
  url,
  title = "Search Results",
  description = "Check out these search results",
  onCopy,
  className = ""
}: ShareableUrlProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { copyToClipboard, shareViaEmail, generateQRCode } = useFilterStateSharing();

  // Handle click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset copy success after 2 seconds
  React.useEffect(() => {
    if (copySuccess) {
      const timeout = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copySuccess]);

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    setCopySuccess(success);
    onCopy?.(success);
    
    if (success) {
      setShowShareMenu(false);
    }
  };

  const handleEmailShare = () => {
    shareViaEmail(url, title);
    setShowShareMenu(false);
  };

  const handleQRCode = async () => {
    if (!qrCodeUrl) {
      const qrUrl = await generateQRCode(url);
      setQRCodeUrl(qrUrl);
    }
    setShowQRCode(true);
    setShowShareMenu(false);
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  if (!url) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        title="Share search results"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </button>

      {/* Share Menu */}
      {showShareMenu && (
        <div
          ref={dropdownRef}
          className="absolute z-50 right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Share Search Results</h3>
            
            {/* URL Display */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shareable URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-gray-600"
                />
                <button
                  onClick={handleCopy}
                  className={`
                    p-1 rounded transition-colors
                    ${copySuccess 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }
                  `}
                  title="Copy URL"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {copySuccess && (
                <p className="text-xs text-green-600 mt-1">URL copied to clipboard!</p>
              )}
            </div>

            {/* Share Options */}
            <div className="space-y-2">
              <button
                onClick={handleCopy}
                className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <Copy className="h-4 w-4 mr-3 text-gray-400" />
                Copy Link
              </button>

              <button
                onClick={handleEmailShare}
                className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <Mail className="h-4 w-4 mr-3 text-gray-400" />
                Share via Email
              </button>

              <button
                onClick={handleQRCode}
                className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <QrCode className="h-4 w-4 mr-3 text-gray-400" />
                Show QR Code
              </button>

              <button
                onClick={handleOpenInNewTab}
                className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <ExternalLink className="h-4 w-4 mr-3 text-gray-400" />
                Open in New Tab
              </button>
            </div>

            {/* URL Info */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                This URL contains your current search filters and can be bookmarked or shared with others.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center">
              {qrCodeUrl ? (
                <div>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for search results"
                    className="mx-auto mb-4 border border-gray-200 rounded"
                  />
                  <p className="text-sm text-gray-600">
                    Scan this QR code to access the search results on your mobile device.
                  </p>
                </div>
              ) : (
                <div className="py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Generating QR code...</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowQRCode(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for use in toolbars
interface CompactShareableUrlProps {
  url: string;
  onCopy?: (success: boolean) => void;
  className?: string;
}

export function CompactShareableUrl({
  url,
  onCopy,
  className = ""
}: CompactShareableUrlProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const { copyToClipboard } = useFilterStateSharing();

  // Reset copy success after 2 seconds
  React.useEffect(() => {
    if (copySuccess) {
      const timeout = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copySuccess]);

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    setCopySuccess(success);
    onCopy?.(success);
  };

  if (!url) {
    return null;
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center px-2 py-1 text-xs rounded transition-colors
        ${copySuccess 
          ? 'text-green-600 bg-green-50' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }
        ${className}
      `}
      title={copySuccess ? "URL copied!" : "Copy shareable URL"}
    >
      {copySuccess ? (
        <Check className="h-3 w-3 mr-1" />
      ) : (
        <Share2 className="h-3 w-3 mr-1" />
      )}
      {copySuccess ? 'Copied!' : 'Share'}
    </button>
  );
}

// URL validation component
interface UrlValidationProps {
  url: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  className?: string;
}

export function UrlValidation({
  url,
  onValidationChange,
  className = ""
}: UrlValidationProps) {
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  React.useEffect(() => {
    const validateUrl = () => {
      const validationErrors: string[] = [];
      let valid = true;

      try {
        const urlObj = new URL(url);
        
        // Check URL length
        if (url.length > 2048) {
          validationErrors.push('URL is too long (max 2048 characters)');
          valid = false;
        }

        // Check for potentially dangerous parameters
        const params = new URLSearchParams(urlObj.search);
        for (const [key, value] of Array.from(params.entries())) {
          if (value.includes('<script') || value.includes('javascript:')) {
            validationErrors.push('URL contains potentially dangerous content');
            valid = false;
            break;
          }
        }

        // Check for required parameters
        if (!params.has('q') && !params.has('filters')) {
          validationErrors.push('URL does not contain search parameters');
          valid = false;
        }

      } catch (error) {
        validationErrors.push('Invalid URL format');
        valid = false;
      }

      setIsValid(valid);
      setErrors(validationErrors);
      onValidationChange?.(valid, validationErrors);
    };

    if (url) {
      validateUrl();
    } else {
      setIsValid(true);
      setErrors([]);
      onValidationChange?.(true, []);
    }
  }, [url, onValidationChange]);

  if (isValid || !url) {
    return null;
  }

  return (
    <div className={`p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex items-start">
        <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 className="text-sm font-medium text-red-800">URL Validation Issues</h3>
          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}