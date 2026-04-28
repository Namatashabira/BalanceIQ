import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }) => {
  const iconProps = { size: 20, strokeWidth: 2 };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="text-green-500" />;
    case 'error':
      return <XCircle {...iconProps} className="text-red-500" />;
    case 'warning':
      return <AlertCircle {...iconProps} className="text-yellow-500" />;
    case 'info':
    default:
      return <Info {...iconProps} className="text-blue-500" />;
  }
};

const ToastItem = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const bgColors = {
    success: 'bg-white dark:bg-gray-800',
    error: 'bg-white dark:bg-gray-800',
    warning: 'bg-white dark:bg-gray-800',
    info: 'bg-white dark:bg-gray-800'
  };

  const borderColors = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    warning: 'border-l-4 border-yellow-500',
    info: 'border-l-4 border-blue-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={`
        ${bgColors[toast.type]} ${borderColors[toast.type]}
        shadow-lg rounded-lg p-4 mb-3 min-w-[320px] max-w-md
        flex items-start gap-3
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
            {toast.title}
          </p>
        )}
        <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 4000;
    const title = options.title;

    setToasts((prev) => [...prev, { id, message, type, duration, title }]);
    return id;
  }, []);

  const success = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'error', duration: options.duration || 5000 });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
        <div className="pointer-events-auto">
          <AnimatePresence>
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// Helper function for backward compatibility with alert()
export const toast = {
  success: (message, options) => {
    if (window.__toastContext) {
      window.__toastContext.success(message, options);
    }
  },
  error: (message, options) => {
    if (window.__toastContext) {
      window.__toastContext.error(message, options);
    }
  },
  warning: (message, options) => {
    if (window.__toastContext) {
      window.__toastContext.warning(message, options);
    }
  },
  info: (message, options) => {
    if (window.__toastContext) {
      window.__toastContext.info(message, options);
    }
  },
  show: (message, options) => {
    if (window.__toastContext) {
      window.__toastContext.showToast(message, options);
    }
  }
};
