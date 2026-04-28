// Toast utility helper - use this throughout the app
// Import this instead of using alert()

// Direct usage (when window.__toastContext is available)
export const toast = {
  success: (message, options = {}) => {
    if (window.__toastContext) {
      window.__toastContext.success(message, options);
    } else {
      console.warn('Toast context not available, falling back to alert:', message);
      alert(message);
    }
  },
  error: (message, options = {}) => {
    if (window.__toastContext) {
      window.__toastContext.error(message, options);
    } else {
      console.warn('Toast context not available, falling back to alert:', message);
      alert(message);
    }
  },
  warning: (message, options = {}) => {
    if (window.__toastContext) {
      window.__toastContext.warning(message, options);
    } else {
      console.warn('Toast context not available, falling back to alert:', message);
      alert(message);
    }
  },
  info: (message, options = {}) => {
    if (window.__toastContext) {
      window.__toastContext.info(message, options);
    } else {
      console.warn('Toast context not available, falling back to alert:', message);
      alert(message);
    }
  },
  show: (message, options = {}) => {
    if (window.__toastContext) {
      window.__toastContext.showToast(message, options);
    } else {
      console.warn('Toast context not available, falling back to alert:', message);
      alert(message);
    }
  }
};

export default toast;
