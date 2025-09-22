"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NotificationToast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 w-full max-w-sm p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.titleColor}`}>
            {title}
          </h3>
          {message && (
            <p className={`text-sm mt-1 ${config.messageColor}`}>
              {message}
            </p>
          )}
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${
                  type === 'success' ? 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500' :
                  type === 'error' ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500' :
                  type === 'warning' ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500' :
                  'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Toast notification manager
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

let toastId = 0;
const toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...currentToasts]));
}

export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = {
      id,
      type: 'success',
      title,
      message,
      duration: 5000,
      ...options
    };
    currentToasts.push(newToast);
    notifyListeners();

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, newToast.duration);
    }
  },

  error: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = {
      id,
      type: 'error',
      title,
      message,
      duration: 0, // Error toasts don't auto-dismiss
      ...options
    };
    currentToasts.push(newToast);
    notifyListeners();
  },

  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = {
      id,
      type: 'warning',
      title,
      message,
      duration: 7000,
      ...options
    };
    currentToasts.push(newToast);
    notifyListeners();

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, newToast.duration);
    }
  },

  info: (title: string, message?: string, options?: Partial<Toast>) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = {
      id,
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    };
    currentToasts.push(newToast);
    notifyListeners();

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, newToast.duration);
    }
  },

  dismiss: (id: string) => {
    currentToasts = currentToasts.filter(toast => toast.id !== id);
    notifyListeners();
  },

  dismissAll: () => {
    currentToasts = [];
    notifyListeners();
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      const index = toastListeners.indexOf(setToasts);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toastItem) => (
        <NotificationToast
          key={toastItem.id}
          type={toastItem.type}
          title={toastItem.title}
          message={toastItem.message}
          duration={0} // Managed by the toast manager
          action={toastItem.action}
          onClose={() => toast.dismiss(toastItem.id)}
        />
      ))}
    </div>
  );
}