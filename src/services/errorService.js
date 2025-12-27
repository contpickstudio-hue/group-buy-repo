import toast from 'react-hot-toast';

/**
 * Error Service
 * Provides error handling utilities including logging, toast notifications, and API call wrappers
 */

// Error logger with local storage persistence
export const ErrorLogger = {
  log: (error, context = {}) => {
    const errorData = {
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorData);
    }

    // Store in localStorage (limit to last 50 errors)
    try {
      const stored = localStorage.getItem('appErrors');
      const errors = stored ? JSON.parse(stored) : [];
      errors.unshift(errorData);
      if (errors.length > 50) {
        errors.pop();
      }
      localStorage.setItem('appErrors', JSON.stringify(errors));
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Failed to store error in localStorage:', e);
      }
    }

    // Send to error tracking service (if configured)
    // This can be extended to send to Sentry, LogRocket, etc.
  },

  getStoredErrors: () => {
    try {
      const stored = localStorage.getItem('appErrors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  clearStoredErrors: () => {
    try {
      localStorage.removeItem('appErrors');
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Failed to clear errors from localStorage:', e);
      }
    }
  }
};

/**
 * Show error toast notification
 */
export const showErrorToast = (message) => {
  return toast.error(message, {
    duration: 4000,
    position: 'top-right'
  });
};

/**
 * Show success toast notification
 */
export const showSuccessToast = (message) => {
  return toast.success(message, {
    duration: 3000,
    position: 'top-right'
  });
};

/**
 * Show warning toast notification
 */
export const showWarningToast = (message) => {
  return toast(message, {
    icon: '⚠️',
    duration: 4000,
    position: 'top-right'
  });
};

/**
 * Show info toast notification
 */
export const showInfoToast = (message) => {
  return toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    position: 'top-right'
  });
};

/**
 * Wrapper for API calls with automatic error handling
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const apiCall = async (operation, options = {}) => {
  const {
    showError = true,
    showSuccess = false,
    successMessage,
    errorMessage,
    logError = true
  } = options;

  try {
    const data = await operation();
    
    if (showSuccess && successMessage) {
      showSuccessToast(successMessage);
    }

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    // Extract error message from various possible formats
    // Supabase errors may have msg, message, error_description, or be a string
    let errorMsg = errorMessage;
    if (!errorMsg) {
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error?.msg) {
        errorMsg = error.msg;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (error?.error_description) {
        errorMsg = error.error_description;
      } else if (error?.error) {
        errorMsg = typeof error.error === 'string' ? error.error : error.error.message || error.error.msg;
      } else {
        errorMsg = 'An error occurred';
      }
    }
    
    if (logError) {
      ErrorLogger.log(error, { operation: operation.name, options });
    }

    if (showError) {
      showErrorToast(errorMsg);
    }

    return {
      success: false,
      data: null,
      error: errorMsg
    };
  }
};

/**
 * Higher-order function for error handling
 */
export const withErrorHandling = (operation, options = {}) => {
  return async (...args) => {
    return apiCall(() => operation(...args), options);
  };
};

/**
 * Initialize error tracking
 */
export const initializeErrorTracking = () => {
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      ErrorLogger.log(event.error, {
        type: 'unhandledError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      ErrorLogger.log(event.reason, {
        type: 'unhandledRejection'
      });
    });
  }
};

